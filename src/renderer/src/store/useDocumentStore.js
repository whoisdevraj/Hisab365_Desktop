import { create } from 'zustand'

const generateCartId = () => Math.random().toString(36).substring(2, 9)

export const useDocumentStore = create((set, get) => ({
  documentType: 'quotations',
  partyType: 'customer',

  partyId: null,
  partyName: '',
  partyGst: '',
  partyPhone: '',
  partyAddress: '',

  gstin_type: 'SGST_CGST',

  lines: [],

  amount_excl_gst: 0,
  sgst_amount: 0,
  cgst_amount: 0,
  igst_amount: 0,
  cess_amount: 0,
  total_amount: 0,

  references: {
    quotation_id: null,
    ref_enquiry_no: '',
    ref_customer_Po_no: ''
  },

  logistics: {
    shipped_to_address: '',
    delivery_terms: ''
  },

  setGstinType: (type) => {
    set({ gstin_type: type })
    get().calculateTotals()
  },

  calculateTotals: () => {
    const { lines, gstin_type } = get()

    let totalTaxable = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0
    let totalCess = 0

    lines.forEach((line) => {
      totalTaxable += line.amount_excl_gst
      totalCess += line.cess_amount || 0

      if (gstin_type === 'IGST') {
        totalIgst += line.gst_amount
      } else {
        totalCgst += line.gst_amount / 2
        totalSgst += line.gst_amount / 2
      }
    })

    set({
      amount_excl_gst: totalTaxable,
      cgst_amount: totalCgst,
      sgst_amount: totalSgst,
      igst_amount: totalIgst,
      cess_amount: totalCess,
      total_amount: totalTaxable + totalCgst + totalSgst + totalIgst + totalCess
    })
  },

  addLine: (entity, type = 'item') => {
    const newLine = {
      cartId: generateCartId(),
      lineType: type,
      entityId: entity.id,
      name: type === 'item' ? entity.name : entity.description,
      hsn_sac: type === 'item' ? entity.hsn_code : entity.sac_code,
      quantity: 1,
      rate:
        type === 'item'
          ? get().partyType === 'customer'
            ? entity.latest_selling_rate
            : entity.latest_purchasing_rate
          : entity.rate,
      discount_percent: 0,
      gst_percent: entity.gst_percent || 0,
      cess_percent: entity.adValoremCess || 0,
      cess_flat: entity.nonAdValoremCess || 0,
      amount_excl_gst: 0,
      gst_amount: 0,
      cess_amount: 0,
      total_amount: 0
    }

    set((state) => ({ lines: [...state.lines, newLine] }))
    get().updateLineRow(newLine.cartId, 'quantity', 1)
  },

  updateLineRow: (cartId, field, value) => {
    const { lines } = get()
    const updatedLines = lines.map((line) => {
      if (line.cartId !== cartId) return line

      const updatedLine = { ...line, [field]: value === '' ? 0 : Number(value) }

      const baseValue = updatedLine.quantity * updatedLine.rate
      const discountAmount = baseValue * (updatedLine.discount_percent / 100)
      updatedLine.amount_excl_gst = baseValue - discountAmount
      updatedLine.gst_amount = updatedLine.amount_excl_gst * (updatedLine.gst_percent / 100)

      const adValoremCess = updatedLine.amount_excl_gst * (updatedLine.cess_percent / 100)
      updatedLine.cess_amount = adValoremCess + updatedLine.cess_flat * updatedLine.quantity

      updatedLine.total_amount =
        updatedLine.amount_excl_gst + updatedLine.gst_amount + updatedLine.cess_amount

      return updatedLine
    })

    set({ lines: updatedLines })
    get().calculateTotals()
  },

  removeLine: (cartId) => {
    set((state) => ({ lines: state.lines.filter((l) => l.cartId !== cartId) }))
    get().calculateTotals()
  },

  setParty: (party) => {
    const isIgst = party.gst_no && party.gst_no.startsWith('27') === false ? 'IGST' : 'SGST_CGST'
    set({
      partyId: party.id,
      partyName: party.name,
      partyGst: party.gst_no,
      partyPhone: party.phone_no,
      partyAddress: party.address,
      gstin_type: isIgst
    })
    get().calculateTotals()
  },

  updateReference: (key, value) => {
    set((state) => ({ references: { ...state.references, [key]: value } }))
  },

  updateLogistics: (key, value) => {
    set((state) => ({ logistics: { ...state.logistics, [key]: value } }))
  },

  initNewDocument: (docType, partyType) => {
    set({
      documentType: docType,
      partyType: partyType,
      partyId: null,
      partyName: '',
      partyGst: '',
      partyPhone: '',
      partyAddress: '',
      lines: [],
      amount_excl_gst: 0,
      sgst_amount: 0,
      cgst_amount: 0,
      igst_amount: 0,
      cess_amount: 0,
      total_amount: 0,
      references: { quotation_id: null, ref_enquiry_no: '', ref_customer_Po_no: '' },
      logistics: { shipped_to_address: '', delivery_terms: '' }
    })
  },

  initFromReference: (docType, refData, refType) => {
    if (!refData) return

    // 👈 SAFELY convert to string before checking startsWith
    const gstNo = refData.customer_gst_no ? String(refData.customer_gst_no) : ''
    const isIgst = gstNo && gstNo.startsWith('27') === false ? 'IGST' : 'SGST_CGST'

    const rawLines = refData.lines || refData.items || []

    const mappedLines = rawLines.map((item) => {
      const qty = item.quantity || 0
      const rate = item.rate || 0
      const disc_pct = item.discount || 0
      const gst_pct = item.gst_percent || 0

      // Robust Fallbacks for CESS
      const cess_pct = item.cess_percent || item.adValoremCess || 0
      const cess_flat = item.cess_flat || item.nonAdValoremCess || 0

      // Re-run the math engine
      const baseValue = qty * rate
      const discountAmount = baseValue * (disc_pct / 100)
      const amount_excl = baseValue - discountAmount
      const gst_amt = amount_excl * (gst_pct / 100)

      const adValoremCess = amount_excl * (cess_pct / 100)
      const cess_amt = adValoremCess + cess_flat * qty

      const line_total = amount_excl + gst_amt + cess_amt

      return {
        cartId: generateCartId(),
        lineType: item.lineType || 'item',
        entityId: item.entityId || item.item_id || item.service_id,
        name: item.name || item.description,
        hsn_sac: item.hsn_sac || item.hsn_code || item.sac_code,
        quantity: qty,
        rate: rate,
        discount_percent: disc_pct,
        gst_percent: gst_pct,
        cess_percent: cess_pct,
        cess_flat: cess_flat,
        amount_excl_gst: amount_excl,
        gst_amount: gst_amt,
        cess_amount: cess_amt,
        total_amount: line_total
      }
    })

    set({
      documentType: docType,
      partyType: 'customer',
      partyId: refData.customer_id,
      partyName: refData.customer_name,
      partyGst: refData.customer_gst_no,
      partyPhone: refData.customer_phone_no,
      partyAddress: refData.customer_address,
      gstin_type: isIgst,
      lines: mappedLines,
      references: {
        quotation_id: refData.id,
        ref_enquiry_no: refData.ref_enquiry_no || '',
        ref_customer_Po_no: refData.ref_customer_Po_no || ''
      },
      logistics: {
        shipped_to_address: refData.shipped_to_address || '',
        delivery_terms: refData.delivery_terms || ''
      }
    })

    get().calculateTotals()
  },

  resetStore: () => {
    get().initNewDocument(get().documentType, get().partyType)
  }
}))
