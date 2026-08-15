export const vendorService = {
  // Fetch all vendors
  getVendors: async () => {
    return await window.api.db.select('SELECT * FROM vendors ORDER BY id DESC')
  },

  // Add a new vendor
  addVendor: async (vendor) => {
    const sql = `
      INSERT INTO vendors (name, phone_no, gst_no, pan_no, address, pincode, total_amount_payment_due) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      vendor.name,
      vendor.phone_no || '',
      vendor.gst_no || '',
      vendor.pan_no || '',
      vendor.address || '',
      vendor.pincode || '',
      vendor.total_amount_payment_due || 0 // Note: Tracking Payable instead of Receivable
    ]
    return await window.api.db.execute(sql, params)
  },
  //update a vendor
  updateVendor: async (data) => {
    const sql = `
      UPDATE vendors 
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

  // Delete a vendor
  deleteVendor: async (id) => {
    return await window.api.db.execute('DELETE FROM vendors WHERE id = ?', [id])
  }
}
