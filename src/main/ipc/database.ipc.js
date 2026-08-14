import { ipcMain } from 'electron'
import { selectSql, executeSql } from '../services/db.service'

export function registerDatabaseIPC() {
  ipcMain.handle('db:select', async (_event, sql, params = []) => {
    try {
      return selectSql(sql, params)
    } catch (error) {
      console.error('IPC db:select Error:', error)
      throw error
    }
  })

  ipcMain.handle('db:execute', async (_event, sql, params = []) => {
    try {
      return executeSql(sql, params)
    } catch (error) {
      console.error('IPC db:execute Error:', error)
      throw error
    }
  })
}
