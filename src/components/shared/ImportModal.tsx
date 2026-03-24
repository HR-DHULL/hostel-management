'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  importStudents,
  importLibraryMembers,
  importMessMembers,
  type StudentImportRow,
  type LibraryImportRow,
  type MessImportRow,
} from '@/lib/actions/import'

type Module = 'hostel' | 'library' | 'mess'

const TEMPLATES: Record<Module, { headers: string[]; example: string }> = {
  hostel: {
    headers: ['name', 'phone', 'email', 'course', 'room_number', 'monthly_fee_amount', 'fee_day', 'joining_date', 'notes'],
    example: 'Rahul Sharma,9876543210,rahul@email.com,B.Sc,101,5000,5,2024-01-01,',
  },
  library: {
    headers: ['name', 'phone', 'email', 'seat_number', 'monthly_fee_amount', 'fee_day', 'joining_date', 'notes'],
    example: 'Priya Singh,9876543211,priya@email.com,A-12,1500,5,2024-01-01,',
  },
  mess: {
    headers: ['name', 'phone', 'email', 'meal_plan', 'monthly_fee_amount', 'fee_day', 'joining_date', 'notes'],
    example: 'Amit Kumar,9876543212,amit@email.com,veg,3000,5,2024-01-01,',
  },
}

const MODULE_LABEL: Record<Module, string> = {
  hostel: 'Hostel Students',
  library: 'Library Members',
  mess: 'Mess Members',
}

/** Splits a CSV line respecting quoted fields (e.g. "Smith, John" stays one field) */
function splitCSVLine(line: string): string[] {
  const cols: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cols.push(current.trim())
  return cols
}

function parseCSV(text: string, headers: string[]) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  // Auto-detect if first line is headers
  const firstLine = splitCSVLine(lines[0]).map(h => h.toLowerCase())
  const hasHeader = headers.some(h => firstLine.includes(h))
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map(line => {
    const cols = splitCSVLine(line)
    const row: Record<string, string> = {}
    const keys = hasHeader ? firstLine : headers
    keys.forEach((key, i) => {
      row[key] = cols[i] ?? ''
    })
    return row
  }).filter(row => row['name'] && row['phone'])
}

interface Props {
  module: Module
}

export function ImportModal({ module }: Props) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(0)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const template = TEMPLATES[module]

  function handleFile(file: File) {
    setError('')
    setSuccess(0)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = (e.target?.result as string) ?? ''
      const parsed = parseCSV(text, template.headers)
      if (parsed.length === 0) {
        setError('No valid rows found. Check the format.')
      } else {
        setRows(parsed)
      }
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function downloadTemplate() {
    const csv = [template.headers.join(','), template.example].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${module}-import-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    setError('')
    startTransition(async () => {
      try {
        let count = 0
        let result: { count: number; error?: string }
        if (module === 'hostel') {
          const data: StudentImportRow[] = rows.map(r => ({
            name: r.name,
            phone: r.phone,
            email: r.email || undefined,
            course: r.course || undefined,
            room_number: r.room_number || undefined,
            monthly_fee_amount: Number(r.monthly_fee_amount) || 0,
            fee_day: Number(r.fee_day) || 5,
            joining_date: r.joining_date || new Date().toISOString().split('T')[0],
            notes: r.notes || undefined,
          }))
          result = await importStudents(data)
        } else if (module === 'library') {
          const data: LibraryImportRow[] = rows.map(r => ({
            name: r.name,
            phone: r.phone,
            email: r.email || undefined,
            seat_number: r.seat_number || undefined,
            monthly_fee_amount: Number(r.monthly_fee_amount) || 0,
            fee_day: Number(r.fee_day) || 5,
            joining_date: r.joining_date || new Date().toISOString().split('T')[0],
            notes: r.notes || undefined,
          }))
          result = await importLibraryMembers(data)
        } else {
          const data: MessImportRow[] = rows.map(r => ({
            name: r.name,
            phone: r.phone,
            email: r.email || undefined,
            meal_plan: r.meal_plan || 'veg',
            monthly_fee_amount: Number(r.monthly_fee_amount) || 0,
            fee_day: Number(r.fee_day) || 5,
            joining_date: r.joining_date || new Date().toISOString().split('T')[0],
            notes: r.notes || undefined,
          }))
          result = await importMessMembers(data)
        }
        if (result.error) {
          setError(result.error)
          return
        }
        count = result.count
        setSuccess(count)
        setRows([])
        setFileName('')
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); setSuccess(0); setRows([]); setFileName(''); setError('') }}>
        <Upload className="h-4 w-4" /> Import CSV
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl mx-4 rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Import {MODULE_LABEL[module]}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload a CSV file to bulk-add records</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {success > 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-slate-900">Imported {success} records successfully</p>
              <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
          ) : (
            <>
              {/* Template download */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">CSV Format</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{template.headers.join(', ')}</p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Download template
                </button>
              </div>

              {/* Drop zone */}
              {rows.length === 0 ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-10 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Upload className="h-8 w-8 text-slate-300" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600">Drop CSV here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">Supports .csv files</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">
                      Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} from <span className="font-mono text-xs">{fileName}</span>
                    </p>
                    <button
                      onClick={() => { setRows([]); setFileName('') }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Change file
                    </button>
                  </div>

                  <div className="max-h-52 overflow-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          {template.headers.slice(0, 5).map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                              {h.replace(/_/g, ' ')}
                            </th>
                          ))}
                          {template.headers.length > 5 && (
                            <th className="px-3 py-2 text-left font-semibold text-slate-400">+{template.headers.length - 5} more</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {rows.slice(0, 8).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            {template.headers.slice(0, 5).map(h => (
                              <td key={h} className="px-3 py-1.5 text-slate-700 truncate max-w-[120px]">
                                {row[h] || <span className="text-slate-300">—</span>}
                              </td>
                            ))}
                            {template.headers.length > 5 && <td className="px-3 py-1.5 text-slate-400">…</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 8 && (
                      <p className="px-3 py-2 text-xs text-slate-400 border-t border-border">
                        …and {rows.length - 8} more rows
                      </p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={rows.length === 0 || isPending}
                >
                  {isPending ? 'Importing…' : `Import ${rows.length > 0 ? rows.length + ' rows' : ''}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
