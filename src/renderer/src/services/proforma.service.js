export const proformaService = {
  getProformas: async () => {
    return await window.api.db.select(`
      SELECT p.*, c.name as customer_name 
      FROM proforma_invoices p 
      LEFT JOIN customers c ON p.customer_id = c.id 
      ORDER BY p.id DESC
    `)
  },

  createProforma: async (storeData) => {
    try {
      const nextIdRes = await window.api.db.select(
        'SELECT IFNULL(MAX(id), 0) + 1 as nextId FROM proforma_invoices'
      )
      const d = new Date()
      const dateString = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      const piNo = `PI-${dateString}-${String(nextIdRes[0].nextId).padStart(4, '0')}`

      const headerSql = `
        INSERT INTO proforma_invoices (
          proforma_no, quotation_id, customer_id, customer_po_no, 
          amount_excl_gst, gst_percent, gst_amount, 
          ad_valorem_cess_amount, non_ad_valorem_cess_amount, 
          total_amount, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      const totalGst =
        (storeData.igst_amount || 0) + (storeData.cgst_amount || 0) + (storeData.sgst_amount || 0)

      await window.api.db.execute(headerSql, [
        piNo,
        storeData.references?.quotation_id || null,
        storeData.partyId,
        storeData.references?.ref_customer_Po_no || '',
        storeData.amount_excl_gst || 0,
        0, // header level gst_percent fallback
        totalGst,
        storeData.cess_amount || 0, // ad_valorem_cess_amount tracking
        0, // non_ad_valorem_cess_amount tracking
        storeData.total_amount || 0,
        new Date().toISOString()
      ])

      const idRes = await window.api.db.select('SELECT last_insert_rowid() as id')
      const proformaId = idRes[0].id

      for (const line of storeData.lines) {
        if (line.lineType === 'item') {
          const itemSql = `
            INSERT INTO proforma_invoice_items (
              proforma_invoice_id, item_id, quantity, rate, discount, 
              gst_percent, cess_percent, cess_flat, amount_excl_gst, gst_amount, cess_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          await window.api.db.execute(itemSql, [
            proformaId,
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
      return {
        success: true,
        proformaId,
        proformaNo: piNo // 👈 Map it here (or just rename the variable above to proformaNo)
      }
    } catch (error) {
      throw error
    }
  },

  getProformaWithItems: async (id) => {
    try {
      const headerRes = await window.api.db.select('SELECT * FROM proforma_invoices WHERE id = ?', [
        id
      ])
      if (headerRes.length === 0) return null

      const itemsSql = `
        SELECT 
          pii.*, ii.name, ii.hsn_code as hsn_sac, pii.item_id as entityId
        FROM proforma_invoice_items pii
        LEFT JOIN inventory_items ii ON pii.item_id = ii.id
        WHERE pii.proforma_invoice_id = ?
      `
      const items = await window.api.db.select(itemsSql, [id])
      return { ...headerRes[0], items }
    } catch (error) {
      throw error
    }
  },

  updateProforma: async (id, storeData) => {
    try {
      const headerSql = `
        UPDATE proforma_invoices SET
          customer_id = ?, customer_po_no = ?, 
          amount_excl_gst = ?, gst_percent = ?, gst_amount = ?, 
          ad_valorem_cess_amount = ?, non_ad_valorem_cess_amount = ?, 
          total_amount = ?
        WHERE id = ?
      `
      const totalGst =
        (storeData.igst_amount || 0) + (storeData.cgst_amount || 0) + (storeData.sgst_amount || 0)

      await window.api.db.execute(headerSql, [
        storeData.partyId,
        storeData.references?.ref_customer_Po_no || '',
        storeData.amount_excl_gst || 0,
        0,
        totalGst,
        storeData.cess_amount || 0,
        0,
        storeData.total_amount || 0,
        id
      ])

      // Clear old items
      await window.api.db.execute(
        'DELETE FROM proforma_invoice_items WHERE proforma_invoice_id = ?',
        [id]
      )

      // Insert updated items
      for (const line of storeData.lines) {
        if (line.lineType === 'item') {
          const itemSql = `
            INSERT INTO proforma_invoice_items (
              proforma_invoice_id, item_id, quantity, rate, discount, 
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
      return { success: true, proformaId: id }
    } catch (error) {
      throw error
    }
  },

  deleteProforma: async (id) => {
    try {
      await window.api.db.execute(
        'DELETE FROM proforma_invoice_items WHERE proforma_invoice_id = ?',
        [id]
      )
      await window.api.db.execute('DELETE FROM proforma_invoices WHERE id = ?', [id])
      return { success: true, message: 'Proforma deleted successfully.' }
    } catch (error) {
      throw error
    }
  }
}
