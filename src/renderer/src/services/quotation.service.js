export const quotationService = {
  getQuotations: async () => {
    return await window.api.db.select('SELECT * FROM quotations ORDER BY id DESC')
  },

  getAvailableQuotations: async (targetDocType) => {
    try {
      let query = 'SELECT * FROM quotations ORDER BY id DESC'
      if (targetDocType === 'proforma') {
        query = `SELECT * FROM quotations WHERE id NOT IN (SELECT quotation_id FROM proforma_invoices WHERE quotation_id IS NOT NULL) ORDER BY id DESC`
      } else if (targetDocType === 'invoices') {
        query = `SELECT * FROM quotations WHERE id NOT IN (SELECT quotation_id FROM customer_invoices WHERE quotation_id IS NOT NULL) ORDER BY id DESC`
      } else if (targetDocType === 'challans') {
        query = `SELECT * FROM quotations WHERE id NOT IN (SELECT quotation_id FROM delivery_challans WHERE quotation_id IS NOT NULL) ORDER BY id DESC`
      }
      return await window.api.db.select(query)
    } catch (error) {
      return await window.api.db.select('SELECT * FROM quotations ORDER BY id DESC')
    }
  },

  getQuotationWithItems: async (id) => {
    try {
      // 1. Fetch Header
      const headerRes = await window.api.db.select('SELECT * FROM quotations WHERE id = ?', [id])
      if (headerRes.length === 0) return null

      // 2. Fetch Items
      const itemsSql = `
        SELECT 
          qi.*, ii.name, ii.hsn_code as hsn_sac, qi.item_id as entityId, 'item' as lineType
        FROM quotation_items qi
        LEFT JOIN inventory_items ii ON qi.item_id = ii.id
        WHERE qi.quotation_id = ?
      `
      const items = await window.api.db.select(itemsSql, [id])

      // 3. Fetch Services
      const servicesSql = `
        SELECT 
          qs.*, s.description as name, s.sac_code as hsn_sac, qs.service_id as entityId, 'service' as lineType
        FROM quotation_services qs
        LEFT JOIN services s ON qs.service_id = s.id
        WHERE qs.quotation_id = ?
      `
      const services = await window.api.db.select(servicesSql, [id])

      // 4. Merge and return
      return {
        ...headerRes[0],
        lines: [...items, ...services]
      }
    } catch (error) {
      throw error
    }
  },

  createQuotation: async (storeData) => {
    try {
      // 1. LOG THE RAW DATA COMING FROM THE UI STORE
      console.log('📦 1. RAW STORE DATA RECEIVED:', storeData)

      const nextIdRes = await window.api.db.select(
        'SELECT IFNULL(MAX(id), 0) + 1 as nextId FROM quotations'
      )
      const d = new Date()
      const dateString = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      const quotationNo = `QT-${dateString}-${String(nextIdRes[0].nextId).padStart(4, '0')}`

      const headerSql = `
        INSERT INTO quotations (
          quotation_no, customer_id, customer_name, customer_gst_no,
          customer_phone_no, customer_address, shipped_to_address,
          gstin_type, sgst_amount, cgst_amount, igst_amount,
          ad_valorem_cess_amount, non_ad_valorem_cess_amount,
          amount_excl_gst, total_amount, ref_enquiry_no, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      // 2. EXTRACT AND LOG THE HEADER PAYLOAD GOING TO SQLITE
      const headerParams = [
        quotationNo,
        storeData.partyId,
        storeData.partyName,
        storeData.partyGst || '',
        storeData.partyPhone || '',
        storeData.partyAddress || '',
        storeData.logistics?.shipped_to_address || '',
        storeData.gstin_type,
        storeData.sgst_amount || 0,
        storeData.cgst_amount || 0,
        storeData.igst_amount || 0,
        storeData.cess_amount || 0,
        0,
        storeData.amount_excl_gst || 0,
        storeData.total_amount || 0,
        storeData.references?.ref_enquiry_no || '',
        new Date().toISOString()
      ]
      console.log('📝 2. HEADER PARAMS SENT TO SQL:', headerParams)

      await window.api.db.execute(headerSql, headerParams)

      const idRes = await window.api.db.select('SELECT last_insert_rowid() as id')
      const quotationId = idRes[0].id

      // 3. EXTRACT AND LOG THE LINE PAYLOADS GOING TO SQLITE
      for (const line of storeData.lines) {
        if (line.lineType === 'item') {
          const itemSql = `
            INSERT INTO quotation_items (
              quotation_id, item_id, quantity, rate, discount, 
              gst_percent, cess_percent, cess_flat, amount_excl_gst, gst_amount, cess_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          const itemParams = [
            quotationId,
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
          ]
          console.log('🛒 3a. ITEM PARAMS SENT TO SQL:', itemParams)
          await window.api.db.execute(itemSql, itemParams)
        } else if (line.lineType === 'service') {
          const serviceSql = `
            INSERT INTO quotation_services (
              quotation_id, service_id, quantity, rate, discount, 
              gst_percent, cess_percent, cess_flat, amount_excl_gst, gst_amount, cess_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          const serviceParams = [
            quotationId,
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
          ]
          console.log('🛠️ 3b. SERVICE PARAMS SENT TO SQL:', serviceParams)
          await window.api.db.execute(serviceSql, serviceParams)
        }
      }

      console.log(`✅ SUCCESS! Document created: ${quotationNo} (ID: ${quotationId})`)
      return { success: true, quotationId, quotationNo }
    } catch (error) {
      console.error('❌ DATABASE INSERT ERROR:', error)
      throw error
    }
  },

  updateQuotation: async (id, storeData) => {
    try {
      const headerSql = `
        UPDATE quotations SET
          customer_id = ?, customer_name = ?, customer_gst_no = ?,
          customer_phone_no = ?, customer_address = ?, shipped_to_address = ?,
          gstin_type = ?, sgst_amount = ?, cgst_amount = ?, igst_amount = ?,
          ad_valorem_cess_amount = ?, non_ad_valorem_cess_amount = ?,
          amount_excl_gst = ?, total_amount = ?, ref_enquiry_no = ?
        WHERE id = ?
      `
      await window.api.db.execute(headerSql, [
        storeData.partyId,
        storeData.partyName,
        storeData.partyGst || '',
        storeData.partyPhone || '',
        storeData.partyAddress || '',
        storeData.logistics?.shipped_to_address || '',
        storeData.gstin_type,
        storeData.sgst_amount || 0,
        storeData.cgst_amount || 0,
        storeData.igst_amount || 0,
        storeData.cess_amount || 0,
        0,
        storeData.amount_excl_gst || 0,
        storeData.total_amount || 0,
        storeData.references?.ref_enquiry_no || '',
        id
      ])

      // Clear both tables
      await window.api.db.execute('DELETE FROM quotation_items WHERE quotation_id = ?', [id])
      await window.api.db.execute('DELETE FROM quotation_services WHERE quotation_id = ?', [id])

      // Re-insert into appropriate tables
      for (const line of storeData.lines) {
        if (line.lineType === 'item') {
          const itemSql = `
            INSERT INTO quotation_items (
              quotation_id, item_id, quantity, rate, discount, 
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
        } else if (line.lineType === 'service') {
          const serviceSql = `
            INSERT INTO quotation_services (
              quotation_id, service_id, quantity, rate, discount, 
              gst_percent, cess_percent, cess_flat, amount_excl_gst, gst_amount, cess_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          await window.api.db.execute(serviceSql, [
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
      return { success: true, quotationId: id }
    } catch (error) {
      throw error
    }
  },

  deleteQuotation: async (id) => {
    try {
      // 1. Dependency checks
      const linkedPi = await window.api.db.select(
        'SELECT proforma_no FROM proforma_invoices WHERE quotation_id = ? LIMIT 1',
        [id]
      )
      if (linkedPi.length > 0)
        return {
          success: false,
          message: `Cannot delete. Linked to Proforma Invoice: ${linkedPi[0].proforma_no}`
        }

      const linkedInv = await window.api.db.select(
        'SELECT invoice_no FROM customer_invoices WHERE quotation_id = ? LIMIT 1',
        [id]
      )
      if (linkedInv.length > 0)
        return {
          success: false,
          message: `Cannot delete. Linked to Tax Invoice: ${linkedInv[0].invoice_no}`
        }

      // 2. Cascading Delete
      await window.api.db.execute('DELETE FROM quotation_items WHERE quotation_id = ?', [id])
      await window.api.db.execute('DELETE FROM quotation_services WHERE quotation_id = ?', [id])
      await window.api.db.execute('DELETE FROM quotations WHERE id = ?', [id])

      return { success: true, message: 'Quotation deleted successfully.' }
    } catch (error) {
      throw error
    }
  }
}
