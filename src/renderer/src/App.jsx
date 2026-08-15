import { HashRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import CustomersPage from './pages/Customers/CustomersPage'
import VendorsPage from './pages/Vendors/VendorsPage'
import InventoryPage from './pages/inventory/InventoryPage'
import BillingPage from './pages/billing/BillingPage'
import CreateDocumentPage from './pages/Billing/CreateDocumentPage'
// Placeholder views
const Dashboard = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
    <p className="text-slate-600">Overview of sales, receivables, and payables.</p>
  </div>
)

const Customers = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Customers</h1>
    <p className="text-slate-600">Manage client profiles, contact information, and receivables.</p>
  </div>
)

const Vendors = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Vendors</h1>
    <p className="text-slate-600">Manage supplier profiles, purchase orders, and payment dues.</p>
  </div>
)

const Inventory = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Inventory</h1>
    <p className="text-slate-600">Track stock levels, HSN codes, and pricing.</p>
  </div>
)

const Billing = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Billing & Invoices</h1>
    <p className="text-slate-600">Create invoices, manage quotations, and generate challans.</p>
  </div>
)

const Settings = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-2">Settings</h1>
    <p className="text-slate-600">Organization profile, GST settings, and data backups.</p>
  </div>
)

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="billing/create" element={<CreateDocumentPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
