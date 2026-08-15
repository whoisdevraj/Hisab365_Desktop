import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, Edit, X, Users } from 'lucide-react'
import { customerService } from '../../services/customer.service'

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers
  })

  const addMutation = useMutation({
    mutationFn: customerService.addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: customerService.updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  })

  const handleEdit = (customer) => {
    setEditingRecord(customer)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setEditingRecord(null), 200)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const customerData = Object.fromEntries(formData.entries())

    if (editingRecord) {
      updateMutation.mutate({ ...customerData, id: editingRecord.id })
    } else {
      addMutation.mutate(customerData)
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone_no || '').includes(searchQuery) ||
      (c.gst_no || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 bg-slate-100 relative font-sans text-sm">
      {/* HEADER */}
      <header className="bg-white px-6 py-4 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" size={20} /> Customers
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
            Manage your clients and their balances.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null)
            setIsModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded flex items-center justify-center gap-2 font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/50 outline-none shrink-0"
        >
          <Plus size={16} /> Add Customer
        </button>
      </header>

      {/* SCROLLABLE CANVAS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* DYNAMIC TABLE SECTION */}
        <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              Customer Directory
            </h2>

            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by name, phone, or GST..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-300">
                <tr>
                  <th className="px-4 py-2.5 border-r border-slate-200">Name</th>
                  <th className="px-4 py-2.5 border-r border-slate-200">Phone</th>
                  <th className="px-4 py-2.5 border-r border-slate-200">GST No</th>
                  <th className="px-4 py-2.5 border-r border-slate-200">PAN No</th>
                  <th className="px-4 py-2.5 border-r border-slate-200 text-right">Balance (₹)</th>
                  <th className="px-4 py-2.5 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-400 font-medium">
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400"
                    >
                      <Users size={32} className="text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-500">No customers found.</p>
                      <p className="text-xs">Adjust your search or add a new customer.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-200 hover:bg-blue-50/30 group bg-white"
                    >
                      <td className="px-4 py-2.5 border-r border-slate-200 font-bold text-slate-900">
                        {customer.name}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 text-slate-600">
                        {customer.phone_no || '-'}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 font-medium text-slate-700">
                        {customer.gst_no || '-'}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 font-medium text-slate-700 uppercase">
                        {customer.pan_no || '-'}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50/50">
                        ₹{Number(customer.total_amount_receivable || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Customer"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(customer.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 size={16} />
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingRecord ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Customer Name *
                </label>
                <input
                  defaultValue={editingRecord?.name}
                  required
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    defaultValue={editingRecord?.phone_no}
                    name="phone_no"
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    GST Number
                  </label>
                  <input
                    defaultValue={editingRecord?.gst_no}
                    name="gst_no"
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all uppercase"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    PAN Number
                  </label>
                  <input
                    defaultValue={editingRecord?.pan_no}
                    name="pan_no"
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all uppercase"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    defaultValue={editingRecord?.pincode}
                    name="pincode"
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g. 400001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Billing Address
                </label>
                <textarea
                  defaultValue={editingRecord?.address}
                  name="address"
                  rows="2"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Full street address..."
                ></textarea>
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
                  {editingRecord ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
