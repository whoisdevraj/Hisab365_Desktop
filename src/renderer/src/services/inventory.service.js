export const inventoryService = {
  getItems: async () => {
    return await window.api.db.select('SELECT * FROM inventory_items ORDER BY id DESC')
  },

  createItem: async (item) => {
    const sql = `
      INSERT INTO inventory_items (
        name, hsn_code, gst_percent, adValoremCess, nonAdValoremCess, 
        product_code, seeding_product_code, unit, rate, 
        latest_selling_rate, latest_purchasing_rate, 
        quantity, excess_qty, rejected_qty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      item.name,
      item.hsn_code || '',
      item.gst_percent || 0,
      item.adValoremCess || 0, // Schema Exact
      item.nonAdValoremCess || 0, // Schema Exact
      item.product_code || '',
      item.seeding_product_code || '', // Schema Exact
      item.unit || 'Pieces (PCS)',
      item.rate || 0, // Schema Exact
      item.latest_selling_rate || 0,
      item.latest_purchasing_rate || 0,
      item.quantity || 0,
      item.excess_qty || 0, // Schema Exact
      item.rejected_qty || 0 // Schema Exact
    ]
    return await window.api.db.execute(sql, params)
  },

  updateItem: async (id, item) => {
    const sql = `
      UPDATE inventory_items SET
        name = ?, hsn_code = ?, gst_percent = ?, adValoremCess = ?, nonAdValoremCess = ?, 
        product_code = ?, seeding_product_code = ?, unit = ?, rate = ?, 
        latest_selling_rate = ?, latest_purchasing_rate = ?, 
        quantity = ?, excess_qty = ?, rejected_qty = ?
      WHERE id = ?
    `
    const params = [
      item.name,
      item.hsn_code || '',
      item.gst_percent || 0,
      item.adValoremCess || 0,
      item.nonAdValoremCess || 0,
      item.product_code || '',
      item.seeding_product_code || '',
      item.unit || 'Pieces (PCS)',
      item.rate || 0,
      item.latest_selling_rate || 0,
      item.latest_purchasing_rate || 0,
      item.quantity || 0,
      item.excess_qty || 0,
      item.rejected_qty || 0,
      id
    ]
    return await window.api.db.execute(sql, params)
  },

  deleteItem: async (id) => {
    return await window.api.db.execute('DELETE FROM inventory_items WHERE id = ?', [id])
  }
}
