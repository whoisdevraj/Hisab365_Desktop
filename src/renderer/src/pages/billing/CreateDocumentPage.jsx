import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Trash2,
  Save,
  Search,
  ChevronDown,
  Sparkles,
  FileText,
  ShoppingCart,
  Package,
  Briefcase
} from 'lucide-react'
import { useDocumentStore } from '../../store/useDocumentStore'
import { customerService } from '../../services/customer.service'
import { vendorService } from '../../services/vendor.service'
import { inventoryService } from '../../services/inventory.service'
import { quotationService } from '../../services/quotation.service'
import { proformaService } from '../../services/proforma.service'
import { invoiceService } from '../../services/invoice.service'
import { serviceService } from '../../services/service.service' // 👈 Added service import

export default function CreateDocumentPage() {
  const navigate = useNavigate()
  const store = useDocumentStore()
  const queryClient = useQueryClient()

  // Custom Dropdown States
  const [isPartyOpen, setIsPartyOpen] = useState(false)
  const [partySearch, setPartySearch] = useState('')

  const [isItemOpen, setIsItemOpen] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [activeSearchTab, setActiveSearchTab] = useState('items') // 👈 'items' | 'services'

  const [isRefOpen, setIsRefOpen] = useState(false)
  const [refSearch, setRefSearch] = useState('')

  // Fetch Data safely
  const { data: parties = [] } = useQuery({
    queryKey: [store.partyType === 'customer' ? 'customers' : 'vendors'],
    queryFn:
      store.partyType === 'customer' ? customerService.getCustomers : vendorService.getVendors
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory_items'],
    queryFn: inventoryService.getItems
  })

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: serviceService.getServices
  })

  const { data: availableQuotations = [] } = useQuery({
    queryKey: ['available_quotations', store.documentType],
    queryFn: () => quotationService.getAvailableQuotations(store.documentType)
  })

  // Date & Document Prefix Logic
  const d = new Date()
  const dateString = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const docPrefix =
    store.documentType === 'quotations' ? 'QT' : store.documentType === 'proforma' ? 'PI' : 'INV'

  // BULLETPROOF FILTERS
  const filteredParties = parties.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(partySearch.toLowerCase()) ||
      (p.gst_no || '').toLowerCase().includes(partySearch.toLowerCase())
  )
  const filteredItems = inventory.filter(
    (i) =>
      (i.name || '').toLowerCase().includes(itemSearch.toLowerCase()) ||
      (i.product_code || '').toLowerCase().includes(itemSearch.toLowerCase()) ||
      (i.hsn_code || '').includes(itemSearch)
  )
  const filteredServices = services.filter(
    (s) =>
      (s.description || '').toLowerCase().includes(itemSearch.toLowerCase()) ||
      (s.sac_code || '').includes(itemSearch)
  )
  const filteredQuotations = availableQuotations.filter(
    (q) =>
      (q.quotation_no || '').toLowerCase().includes(refSearch.toLowerCase()) ||
      (q.customer_name || '').toLowerCase().includes(refSearch.toLowerCase())
  )

  // Handlers
  const handleSelectParty = (party) => {
    store.setParty(party)
    setIsPartyOpen(false)
    setPartySearch('')
  }

  const handleSelectItem = (item) => {
    // Map HSN for consistency
    store.addLine({ ...item, hsn_sac: item.hsn_code }, 'item')
    setIsItemOpen(false)
    setItemSearch('')
  }

  const handleSelectService = (svc) => {
    // Map Service fields to match the unified grid structure
    store.addLine(
      {
        ...svc,
        name: svc.description,
        hsn_sac: svc.sac_code,
        latest_selling_rate: svc.rate,
        latest_purchasing_rate: svc.rate
      },
      'service'
    )
    setIsItemOpen(false)
    setItemSearch('')
  }

  const handleSelectReference = async (quotation) => {
    try {
      console.log('Fetching reference for ID:', quotation.id)
      const fullQuotation = await quotationService.getQuotationWithItems(quotation.id)
      console.log('Full quotation data retrieved:', fullQuotation)

      store.initFromReference(store.documentType, fullQuotation, 'quotation')
      store.updateReference('quotation_id', quotation.id)
      setIsRefOpen(false)
      setRefSearch('')
    } catch (error) {
      console.error('❌ CRASH IN REFERENCE LOAD:', error)
      alert(`Failed to load reference document.\n\nReason: ${error.message}`)
    }
  }

  const handleSave = async () => {
    if (!store.partyId) return alert('Please select a Customer/Vendor first.')
    if (store.lines.length === 0)
      return alert('Please add at least one item or service to the document.')

    // 🔍 FRONTEND DEBUG LOGS: See exactly what the UI is sending
    // console.log('🚀 --- INITIATING SAVE ---')
    // console.log(
    //   '📄 Document Type:',
    //   store.documentType,
    //   store.documentId ? `(EDITING ID: ${store.documentId})` : '(NEW)'
    // )
    // console.log('🏢 Party:', {
    //   id: store.partyId,
    //   name: store.partyName,
    //   gstin_type: store.gstin_type
    // })
    // console.log('🛒 Lines Array:', JSON.parse(JSON.stringify(store.lines))) // Deep copy to view exact state at click
    // console.log('💰 Totals Payload:', {
    //   taxable: store.amount_excl_gst,
    //   cgst: store.cgst_amount,
    //   sgst: store.sgst_amount,
    //   igst: store.igst_amount,
    //   cess: store.cess_amount,
    //   grandTotal: store.total_amount
    // })
    // console.log('📦 FULL ZUSTAND STORE:', store)
    // console.log('--------------------------')

    try {
      if (store.documentType === 'quotations') {
        if (store.documentId) {
          await quotationService.updateQuotation(store.documentId, store)
          alert(`Success! Quotation updated.`)
        } else {
          const result = await quotationService.createQuotation(store)
          alert(`Success! Saved as ${result.quotationNo}`)
        }
      } else if (store.documentType === 'proforma') {
        if (store.documentId) {
          await proformaService.updateProforma(store.documentId, store)
          alert(`Success! Proforma updated.`)
        } else {
          const result = await proformaService.createProforma(store)
          alert(`Success! Saved as ${result.proformaNo}`)
        }
      } else if (store.documentType === 'invoices') {
        if (store.documentId) {
          await invoiceService.updateInvoice(store.documentId, store)
          alert(`Success! Invoice updated.`)
        } else {
          const result = await invoiceService.createInvoice(store)
          alert(`Success! Saved as ${result.invoiceNo}`)
        }
      } else {
        alert(`${store.documentType} saving logic coming next!`)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['available_quotations'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      store.resetStore()
      navigate('/billing')
    } catch (error) {
      alert('Error saving document. Check console.')
      console.error('❌ UI SAVE ERROR:', error)
    }
  }
  const canUseQuotationRef = ['proforma', 'invoices', 'challans'].includes(store.documentType)

  // ERP STYLE: Spreadsheet Input Class
  const gridInputClass =
    'w-full h-full min-h-[34px] px-2 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right font-medium text-slate-800 transition-colors placeholder:text-slate-300'

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 bg-[#f4f7f9] relative font-sans text-sm">
      {/* Overlays */}
      {(isPartyOpen || isItemOpen || isRefOpen) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setIsPartyOpen(false)
            setIsItemOpen(false)
            setIsRefOpen(false)
          }}
        ></div>
      )}

      {/* HEADER BAR */}
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/billing')}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all border border-transparent hover:border-slate-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="leading-tight">
            <h1 className="text-[1.35rem] font-bold text-slate-900 capitalize flex items-center gap-2.5">
              <FileText size={22} className="text-blue-600" /> New{' '}
              {(store.documentType || '').replace('_', ' ')}
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              Draft No:{' '}
              <span className="text-blue-600">
                {docPrefix}-{dateString}-XXXX
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md flex items-center gap-2 font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/50 outline-none"
        >
          <Save size={16} /> Save Document
        </button>
      </header>

      {/* SCROLLABLE ERP CANVAS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* AUTO-FILL BANNER */}
        {canUseQuotationRef && (
          <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-40">
            <div className="flex items-center gap-2 px-2">
              <Sparkles size={16} className="text-indigo-600" />
              <span className="font-semibold text-indigo-900 text-sm">
                Auto-fill from Quotation
              </span>
            </div>
            <div className="relative w-full md:w-80">
              <div
                onClick={() => setIsRefOpen(!isRefOpen)}
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-md flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors shadow-sm"
              >
                <span
                  className={`font-medium ${store.references?.quotation_id ? 'text-indigo-900' : 'text-slate-400'}`}
                >
                  {store.references?.quotation_id
                    ? `Linked: QT ID #${store.references.quotation_id}`
                    : `Search Quotations...`}
                </span>
                <ChevronDown size={14} className="text-indigo-400" />
              </div>
              {isRefOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-xl overflow-hidden z-50">
                  <div className="p-1.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <Search size={14} className="text-slate-400 ml-1" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search QT No or Customer..."
                      value={refSearch}
                      onChange={(e) => setRefSearch(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none text-sm py-1"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1">
                    {filteredQuotations.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-sm">
                        No quotations found.
                      </div>
                    ) : (
                      filteredQuotations.map((q) => (
                        <div
                          key={q.id}
                          onClick={() => handleSelectReference(q)}
                          className="p-2 hover:bg-indigo-50 rounded-md cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-slate-900">
                              {q.quotation_no}
                            </span>
                            <span className="font-bold text-sm text-indigo-600">
                              ₹{Number(q.total_amount || 0).toFixed(2)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {q.customer_name} •{' '}
                            {q.created_at ? new Date(q.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOP META PANEL */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4 p-5 relative z-30">
          <div className="md:col-span-7 space-y-4 relative">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select {store.partyType === 'customer' ? 'Customer' : 'Vendor'} *
              </label>
              {store.partyId && (
                <div className="flex bg-[#f8fafc] border border-slate-200 rounded-md p-0.5">
                  <button
                    onClick={() => store.setGstinType('SGST_CGST')}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${store.gstin_type === 'SGST_CGST' ? 'bg-white shadow-sm text-blue-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    CGST+SGST
                  </button>
                  <button
                    onClick={() => store.setGstinType('IGST')}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${store.gstin_type === 'IGST' ? 'bg-white shadow-sm text-blue-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    IGST
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <div
                onClick={() => setIsPartyOpen(!isPartyOpen)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
              >
                <span
                  className={`font-medium ${store.partyId ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  {store.partyId
                    ? `${store.partyName} (GST: ${store.partyGst || 'N/A'})`
                    : `Search and select...`}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </div>

              {isPartyOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-xl overflow-hidden z-50">
                  <div className="p-1.5 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                    <Search size={14} className="text-slate-400 ml-1" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search name or GST..."
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none text-sm py-1"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1">
                    {filteredParties.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-sm">
                        No matches found.
                      </div>
                    ) : (
                      filteredParties.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectParty(p)}
                          className="p-2 hover:bg-blue-50 rounded-md cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 uppercase">
                            GST: {p.gst_no || 'N/A'} | Ph: {p.phone_no || 'N/A'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {store.partyId && (
              <div className="px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-md text-xs text-slate-600 leading-relaxed shadow-inner">
                {store.partyAddress || 'No address provided in database.'}
              </div>
            )}
          </div>

          <div className="md:col-span-5 flex flex-col space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Reference No (Optional)
              </label>
              <input
                type="text"
                value={
                  store.references?.ref_enquiry_no || store.references?.ref_customer_Po_no || ''
                }
                onChange={(e) => store.updateReference('ref_customer_Po_no', e.target.value)}
                placeholder="e.g. PO-2023-001"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Shipping Address
              </label>
              <textarea
                value={store.logistics?.shipped_to_address || ''}
                onChange={(e) => store.updateLogistics('shipped_to_address', e.target.value)}
                placeholder="Same as billing if empty..."
                className="w-full flex-1 min-h-[50px] px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm transition-all"
              ></textarea>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Spreadsheet Grid */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col relative z-20">
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative w-full max-w-md">
              <div
                onClick={() => setIsItemOpen(!isItemOpen)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md flex items-center gap-2 cursor-pointer hover:border-blue-400 shadow-sm transition-colors"
              >
                <Search size={14} className="text-slate-400" />
                <span className="text-slate-400 text-xs font-medium">
                  Search items or services to add...
                </span>
              </div>

              {/* COMBINED ITEMS/SERVICES DROPDOWN */}
              {isItemOpen && (
                <div className="absolute top-full left-0 w-[450px] mt-1 bg-white border border-slate-300 rounded-md shadow-2xl overflow-hidden z-50">
                  {/* Tabs */}
                  <div className="flex p-1 bg-slate-100 border-b border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveSearchTab('items')
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${activeSearchTab === 'items' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Package size={14} /> Physical Items
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveSearchTab('services')
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${activeSearchTab === 'services' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Briefcase size={14} /> Services
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="p-1.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <Search size={14} className="text-slate-400 ml-1" />
                    <input
                      autoFocus
                      type="text"
                      placeholder={
                        activeSearchTab === 'items'
                          ? 'Search by name or code...'
                          : 'Search by description or SAC...'
                      }
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none text-sm py-1"
                    />
                  </div>

                  {/* List Results */}
                  <div className="max-h-64 overflow-y-auto p-1">
                    {activeSearchTab === 'items' ? (
                      filteredItems.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-sm">
                          No items found.
                        </div>
                      ) : (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className="flex items-center justify-between p-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 rounded-md"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 uppercase">
                                Code: {item.product_code || 'N/A'} | Stock: {item.quantity}{' '}
                                {item.unit}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-600">
                                ₹
                                {store.partyType === 'customer'
                                  ? Number(item.latest_selling_rate || 0).toFixed(2)
                                  : Number(item.latest_purchasing_rate || 0).toFixed(2)}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold">
                                GST: {item.gst_percent || 0}%
                              </p>
                            </div>
                          </div>
                        ))
                      )
                    ) : /* Service Results */
                    filteredServices.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-sm">
                        No services found.
                      </div>
                    ) : (
                      filteredServices.map((svc) => (
                        <div
                          key={svc.id}
                          onClick={() => handleSelectService(svc)}
                          className="flex items-center justify-between p-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0 rounded-md"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{svc.description}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 uppercase">
                              SAC: {svc.sac_code || 'N/A'} | Unit: {svc.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-600">
                              ₹{Number(svc.rate || 0).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold">
                              GST: {svc.gst_percent || 0}%
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[200px]">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead className="bg-[#f8fafc] text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 border-r border-slate-200">Product / Description</th>
                  <th className="px-2 py-2.5 border-r border-slate-200 w-20 text-center">Qty</th>
                  <th className="px-2 py-2.5 border-r border-slate-200 w-24 text-center">Rate</th>
                  <th className="px-2 py-2.5 border-r border-slate-200 w-16 text-center">Disc %</th>
                  <th className="px-2 py-2.5 border-r border-slate-200 w-16 text-center">GST %</th>
                  <th className="px-2 py-2.5 border-r border-slate-200 w-16 text-center">CESS %</th>
                  <th
                    className="px-2 py-2.5 border-r border-slate-200 w-20 text-center"
                    title="Flat ₹ Per Unit"
                  >
                    CESS (₹/U)
                  </th>
                  <th className="px-3 py-2.5 border-r border-slate-200 text-right w-28">Taxable</th>
                  <th className="px-3 py-2.5 text-right w-28">Total (₹)</th>
                  <th className="px-2 py-2.5 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {store.lines.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-16 text-center text-slate-400 bg-white">
                      <ShoppingCart
                        size={32}
                        strokeWidth={1.5}
                        className="mx-auto text-slate-300 mb-3"
                      />
                      <p className="font-semibold text-slate-600">Grid is empty.</p>
                      <p className="text-xs mt-1">Search above to add items or services.</p>
                    </td>
                  </tr>
                ) : (
                  store.lines.map((line) => (
                    <tr
                      key={line.cartId}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white group"
                    >
                      <td className="px-3 py-2 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          {line.lineType === 'service' ? (
                            <Briefcase size={12} className="text-indigo-400" />
                          ) : (
                            <Package size={12} className="text-blue-400" />
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{line.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-medium">
                              HSN/SAC: {line.hsn_sac || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-r border-slate-200">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) =>
                            store.updateLineRow(line.cartId, 'quantity', e.target.value)
                          }
                          className={`${gridInputClass} text-center`}
                        />
                      </td>
                      <td className="border-r border-slate-200">
                        <input
                          type="number"
                          value={line.rate}
                          onChange={(e) => store.updateLineRow(line.cartId, 'rate', e.target.value)}
                          className={gridInputClass}
                        />
                      </td>
                      <td className="border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={line.discount_percent}
                          onChange={(e) =>
                            store.updateLineRow(line.cartId, 'discount_percent', e.target.value)
                          }
                          className={`${gridInputClass} text-center`}
                        />
                      </td>
                      <td className="border-r border-slate-200 bg-[#f8fafc]">
                        <select
                          value={line.gst_percent}
                          onChange={(e) =>
                            store.updateLineRow(line.cartId, 'gst_percent', e.target.value)
                          }
                          className="w-full h-full min-h-[34px] bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="0">0</option>
                          <option value="5">5</option>
                          <option value="12">12</option>
                          <option value="18">18</option>
                          <option value="28">28</option>
                        </select>
                      </td>
                      <td className="border-r border-slate-200 bg-[#f8fafc]">
                        <input
                          type="number"
                          min="0"
                          value={line.cess_percent}
                          onChange={(e) =>
                            store.updateLineRow(line.cartId, 'cess_percent', e.target.value)
                          }
                          className={`${gridInputClass} text-center`}
                          placeholder="0"
                        />
                      </td>
                      <td className="border-r border-slate-200 bg-[#f8fafc]">
                        <input
                          type="number"
                          min="0"
                          value={line.cess_flat}
                          onChange={(e) =>
                            store.updateLineRow(line.cartId, 'cess_flat', e.target.value)
                          }
                          className={gridInputClass}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-slate-200 text-right font-bold text-slate-700">
                        {Number(line.amount_excl_gst || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-50">
                        {Number(line.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => store.removeLine(line.cartId)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 mx-auto block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM SECTION: Attached ERP Summary */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 p-5 lg:border-r border-slate-200 bg-white">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Terms & Conditions
            </label>
            <textarea
              rows="5"
              value={store.logistics?.delivery_terms || ''}
              onChange={(e) => store.updateLogistics('delivery_terms', e.target.value)}
              placeholder="Add specific terms, notes, or payment instructions for this document..."
              className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-sm shadow-inner"
            ></textarea>
          </div>

          <div className="w-full lg:w-[380px] bg-white flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-[#f8fafc]">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Summary
              </span>
              <span className="text-[10px] font-bold bg-white border border-slate-300 px-2 py-0.5 rounded-sm text-blue-600 uppercase shadow-sm">
                {store.gstin_type}
              </span>
            </div>

            <div className="flex-1 p-0 flex flex-col text-sm">
              <div className="flex justify-between px-5 py-3 border-b border-slate-100">
                <span className="font-medium text-slate-600">Taxable Amount</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(store.amount_excl_gst || 0).toFixed(2)}
                </span>
              </div>

              {store.gstin_type === 'IGST' ? (
                <div className="flex justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <span className="font-medium text-slate-600">IGST</span>
                  <span className="font-bold text-slate-800">
                    ₹{Number(store.igst_amount || 0).toFixed(2)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <span className="font-medium text-slate-600">CGST</span>
                    <span className="font-bold text-slate-800">
                      ₹{Number(store.cgst_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <span className="font-medium text-slate-600">SGST</span>
                    <span className="font-bold text-slate-800">
                      ₹{Number(store.sgst_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/50">
                <span className="font-medium text-slate-600">Total CESS</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(store.cess_amount || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center px-5 py-4 bg-slate-900 text-white mt-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Grand Total
                </span>
                <span className="text-[1.35rem] font-bold">
                  ₹{Number(store.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
