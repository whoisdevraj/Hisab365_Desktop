import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, Edit, X, Package, Briefcase } from 'lucide-react'
import { inventoryService } from '../../services/inventory.service'
// Note: Ensure you create a service.service.js with similar CRUD methods for the `services` table!
import { serviceService } from '../../services/service.service'

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('items') // 'items' | 'services'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // --- QUERIES ---
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['inventory_items'],
    queryFn: inventoryService.getItems
  })

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: serviceService.getServices // Fetch from your new services table
  })

  // --- ITEM MUTATIONS ---
  const addItemMutation = useMutation({
    mutationFn: inventoryService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      closeModal()
    }
  })
  const updateItemMutation = useMutation({
    mutationFn: (item) => inventoryService.updateItem(item.id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      closeModal()
    }
  })
  const deleteItemMutation = useMutation({
    mutationFn: inventoryService.deleteItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
  })

  // --- SERVICE MUTATIONS ---
  const addServiceMutation = useMutation({
    mutationFn: serviceService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      closeModal()
    }
  })
  const updateServiceMutation = useMutation({
    mutationFn: (svc) => serviceService.updateService(svc.id, svc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      closeModal()
    }
  })
  const deleteServiceMutation = useMutation({
    mutationFn: serviceService.deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  })

  // --- HANDLERS ---
  const handleEdit = (record) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setEditingRecord(null), 200)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const rawData = Object.fromEntries(formData.entries())

    if (activeTab === 'items') {
      const itemData = {
        ...rawData,
        gst_percent: Number(rawData.gst_percent || 0),
        adValoremCess: Number(rawData.adValoremCess || 0),
        nonAdValoremCess: Number(rawData.nonAdValoremCess || 0),
        latest_selling_rate: Number(rawData.latest_selling_rate || 0),
        latest_purchasing_rate: Number(rawData.latest_purchasing_rate || 0),
        quantity: Number(rawData.quantity || 0)
      }
      if (editingRecord) updateItemMutation.mutate({ ...itemData, id: editingRecord.id })
      else addItemMutation.mutate(itemData)
    } else {
      const serviceData = {
        description: rawData.description,
        sac_code: rawData.sac_code,
        gst_percent: Number(rawData.gst_percent || 0),
        adValoremCess: Number(rawData.adValoremCess || 0),
        nonAdValoremCess: Number(rawData.nonAdValoremCess || 0),
        unit: rawData.unit || 'Lumpsum',
        rate: Number(rawData.rate || 0)
      }
      if (editingRecord) updateServiceMutation.mutate({ ...serviceData, id: editingRecord.id })
      else addServiceMutation.mutate(serviceData)
    }
  }

  // --- FILTERS ---
  const filteredItems = items.filter(
    (item) =>
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.hsn_code || '').includes(searchQuery)
  )

  const filteredServices = services.filter(
    (svc) =>
      (svc.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (svc.sac_code || '').includes(searchQuery)
  )

  const isLoading = activeTab === 'items' ? itemsLoading : servicesLoading
  const hasData = activeTab === 'items' ? filteredItems.length > 0 : filteredServices.length > 0

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 relative font-sans text-sm bg-[#f4f7f9]">
      {/* PAGE HEADER */}
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10">
        <div>
          <h1 className="text-[1.35rem] font-bold text-slate-900 flex items-center gap-2.5">
            <Package className="text-blue-600" size={24} /> Inventory & Services
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Manage your products, codes, pricing, and tax structures.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* TAB TOGGLE */}
          <div className="flex p-0.5 bg-[#f8fafc] border border-slate-200 rounded-md shadow-inner">
            <button
              onClick={() => {
                setActiveTab('items')
                setSearchQuery('')
              }}
              className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === 'items'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Physical Items
            </button>
            <button
              onClick={() => {
                setActiveTab('services')
                setSearchQuery('')
              }}
              className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === 'services'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Services
            </button>
          </div>

          <button
            onClick={() => {
              setEditingRecord(null)
              setIsModalOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 font-medium transition-colors focus:ring-2 focus:ring-blue-500/50 outline-none shrink-0"
          >
            <Plus size={16} />
            {activeTab === 'items' ? 'Add Item' : 'Add Service'}
          </button>
        </div>
      </header>

      {/* SCROLLABLE CANVAS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* DATA TABLE CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {activeTab === 'items' ? 'Item Master Data' : 'Service Master Data'}
            </h2>

            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder={
                  activeTab === 'items'
                    ? 'Search by name, code, or HSN...'
                    : 'Search by description or SAC...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead className="bg-[#f8fafc] text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                {activeTab === 'items' ? (
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200">Item Name</th>
                    <th className="px-4 py-3 border-r border-slate-200">Code / HSN</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center">Stock</th>
                    <th className="px-4 py-3 border-r border-slate-200">Tax Structure</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right">Purchase (₹)</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right">
                      Sale Price (₹)
                    </th>
                    <th className="px-4 py-3 text-center w-24">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200">Service Description</th>
                    <th className="px-4 py-3 border-r border-slate-200">SAC Code</th>
                    <th className="px-4 py-3 border-r border-slate-200">Unit</th>
                    <th className="px-4 py-3 border-r border-slate-200">Tax Structure</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-right">Rate (₹)</th>
                    <th className="px-4 py-3 text-center w-24">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="text-sm text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="h-64">
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        Loading data...
                      </div>
                    </td>
                  </tr>
                ) : !hasData ? (
                  <tr>
                    <td colSpan="7" className="h-[350px]">
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        {activeTab === 'items' ? (
                          <Package size={48} strokeWidth={1.5} className="text-slate-300 mb-4" />
                        ) : (
                          <Briefcase size={48} strokeWidth={1.5} className="text-slate-300 mb-4" />
                        )}
                        <p className="font-semibold text-slate-600 text-base mb-1">
                          No {activeTab} found.
                        </p>
                        <p className="text-xs text-slate-400">
                          Adjust your search or add a new record.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : activeTab === 'items' ? (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                    >
                      <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {item.product_code || '-'}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">
                            HSN: {item.hsn_code || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${item.quantity <= 5 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'}`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200">
                        <div className="flex flex-col text-[11px] space-y-0.5">
                          <span className="font-bold text-slate-800">GST: {item.gst_percent}%</span>
                          {(item.adValoremCess > 0 || item.nonAdValoremCess > 0) && (
                            <span className="font-medium text-slate-500">
                              CESS: {item.adValoremCess > 0 ? `${item.adValoremCess}% ` : ''}
                              {item.nonAdValoremCess > 0 ? `(₹${item.nonAdValoremCess}/u)` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 text-right font-medium text-slate-700">
                        ₹{Number(item.latest_purchasing_rate || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 text-right font-bold text-slate-900">
                        ₹{Number(item.latest_selling_rate || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredServices.map((svc) => (
                    <tr
                      key={svc.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors bg-white"
                    >
                      <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-900">
                        {svc.description}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-700">
                        {svc.sac_code || '-'}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 text-slate-600">
                        {svc.unit || '-'}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200">
                        <div className="flex flex-col text-[11px] space-y-0.5">
                          <span className="font-bold text-slate-800">GST: {svc.gst_percent}%</span>
                          {(svc.adValoremCess > 0 || svc.nonAdValoremCess > 0) && (
                            <span className="font-medium text-slate-500">
                              CESS: {svc.adValoremCess > 0 ? `${svc.adValoremCess}% ` : ''}
                              {svc.nonAdValoremCess > 0 ? `(₹${svc.nonAdValoremCess}/u)` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 text-right font-bold text-slate-900">
                        ₹{Number(svc.rate || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(svc)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => deleteServiceMutation.mutate(svc.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DYNAMIC MODAL (Handles both Items and Services) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingRecord
                  ? activeTab === 'items'
                    ? 'Edit Item'
                    : 'Edit Service'
                  : activeTab === 'items'
                    ? 'Add New Item'
                    : 'Add New Service'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
              {/* === ITEMS FORM FIELDS === */}
              {activeTab === 'items' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Item Name *
                      </label>
                      <input
                        defaultValue={editingRecord?.name}
                        required
                        name="name"
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="e.g. Wireless Mouse"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Product Code
                      </label>
                      <input
                        defaultValue={editingRecord?.product_code}
                        name="product_code"
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all uppercase"
                        placeholder="WM-001"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        HSN Code
                      </label>
                      <input
                        defaultValue={editingRecord?.hsn_code}
                        name="hsn_code"
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="8471"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Selling Rate (₹) *
                      </label>
                      <input
                        defaultValue={editingRecord?.latest_selling_rate}
                        required
                        name="latest_selling_rate"
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Purchasing Rate (₹)
                      </label>
                      <input
                        defaultValue={editingRecord?.latest_purchasing_rate}
                        name="latest_purchasing_rate"
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Stock Quantity
                      </label>
                      <input
                        defaultValue={editingRecord?.quantity ?? 0}
                        name="quantity"
                        type="number"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Measuring Unit
                      </label>
                      <select
                        defaultValue={editingRecord?.unit || 'Pieces (PCS)'}
                        name="unit"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      >
                        <option value="Pieces (PCS)">Pieces (PCS)</option>
                        <option value="Kilograms (KGS)">Kilograms (KGS)</option>
                        <option value="Liters (LTR)">Liters (LTR)</option>
                        <option value="Meters (MTR)">Meters (MTR)</option>
                        <option value="Boxes (BOX)">Boxes (BOX)</option>
                        <option value="Packets (PKT)">Packets (PKT)</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* === SERVICES FORM FIELDS === */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Service Description *
                      </label>
                      <input
                        defaultValue={editingRecord?.description}
                        required
                        name="description"
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="e.g. Annual Maintenance Contract"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        SAC Code
                      </label>
                      <input
                        defaultValue={editingRecord?.sac_code}
                        name="sac_code"
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="9954"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Service Rate (₹) *
                      </label>
                      <input
                        defaultValue={editingRecord?.rate}
                        required
                        name="rate"
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Unit
                      </label>
                      <select
                        defaultValue={editingRecord?.unit || 'Lumpsum'}
                        name="unit"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      >
                        <option value="Lumpsum">Lumpsum</option>
                        <option value="Hours">Hours</option>
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* SHARED TAX STRUCTURE SECTION */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    defaultValue={editingRecord?.gst_percent ?? 18}
                    name="gst_percent"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    CESS (%)
                  </label>
                  <input
                    defaultValue={editingRecord?.adValoremCess ?? ''}
                    name="adValoremCess"
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    CESS (₹/Unit)
                  </label>
                  <input
                    defaultValue={editingRecord?.nonAdValoremCess ?? ''}
                    name="nonAdValoremCess"
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-1.5 text-slate-600 font-medium hover:bg-slate-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm transition-all"
                >
                  {editingRecord
                    ? activeTab === 'items'
                      ? 'Update Item'
                      : 'Update Service'
                    : activeTab === 'items'
                      ? 'Save Item'
                      : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
