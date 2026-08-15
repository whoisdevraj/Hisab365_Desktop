export const invoiceService = {
  getInvoices: async () => {
    return await window.api.db.select(`
      SELECT i.*, c.name as customer_name 
      FROM customer_invoices i 
      LEFT JOIN customers c ON i.customer_id = c.id 
      ORDER BY i.id DESC
    `)
  },

  createInvoice: async (storeData) => {
    try {
      const nextIdRes = await window.api.db.select(
        'SELECT IFNULL(MAX(id), 0) + 1 as nextId FROM customer_invoices'
      )
      const d = new Date()
      const dateString = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      const invNo = `INV-${dateString}-${String(nextIdRes[0].nextId).padStart(4, '0')}`

      const headerSql = `
        INSERT INTO customer_invoices (
          invoice_no, quotation_id, customer_id, ref_customer_Po_no,
          amount_excl_gst, gst_amount, ad_valorem_cess_amount, non_ad_valorem_cess_amount,
          total_amount, created_at, delivery_terms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      const totalGst =
        (storeData.igst_amount || 0) + (storeData.cgst_amount || 0) + (storeData.sgst_amount || 0)

      await window.api.db.execute(headerSql, [
        invNo,
        storeData.references?.quotation_id || null,
        storeData.partyId,
        storeData.references?.ref_customer_Po_no || '',
        storeData.amount_excl_gst || 0,
        totalGst,
        storeData.cess_amount || 0, // ad_valorem_cess_amount tracking
        0, // non_ad_valorem_cess_amount tracking
        storeData.total_amount || 0,
        new Date().toISOString(),
        storeData.logistics?.delivery_terms || ''
      ])

      const idRes = await window.api.db.select('SELECT last_insert_rowid() as id')
      const invoiceId = idRes[0].id

      for (const line of storeData.lines) {
        if (line.lineType === 'item') {
          const itemSql = `
            INSERT INTO customer_invoice_items (
              customer_invoice_id, item_id, quantity, rate, discount, 
              gst_percent, cess_percent, cess_flat, amount_excl_gst, gst_amount, cess_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          await window.api.db.execute(itemSql, [
            invoiceId,
            line.entityId,
            line.quantity || 0,
            line.rate || 0,
            line.discount_percent || 0,
            line.gst_percent || 0,
            line.cess_percent || 0,
            line.cess_flat || 0,
            line.amount_excl_gst || 0,
            line.gst_amount || 0,
            line.cess_amount || 0,
            line.total_amount || 0
          ])
        }
      }
      return { success: true, invoiceId, invoiceNo: invNo }
    } catch (error) {
      throw error
    }
  },
  // ... Keep your existing getInvoices and createInvoice ...

  getInvoiceWithItems: async (id) => {
    try {
      const headerRes = await window.api.db.select('SELECT * FROM customer_invoices WHERE id = ?', [
        id
      ])
      if (headerRes.length === 0) return null

      const itemsSql = `
        SELECT 
          cii.*, ii.name, ii.hsn_code as hsn_sac, cii.item_id as entityId
        FROM customer_invoice_items cii
        LEFT JOIN inventory_items ii ON cii.item_id = ii.id
        WHERE cii.customer_invoice_id = ?
      `
      const items = await window.api.db.select(itemsSql, [id])
      return { ...headerRes[0], items }
    } catch (error) {
      throw error
    }
  },

  updateInvoice: async (id, storeData) => {
    try {
      const headerSql = `
        UPDATE customer_invoices SET
          customer_id = ?, ref_customer_Po_no = ?,
          amount_excl_gst = ?, gst_amount = ?, 
          ad_valorem_cess_amount = ?, non_ad_valorem_cess_amount = ?,
          total_amount = ?, delivery_terms = ?
        WHERE id = ?
      `
      const totalGst =
        (storeData.igst_amount || 0) + (storeData.cgst_amount || 0) + (storeData.sgst_amount || 0)

      await window.api.db.execute(headerSql, [
        storeData.partyId,
        storeData.references?.ref_customer_Po_no || '',
        storeData.amount_excl_gst || 0,
        totalGst,
        storeData.cess_amount || 0,
        0,
        storeData.total_amount || 0,
        storeData.logistics?.delivery_terms || '',
        id
      ])

      await window.api.db.execute(
        'DELETE FROM customer_invoice_items WHERE customer_invoice_id = ?',
        [id]
      )

      for (const line of storeData.lines) {
        if (line.lineType === 'item') {
          const itemSql = `
            INSERT INTO customer_invoice_items (
              customer_invoice_id, item_id, quantity, rate, discount, 
              gst_percent, cess_percent, cess_flat, amount_excl_gst, gst_amount, cess_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          await window.api.db.execute(itemSql, [
            id,
            line.entityId,
            line.quantity || 0,
            line.rate || 0,
            line.discount_percent || 0,
            line.gst_percent || 0,
            line.cess_percent || 0,
            line.cess_flat || 0,
            line.amount_excl_gst || 0,
            line.gst_amount || 0,
            line.cess_amount || 0,
            line.total_amount || 0
          ])
        }
      }
      return { success: true, invoiceId: id }
    } catch (error) {
      throw error
    }
  },

  deleteInvoice: async (id) => {
    try {
      await window.api.db.execute(
        'DELETE FROM customer_invoice_items WHERE customer_invoice_id = ?',
        [id]
      )
      await window.api.db.execute('DELETE FROM customer_invoices WHERE id = ?', [id])
      return { success: true, message: 'Invoice deleted successfully.' }
    } catch (error) {
      throw error
    }
  }
}
