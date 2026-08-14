import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { schema } from '../database/schema'

let db = null

export function getDatabase() {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'database')

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'hisab365.db')
  console.log('📂 SQLite Database path:', dbPath)

  db = new Database(dbPath)
  db.pragma('foreign_keys = ON;')
  db.pragma('journal_mode = WAL;')

  return db
}

export function initDatabase() {
  try {
    const database = getDatabase()
    const initTransaction = database.transaction(() => {
      for (const [tableName, createQuery] of Object.entries(schema)) {
        try {
          database.exec(createQuery)
        } catch (tableErr) {
          console.error(`❌ Error creating table ${tableName}:`, tableErr)
        }
      }
    })

    initTransaction()
    console.log('✅ SQLite Database & Tables Initialized successfully')
  } catch (err) {
    console.error('❌ Database initialization failed:', err)
  }
}

export function selectSql(sql, params = []) {
  const database = getDatabase()
  const stmt = database.prepare(sql)
  return stmt.all(params)
}

export function executeSql(sql, params = []) {
  const database = getDatabase()
  const stmt = database.prepare(sql)
  return stmt.run(params)
}
