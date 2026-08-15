import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  FileText,
  Settings,
  Building2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function AppLayout() {
  const location = useLocation()
  const { activeOrganization, isNavbarVisible, toggleNavbar } = useAppStore()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/vendors', icon: Truck, label: 'Vendors' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/billing', icon: FileText, label: 'Billing' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="relative h-screen w-screen bg-[#f4f7f9] font-sans overflow-hidden text-sm">
      {/* STRUCTURED FLOATING ERP COMMAND BAR */}
      <header
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isNavbarVisible
            ? 'top-5 opacity-100 scale-100'
            : '-top-28 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1.5 bg-white border border-slate-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] rounded-lg w-max min-w-[950px]">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 pl-2 pr-4">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-sm">
              H
            </div>
            <span className="font-bold text-[15px] tracking-tight text-slate-900 pr-1">
              Hisab365
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-6 bg-slate-200"></div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Vertical Divider */}
          <div className="w-px h-6 bg-slate-200"></div>

          {/* Right Section: Organization & Collapse */}
          <div className="flex items-center gap-2 pl-4 pr-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#f0f4ff] border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors whitespace-nowrap">
              <Building2 size={13} className="text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {activeOrganization || 'DEVRAJ STORE'}
              </span>
              <ChevronUp size={13} className="ml-1 opacity-60 text-blue-700" />
            </div>

            <button
              onClick={toggleNavbar}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-transparent"
              title="Hide Navigation Bar"
            >
              <ChevronUp size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* RECTANGULAR TRIGGER TAB (When Hidden) */}
      <button
        onClick={toggleNavbar}
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-40 px-6 py-1.5 bg-white border border-slate-200 border-t-0 rounded-b-md shadow-sm text-slate-400 hover:text-slate-800 transition-all duration-200 hover:pb-2.5 ${
          isNavbarVisible ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <ChevronDown size={18} />
      </button>

      {/* PAGE CONTENT */}
      <main className="absolute inset-0 overflow-y-auto pt-[6.5rem] px-6 pb-6">
        <Outlet />
      </main>
    </div>
  )
}
