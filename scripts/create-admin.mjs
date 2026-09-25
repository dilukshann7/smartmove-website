// Local one-time setup: node scripts/create-admin.mjs
// Requires SQL*Plus local OS SYSDBA access. Never sends the password to SQL*Plus.
import { randomBytes, scrypt as scryptCallback } from "node:crypto"
import { promisify } from "node:util"
import { spawnSync } from "node:child_process"
import { createInterface } from "node:readline/promises"

const scrypt = promisify(scryptCallback)
const rl = createInterface({ input: process.stdin, output: process.stdout })
const email = (await rl.question("New admin email: ")).trim().toLowerCase()
rl.close()
if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) || email.length > 100) {
  throw new Error("Enter a valid email address.")
}
if (!process.stdin.isTTY) throw new Error("Run this command in an interactive terminal.")

function hiddenPassword() {
  return new Promise((resolve, reject) => {
    let value = ""
    let finished = false
    process.stdout.write("New admin password (12+ characters): ")
    const finish = (error) => {
      if (finished) return
      finished = true
      process.stdin.off("data", onData)
      process.stdin.off("error", onError)
      let restoreError
      try {
        process.stdin.setRawMode(false)
      } catch (cause) {
        restoreError = cause
      }
      process.stdin.pause()
      process.stdout.write("\n")
      if (error) reject(error)
      else if (restoreError) reject(restoreError)
      else resolve(value)
    }
    const onError = (error) => finish(error)
    const onData = (data) => {
      for (const ch of data.toString("utf8")) {
        if (ch === "\r" || ch === "\n") return finish()
        if (ch === "\u0003") return finish(new Error("Cancelled."))
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1)
        else value += ch
      }
    }
    try {
      process.stdin.setRawMode(true)
      process.stdin.on("data", onData)
      process.stdin.once("error", onError)
      process.stdin.resume()
    } catch (error) {
      finish(error)
    }
  })
}

const password = await hiddenPassword()
if (password.length < 12 || password.length > 128) throw new Error("Password must be 12–128 characters.")
const salt = randomBytes(16).toString("hex")
const derived = await scrypt(password, salt, 64)
const hash = `scrypt:${salt}:${derived.toString("hex")}`
const sql = `CONNECT / AS SYSDBA
ALTER SESSION SET CONTAINER=XEPDB1;
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
INSERT INTO smartmove_database.app_users (user_id,email,password_hash,role)
VALUES (smartmove_database.web_user_seq.NEXTVAL, '${email}', '${hash}', 'ADMIN');
COMMIT;
EXIT
`
const result = spawnSync("sqlplus", ["-S", "/nolog"], { input: sql, encoding: "utf8" })
if (result.status !== 0 || result.error) {
  throw new Error(`Admin setup failed: ${result.error?.message ?? result.stdout.trim()}`)
}
console.log(`ADMIN account created for ${email}. You can now sign in through /login.`)
