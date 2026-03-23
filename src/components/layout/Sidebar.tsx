'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  UtensilsCrossed,
  MessageSquare,
  Wallet,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Hostel',
    href: '/hostel',
    icon: Building2,
  },
  {
    label: 'Library',
    href: '/library',
    icon: BookOpen,
  },
  {
    label: 'Mess',
    href: '/mess',
    icon: UtensilsCrossed,
  },
  {
    label: 'Complaints',
    href: '/complaints',
    icon: MessageSquare,
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: Wallet,
  },
]

interface SidebarProps {
  instName?: string
  userRole?: string
  userName?: string
}

export function Sidebar({ instName = 'Hazeon HMS', userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-white"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo / Institute Name */}
      <div className="flex h-14 items-center border-b border-border px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">
            {instName}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/8 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 pt-4 border-t border-border">
          <Link
            href="/settings"
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-primary/8 text-primary'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Settings
              className={cn(
                'h-4 w-4 shrink-0',
                pathname.startsWith('/settings') ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
              )}
            />
            Settings
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">
              {userName ?? 'User'}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">{userRole ?? 'staff'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
