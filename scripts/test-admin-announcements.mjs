// Run with: node --env-file=.env.local scripts/test-admin-announcements.mjs
// Creates a temporary document and removes it in finally.
import assert from "node:assert/strict"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()
const collection = client.db(process.env.MONGODB_DB).collection("announcements")
let id
try {
  const sample = await collection.findOne({ title: "Arrive early", audience: "PASSENGERS" })
  assert.ok(sample)
  assert.equal(sample.status, undefined)
  console.log("PASS legacy sample remains published by default")
  const created = await collection.insertOne({ title: "Admin test notice", body: "Temporary test announcement.",
    audience: "PASSENGERS", status: "DRAFT", createdAt: new Date() })
  id = created.insertedId
  const publicFilter = { audience: "PASSENGERS", $or: [{ status: "PUBLISHED" }, { status: { $exists: false } }] }
  assert.equal(await collection.countDocuments({ ...publicFilter, _id: id }), 0)
  await collection.updateOne({ _id: id }, { $set: { status: "PUBLISHED", publishedAt: new Date() } })
  assert.equal(await collection.countDocuments({ ...publicFilter, _id: id }), 1)
  await collection.updateOne({ _id: id }, { $set: { status: "ARCHIVED" } })
  assert.equal(await collection.countDocuments({ ...publicFilter, _id: id }), 0)
  console.log("PASS draft, publish and archive visibility")
} finally {
  if (id) await collection.deleteOne({ _id: id })
  await client.close()
}
