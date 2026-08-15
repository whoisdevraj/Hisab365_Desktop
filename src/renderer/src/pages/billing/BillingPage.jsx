import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  ClipboardList,
  Truck,
  Receipt,
  ShoppingCart,
  CheckSquare,
  FileCheck,
  Plus,
  Printer,
  Search,
  Trash2,
  Edit
} from 'lucide-react'
import { useDocumentStore } from '../../store/useDocumentStore'
import { quotationService } from '../../services/quotation.service'
import { proformaService } from '../../services/proforma.service'
import { invoiceService } from '../../services/invoice.service'

export default function BillingPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { initNewDocument } = useDocumentStore()

  const [activePipeline, setActivePipeline] = useState('sales')
  const [activeDocId, setActiveDocId] = useState('quotations')
  const [searchQuery, setSearchQuery] = useState('')

  const pipelines = {
    sales: [
      {
        id: 'quotations',
        title: 'Quotations',
        desc: 'Provide estimates to customers',
        icon: ClipboardList,
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      {
        id: 'proforma',
        title: 'Proforma Invoices',
        desc: 'Pre-delivery payment requests',
        icon: FileText,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
      },
      {
        id: 'challans',
        title: 'Delivery Challans',
        desc: 'Dispatch goods tracking',
        icon: Truck,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      },
      {
        id: 'invoices',
        title: 'Tax Invoices',
        desc: 'Final customer billing',
        icon: Receipt,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
      }
    ],
    purchases: [
      {
        id: 'purchase_orders',
        title: 'Purchase Orders',
        desc: 'Order from vendors',
        icon: ShoppingCart,
        color: 'text-violet-600',
        bg: 'bg-violet-50'
      },
      {
        id: 'gir',
        title: 'Goods Inspection',
        desc: 'GIR upon receiving stock',
        icon: CheckSquare,
        color: 'text-orange-600',
        bg: 'bg-orange-50'
      },
      {
        id: 'purchase_invoices',
        title: 'Purchase Invoices',
        desc: 'Record vendor bills',
        icon: FileCheck,
        color: 'text-teal-600',
        bg: 'bg-teal-50'
      }
    ]
  }

  const handlePipelineSwitch = (pipeline) => {
    setActivePipeline(pipeline)
    setActiveDocId(pipeline === 'sales' ? 'quotations' : 'purchase_orders')
    setSearchQuery('')
  }

  const activeCards = pipelines[activePipeline]
  const activeCardData = activeCards.find((c) => c.id === activeDocId)

  const handleCreateDocument = () => {
    const partyType = activePipeline === 'sales' ? 'customer' : 'vendor'
    initNewDocument(activeDocId, partyType)
    navigate('/billing/create')
  }

  const handleEditDocument = (doc) => {
    alert(
      `Edit mode for ${activeCardData.title} coming in the next step! We will load this into the Create grid.`
    )
  }

  // --- DATA FETCHING ---
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', activeDocId],
    queryFn: async () => {
      if (activeDocId === 'quotations') return await quotationService.getQuotations()
      if (activeDocId === 'proforma') return await proformaService.getProformas()
      if (activeDocId === 'invoices') return await invoiceService.getInvoices()
      return []
    }
  })

  // --- DELETE MUTATION ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (activeDocId === 'quotations') return await quotationService.deleteQuotation(id)
      if (activeDocId === 'proforma') return await proformaService.deleteProforma(id)
      if (activeDocId === 'invoices') return await invoiceService.deleteInvoice(id)
    },
    onSuccess: (res) => {
      if (res && res.success === false) {
        alert(`❌ ${res.message}`)
      } else {
        queryClient.invalidateQueries({ queryKey: ['documents', activeDocId] })
      }
    },
    onError: (err) => {
      console.error(err)
      alert('An error occurred while deleting the document.')
    }
  })

  const handleDelete = (id, docNo) => {
    if (window.confirm(`Are you sure you want to delete ${docNo}? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  // --- SEARCH FILTER ---
  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchQuery.toLowerCase()
    const docNo = (
      doc.quotation_no ||
      doc.proforma_no ||
      doc.invoice_no ||
      doc.purchase_order_name ||
      ''
    ).toLowerCase()
    const partyName = (doc.customer_name || doc.vendor_name || '').toLowerCase()
    return docNo.includes(searchLower) || partyName.includes(searchLower)
  })

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 relative font-sans text-sm">
      {/* PAGE HEADER */}
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10">
        <div>
          <h1 className="text-[1.35rem] font-bold text-slate-900 flex items-center gap-2.5">
            Billing & Documents
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Manage your complete sales and procurement pipelines.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex p-0.5 bg-[#f8fafc] border border-slate-200 rounded-md shadow-inner">
            <button
              onClick={() => handlePipelineSwitch('sales')}
              className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                activePipeline === 'sales'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sales (O2C)
            </button>
            <button
              onClick={() => handlePipelineSwitch('purchases')}
              className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                activePipeline === 'purchases'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Purchases (P2P)
            </button>
          </div>
          <button
            onClick={handleCreateDocument}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 font-medium transition-colors focus:ring-2 focus:ring-blue-500/50 outline-none shrink-0"
          >
            <Plus size={16} />
            <span className="hidden md:inline">Create {activeCardData?.title.split(' ')[0]}</span>
          </button>
        </div>
      </header>

      {/* SCROLLABLE CANVAS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Document Type Selectable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeCards.map((card) => {
            const Icon = card.icon
            const isSelected = activeDocId === card.id

            return (
              <div
                key={card.id}
                onClick={() => {
                  setActiveDocId(card.id)
                  setSearchQuery('')
                }}
                className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 flex flex-col justify-between h-32 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`p-2 rounded-md transition-colors ${isSelected ? 'bg-white shadow-sm border border-blue-100' : card.bg}`}
                  >
                    <Icon size={20} className={card.color} />
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm mt-1"></div>
                  )}
                </div>
                <div>
                  <h3 className={`font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {card.title}
                  </h3>
                  <p
                    className={`text-[11px] font-medium mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-600/80' : 'text-slate-500'}`}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* DYNAMIC TABLE SECTION */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          {/* Table Header Row */}
          <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <activeCardData.icon size={16} className={activeCardData.color} />
              Active {activeCardData?.title}
            </h2>

            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder={`Search by Doc No or Party Name...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead className="bg-[#f8fafc] text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-200 w-32">Date</th>
                  <th className="px-4 py-3 border-r border-slate-200">Document No.</th>
                  <th className="px-4 py-3 border-r border-slate-200">Party Name</th>
                  <th className="px-4 py-3 border-r border-slate-200 text-right">Amount (₹)</th>
                  <th className="px-4 py-3 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="h-64">
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 font-medium">
                        Loading documents...
                      </div>
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="h-[350px]">
                      {/* Perfectly centered empty state */}
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <activeCardData.icon
                          size={48}
                          strokeWidth={1.5}
                          className="text-slate-300 mb-4"
                        />
                        <p className="font-semibold text-slate-600 text-base mb-1">
                          No {activeCardData?.title.toLowerCase()} found.
                        </p>
                        <p className="text-xs text-slate-400">
                          Adjust your search or create a new document to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const docNo =
                      doc.quotation_no ||
                      doc.invoice_no ||
                      doc.proforma_no ||
                      doc.purchase_order_name ||
                      '-'
                    return (
                      <tr
                        key={doc.id}
                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                      >
                        <td className="px-4 py-3 border-r border-slate-200 font-medium">
                          {new Date(doc.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-900">
                          {docNo}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200">
                          {doc.customer_name || doc.vendor_name || '-'}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200 text-right font-bold text-slate-900">
                          ₹{Number(doc.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => alert(`Printing ${docNo}...`)}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Print Document"
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              onClick={() => handleEditDocument(doc)}
                              className="text-slate-400 hover:text-amber-600 transition-colors"
                              title="Edit Document"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id, docNo)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
