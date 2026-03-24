'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Pencil, X, Check, ChevronDown, ChevronRight, DoorOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createHostel, updateHostel, deleteHostel,
  createRoom, updateRoom, deleteRoom,
} from '@/lib/actions/buildings'

type Room = {
  id: string
  room_number: string
  capacity: number
  occupied: number
}

type Hostel = {
  id: string
  name: string
  description: string | null
  rooms: Room[]
}

export function BuildingsClient({ hostels: initial }: { hostels: Hostel[] }) {
  const [hostels, setHostels] = useState(initial)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Add hostel form
  const [showAddHostel, setShowAddHostel] = useState(false)
  const [newHostelName, setNewHostelName] = useState('')
  const [newHostelDesc, setNewHostelDesc] = useState('')

  // Edit hostel
  const [editingHostelId, setEditingHostelId] = useState<string | null>(null)
  const [editHostelName, setEditHostelName] = useState('')
  const [editHostelDesc, setEditHostelDesc] = useState('')

  // Add room form per hostel
  const [addingRoomFor, setAddingRoomFor] = useState<string | null>(null)
  const [newRoomNumber, setNewRoomNumber] = useState('')
  const [newRoomCapacity, setNewRoomCapacity] = useState('1')

  // Edit room
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editRoomNumber, setEditRoomNumber] = useState('')
  const [editRoomCapacity, setEditRoomCapacity] = useState('1')

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleAddHostel() {
    if (!newHostelName.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await createHostel(newHostelName.trim(), newHostelDesc.trim() || undefined)
        setNewHostelName('')
        setNewHostelDesc('')
        setShowAddHostel(false)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleUpdateHostel(id: string) {
    if (!editHostelName.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await updateHostel(id, editHostelName.trim(), editHostelDesc.trim() || undefined)
        setEditingHostelId(null)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleDeleteHostel(id: string, name: string) {
    if (!confirm(`Delete hostel "${name}"? All rooms will also be deleted.`)) return
    setError('')
    startTransition(async () => {
      try {
        await deleteHostel(id)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleAddRoom(hostelId: string) {
    if (!newRoomNumber.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await createRoom(hostelId, newRoomNumber.trim(), Number(newRoomCapacity) || 1)
        setNewRoomNumber('')
        setNewRoomCapacity('1')
        setAddingRoomFor(null)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleUpdateRoom(id: string) {
    if (!editRoomNumber.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await updateRoom(id, editRoomNumber.trim(), Number(editRoomCapacity) || 1)
        setEditingRoomId(null)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleDeleteRoom(id: string, roomNumber: string) {
    if (!confirm(`Delete room "${roomNumber}"?`)) return
    setError('')
    startTransition(async () => {
      try {
        await deleteRoom(id)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add Hostel */}
      {showAddHostel ? (
        <div className="rounded-lg border border-border bg-white p-4 space-y-3">
          <p className="text-sm font-medium text-slate-900">New Hostel / Block</p>
          <input
            autoFocus
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Block A / Boys Hostel"
            value={newHostelName}
            onChange={e => setNewHostelName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddHostel()}
          />
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Description (optional)"
            value={newHostelDesc}
            onChange={e => setNewHostelDesc(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddHostel} disabled={isPending || !newHostelName.trim()}>
              <Check className="h-3.5 w-3.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddHostel(false)}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={() => setShowAddHostel(true)}>
          <Plus className="h-4 w-4" /> Add Hostel / Block
        </Button>
      )}

      {/* Hostels list */}
      {hostels.length === 0 && !showAddHostel && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16">
          <DoorOpen className="h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No hostels yet</p>
          <p className="text-xs text-slate-400 mt-1">Add a hostel block to get started</p>
        </div>
      )}

      {initial.map(hostel => {
        const isExpanded = expanded[hostel.id] ?? true
        const totalCapacity = hostel.rooms.reduce((s, r) => s + r.capacity, 0)
        const totalOccupied = hostel.rooms.reduce((s, r) => s + r.occupied, 0)
        const isEditingThis = editingHostelId === hostel.id

        return (
          <div key={hostel.id} className="rounded-lg border border-border bg-white overflow-hidden">
            {/* Hostel header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-border">
              <button
                onClick={() => toggleExpand(hostel.id)}
                className="text-slate-500 hover:text-slate-900 transition-colors"
              >
                {isExpanded
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />
                }
              </button>

              {isEditingThis ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    className="flex-1 rounded border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    value={editHostelName}
                    onChange={e => setEditHostelName(e.target.value)}
                  />
                  <input
                    className="w-48 rounded border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Description"
                    value={editHostelDesc}
                    onChange={e => setEditHostelDesc(e.target.value)}
                  />
                  <button
                    onClick={() => handleUpdateHostel(hostel.id)}
                    className="p-1 text-green-600 hover:text-green-800"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingHostelId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-900 text-sm">{hostel.name}</span>
                  {hostel.description && (
                    <span className="text-xs text-slate-500 truncate">{hostel.description}</span>
                  )}
                  <span className="ml-auto text-xs text-slate-500 shrink-0">
                    {totalOccupied}/{totalCapacity} occupied · {hostel.rooms.length} rooms
                  </span>
                  <button
                    onClick={() => {
                      setEditingHostelId(hostel.id)
                      setEditHostelName(hostel.name)
                      setEditHostelDesc(hostel.description ?? '')
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteHostel(hostel.id, hostel.name)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete"
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Rooms */}
            {isExpanded && (
              <div className="divide-y divide-slate-50">
                {hostel.rooms.length === 0 && addingRoomFor !== hostel.id && (
                  <p className="px-4 py-3 text-xs text-slate-400">No rooms yet — add one below</p>
                )}

                {hostel.rooms.map(room => {
                  const pct = room.capacity > 0 ? (room.occupied / room.capacity) * 100 : 0
                  const statusColor = pct >= 100
                    ? 'bg-red-100 text-red-700'
                    : pct > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                  const isEditingRoom = editingRoomId === room.id

                  return (
                    <div key={room.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 text-sm">
                      <DoorOpen className="h-3.5 w-3.5 text-slate-300 shrink-0" />

                      {isEditingRoom ? (
                        <>
                          <input
                            autoFocus
                            className="w-24 rounded border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Room no."
                            value={editRoomNumber}
                            onChange={e => setEditRoomNumber(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateRoom(room.id)}
                          />
                          <input
                            type="number"
                            className="w-20 rounded border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Capacity"
                            value={editRoomCapacity}
                            onChange={e => setEditRoomCapacity(e.target.value)}
                            min="1"
                            max="20"
                          />
                          <button
                            onClick={() => handleUpdateRoom(room.id)}
                            disabled={isPending || !editRoomNumber.trim()}
                            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-40"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingRoomId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-slate-800 w-20">Room {room.room_number}</span>
                          <span className="text-slate-500">Capacity: {room.capacity}</span>
                          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                            {room.occupied}/{room.capacity} occupied
                          </span>
                          <button
                            onClick={() => {
                              setEditingRoomId(room.id)
                              setEditRoomNumber(room.room_number)
                              setEditRoomCapacity(String(room.capacity))
                            }}
                            className="ml-auto p-1 text-slate-300 hover:text-slate-700 transition-colors"
                            title="Edit room"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.room_number)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                            disabled={isPending}
                            title="Delete room"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}

                {/* Add room form */}
                {addingRoomFor === hostel.id ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/70">
                    <input
                      autoFocus
                      className="w-28 rounded border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Room no."
                      value={newRoomNumber}
                      onChange={e => setNewRoomNumber(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddRoom(hostel.id)}
                    />
                    <input
                      type="number"
                      className="w-20 rounded border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Cap."
                      value={newRoomCapacity}
                      onChange={e => setNewRoomCapacity(e.target.value)}
                      min="1"
                      max="20"
                    />
                    <button
                      onClick={() => handleAddRoom(hostel.id)}
                      disabled={isPending || !newRoomNumber.trim()}
                      className="p-1 text-green-600 hover:text-green-800 disabled:opacity-40"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setAddingRoomFor(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingRoomFor(hostel.id)
                      setExpanded(prev => ({ ...prev, [hostel.id]: true }))
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add room
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
