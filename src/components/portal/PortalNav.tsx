'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/portal/dashboard',   label: 'Dashboard' },
  { href: '/portal/fees',        label: 'My Fees' },
  { href: '/portal/complaints',  label: 'Complaints' },
]

export function PortalNav({
  instName,
  userName,
}: {
  instName: string
  userName?: string
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-white px-6 gap-6">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-white text-xs font-bold">H</span>
        </div>
        <span className="text-sm font-semibold text-slate-900">{instName}</span>
      </div>

      <nav className="flex items-center gap-0.5">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname === link.href || pathname.startsWith(link.href + '/')
                ? 'bg-primary/8 text-primary'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {userName && (
          <span className="text-sm text-slate-600">{userName}</span>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  )
}
