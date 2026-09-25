// Run with: node --env-file=.env.local scripts/test-passenger-mongo.mjs
// Test documents are removed; Oracle feedback inserts are rolled back.
import assert from "node:assert/strict"
import oracledb from "oracledb"
import { MongoClient } from "mongodb"

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
const mongo = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 3500,
})
let oracle
let db
const runId = `portal-test-${process.pid}-${Date.now()}`
const testUser = runId
const mongoIds = []

try {
  await mongo.connect()
  db = mongo.db(process.env.MONGODB_DB)
  oracle = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
  })
  await db
    .collection("feedback_content")
    .createIndex({ feedbackId: 1 }, { unique: true })
  await db.collection("notifications").createIndex(
    { userId: 1, eventKey: 1 },
    {
      unique: true,
      partialFilterExpression: { eventKey: { $type: "string" } },
    }
  )

  const notices = db.collection("notifications")
  const key = `${runId}:event`
  for (let i = 0; i < 2; i++) {
    await notices.updateOne(
      { userId: testUser, eventKey: key },
      {
        $setOnInsert: {
          userId: testUser,
          eventKey: key,
          message: "Test",
          isRead: false,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )
  }
  assert.equal(
    await notices.countDocuments({ userId: testUser, eventKey: key }),
    1
  )
  await notices.updateOne(
    { userId: testUser, eventKey: key },
    { $set: { isRead: true } }
  )
  assert.equal(
    (await notices.findOne({ userId: testUser, eventKey: key })).isRead,
    true
  )
  console.log("PASS notification event deduplication and read state")

  const sample = await db
    .collection("feedback_content")
    .findOne({ feedbackId: "1" })
  assert.ok(sample?.reply?.message, "existing sample staff reply is readable")
  console.log("PASS existing staff reply remains readable")

  async function nextId() {
    const result = await oracle.execute(
      "SELECT smartmove_database.web_feedback_seq.NEXTVAL FEEDBACK_ID FROM dual"
    )
    return result.rows[0].FEEDBACK_ID
  }
  async function insertOracle(id) {
    await oracle.execute(
      "BEGIN smartmove_database.web_submit_feedback(:id, 3, 1, 'COMPLAINT'); END;",
      { id }
    )
  }
  async function oracleCount(id) {
    const result = await oracle.execute(
      "SELECT COUNT(*) CNT FROM smartmove_database.feedback_records WHERE feedback_id = :id",
      { id }
    )
    return result.rows[0].CNT
  }

  const failedMongoId = await nextId()
  mongoIds.push(String(failedMongoId))
  await db
    .collection("feedback_content")
    .insertOne({ feedbackId: String(failedMongoId), comment: runId })
  await insertOracle(failedMongoId)
  try {
    await db
      .collection("feedback_content")
      .insertOne({ feedbackId: String(failedMongoId), comment: runId })
    assert.fail("Expected MongoDB unique key failure")
  } catch (error) {
    assert.equal(error.code, 11000)
    await oracle.rollback()
  }
  assert.equal(await oracleCount(failedMongoId), 0)
  console.log("PASS MongoDB write failure rolls back Oracle feedback")

  const failedOracleId = await nextId()
  mongoIds.push(String(failedOracleId))
  await insertOracle(failedOracleId)
  await db
    .collection("feedback_content")
    .insertOne({ feedbackId: String(failedOracleId), comment: runId })
  await oracle.rollback()
  await db
    .collection("feedback_content")
    .deleteOne({ feedbackId: String(failedOracleId) })
  assert.equal(await oracleCount(failedOracleId), 0)
  assert.equal(
    await db
      .collection("feedback_content")
      .countDocuments({ feedbackId: String(failedOracleId) }),
    0
  )
  console.log("PASS Oracle failure compensation removes MongoDB content")
} finally {
  await oracle?.rollback()
  await oracle?.close()
  if (db) {
    await db.collection("notifications").deleteMany({ userId: testUser })
    if (mongoIds.length)
      await db
        .collection("feedback_content")
        .deleteMany({ feedbackId: { $in: mongoIds }, comment: runId })
  }
  await mongo.close()
}
