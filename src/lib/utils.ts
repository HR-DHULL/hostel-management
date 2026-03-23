import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format currency in INR */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format phone number */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  return phone
}

/** Get initials from full name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Month name from number */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? ''
}

/** Fee status label + color */
export const FEE_STATUS_CONFIG = {
  paid:    { label: 'Paid',    color: 'success' as const },
  partial: { label: 'Partial', color: 'warning' as const },
  pending: { label: 'Pending', color: 'muted'   as const },
  overdue: { label: 'Overdue', color: 'danger'  as const },
}

/** Complaint priority config */
export const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'muted'   as const },
  medium: { label: 'Medium', color: 'warning' as const },
  high:   { label: 'High',   color: 'danger'  as const },
  urgent: { label: 'Urgent', color: 'danger'  as const },
}
