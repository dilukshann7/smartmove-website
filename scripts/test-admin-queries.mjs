// Run with: node --env-file=.env.local scripts/test-admin-queries.mjs
// Read-only check of the resource and dashboard SQL using SMARTMOVE_DATABASE_APP grants.
import { readFileSync } from "node:fs"
import oracledb from "oracledb"

const source = readFileSync(new URL("../lib/server/admin-data.ts", import.meta.url), "utf8")
const connection = await oracledb.getConnection({
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
})
try {
  let checked = 0
  for (const match of source.matchAll(/(\w+):\s*\{\s*select:\s*`([\s\S]*?)`,\s*filter:\s*`([\s\S]*?)`,\s*order:\s*`([\s\S]*?)`/g)) {
    const [, name, select, filter, order] = match
    await connection.execute(`${select} WHERE ${filter} ORDER BY ${order} OFFSET :offset ROWS FETCH NEXT 50 ROWS ONLY`,
      { pattern: "%", offset: 0 })
    console.log(`PASS ${name} list query`)
    checked++
  }
  if (checked !== 8) throw new Error(`Expected 8 resource queries; checked ${checked}`)
  const feedbackSource = source.slice(source.indexOf("async function loadAdminFeedback"), source.indexOf("export async function loadAdminSummary"))
  const feedbackSql = feedbackSource.match(/`(SELECT[\s\S]*?FETCH NEXT 50 ROWS ONLY)`/)?.[1]
  if (!feedbackSql) throw new Error("Feedback query not found")
  await connection.execute(feedbackSql, { pattern: "%", offset: 0 })
  console.log("PASS feedback list query")
  const summarySource = source.slice(source.indexOf("export async function loadAdminSummary"))
  const summarySql = summarySource.match(/`(SELECT[\s\S]*?FROM dual)`/)?.[1]
  if (!summarySql) throw new Error("Summary query not found")
  await connection.execute(summarySql)
  console.log("PASS dashboard summary query")
} finally { await connection.close() }
