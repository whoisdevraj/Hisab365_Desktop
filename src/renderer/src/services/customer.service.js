export const customerService = {
  // Fetch all customers
  getCustomers: async () => {
    return await window.api.db.select('SELECT * FROM customers ORDER BY id DESC')
  },

  // Add a new customer
  addCustomer: async (customer) => {
    const sql = `
      INSERT INTO customers (name, phone_no, gst_no, pan_no, address, pincode, total_amount_receivable) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      customer.name,
      customer.phone_no || '',
      customer.gst_no || '',
      customer.pan_no || '',
      customer.address || '',
      customer.pincode || '',
      customer.total_amount_receivable || 0
    ]
    return await window.api.db.execute(sql, params)
  },

  // Update Customer
  updateCustomer: async (data) => {
    const sql = `
      UPDATE customers 
      SET name=?, phone_no=?, gst_no=?, pan_no=?, address=?, pincode=?
      WHERE id=?
    `
    const params = [
      data.name,
      data.phone_no || '',
      data.gst_no || '',
      data.pan_no || '',
      data.address || '',
      data.pincode || '',
      data.id
    ]
    return await window.api.db.execute(sql, params)
  },

  // Delete a customer
  deleteCustomer: async (id) => {
    return await window.api.db.execute('DELETE FROM customers WHERE id = ?', [id])
  }
}
