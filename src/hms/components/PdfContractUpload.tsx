import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Upload, FileText, Check, X, AlertCircle, Loader } from 'lucide-react'
import type { HmsDestination, HmsHotel, HmsRoomType } from '../types'
import toast from 'react-hot-toast'

interface ExtractedRoomType {
  name: string
  room_category: 'room' | 'villa'
  low_season_rate: number | null
  high_season_rate: number | null
  peak_season_rate: number | null
  currency: string
  meal_plan: string
  notes: string
}

interface ExtractedHotel {
  name: string
  city: string
  star_rating: number | null
  chain: string
  contact_name: string
  contact_email: string
  surcharge_waiver: 'none' | '50%' | '100%'
  valid_from: string
  valid_to: string
  booking_window_from: string
  booking_window_to: string
  photo_link_url: string
  notes: string
  room_types: ExtractedRoomType[]
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

type Step = 'upload' | 'extracting' | 'review' | 'saving' | 'done'

export default function PdfContractUpload({ onClose, onSaved }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [extracted, setExtracted] = useState<ExtractedHotel | null>(null)
  const [editedHotel, setEditedHotel] = useState<ExtractedHotel | null>(null)
  const [existingMatch, setExistingMatch] = useState<HmsHotel | null>(null)
  const [action, setAction] = useState<'update' | 'add' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: destinations } = useQuery<HmsDestination[]>({
    queryKey: ['hms_destinations'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_destinations').select('*').order('name')
      return data ?? []
    },
  })

  const { data: existingHotels } = useQuery<HmsHotel[]>({
    queryKey: ['hms_hotels'],
    queryFn: async () => {
      const { data } = await supabase.from('hms_hotels').select('*')
      return data ?? []
    },
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('PDF must be under 20MB')
      return
    }

    setFileName(file.name)
    setStep('extracting')
    setErrorMsg('')

    try {
      // Convert PDF to base64
      const base64 = await fileToBase64(file)

      // Call our server-side API route (avoids browser CORS restrictions)
      const response = await fetch('/api/extract-contract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMsg(`Extraction failed: ${data.error ?? 'Unknown error'}`)
        setStep('upload')
        return
      }

      const hotel: ExtractedHotel = data

      // Check if hotel already exists
      const match = existingHotels?.find(
        h => h.name.toLowerCase().trim() === hotel.name.toLowerCase().trim()
      )
      setExistingMatch(match ?? null)
      setExtracted(hotel)
      setEditedHotel(hotel)
      setStep('review')

    } catch (err: any) {
      setErrorMsg(`Failed to extract: ${err.message ?? 'Unknown error'}. Make sure the PDF is readable (not scanned image).`)
      setStep('upload')
    }
  }

  async function save() {
    if (!editedHotel) return
    setStep('saving')

    try {
      // Find destination ID for Bali (default)
      const baliDest = destinations?.find(d => d.name === 'Bali')
      const destId = baliDest?.id ?? destinations?.[0]?.id

      let hotelId: string

      if (action === 'update' && existingMatch) {
        // Update existing hotel
        await supabase.from('hms_hotels').update({
          name: editedHotel.name,
          city: editedHotel.city,
          star_rating: editedHotel.star_rating,
          chain: editedHotel.chain || null,
          contact_name: editedHotel.contact_name || null,
          contact_email: editedHotel.contact_email || null,
          surcharge_waiver: editedHotel.surcharge_waiver,
          valid_from: editedHotel.valid_from || null,
          valid_to: editedHotel.valid_to || null,
          booking_window_from: editedHotel.booking_window_from || null,
          booking_window_to: editedHotel.booking_window_to || null,
          notes: editedHotel.notes || null,
          updated_at: new Date().toISOString(),
        }).eq('id', existingMatch.id)
        hotelId = existingMatch.id

        // Delete old room types and re-insert
        await supabase.from('hms_room_types').delete().eq('hotel_id', hotelId)
      } else {
        // Insert new hotel
        const { data: newHotel, error } = await supabase
          .from('hms_hotels')
          .insert({
            name: editedHotel.name,
            destination_id: destId,
            city: editedHotel.city,
            star_rating: editedHotel.star_rating,
            chain: editedHotel.chain || null,
            contact_name: editedHotel.contact_name || null,
            contact_email: editedHotel.contact_email || null,
            surcharge_waiver: editedHotel.surcharge_waiver,
            valid_from: editedHotel.valid_from || null,
            valid_to: editedHotel.valid_to || null,
            booking_window_from: editedHotel.booking_window_from || null,
            booking_window_to: editedHotel.booking_window_to || null,
            notes: editedHotel.notes || null,
          })
          .select()
          .single()

        if (error) throw error
        hotelId = newHotel.id
      }

      // Insert room types
      if (editedHotel.room_types.length > 0) {
        await supabase.from('hms_room_types').insert(
          editedHotel.room_types.map((r, i) => ({
            hotel_id: hotelId,
            name: r.name,
            room_category: r.room_category,
            low_season_rate: r.low_season_rate,
            high_season_rate: r.high_season_rate,
            peak_season_rate: r.peak_season_rate,
            currency: r.currency || 'IDR',
            meal_plan: r.meal_plan || 'BB',
            notes: r.notes || null,
            sort_order: i,
          }))
        )
      }

      qc.invalidateQueries({ queryKey: ['hms_hotels'] })
      setStep('done')
      toast.success(`${editedHotel.name} saved successfully!`)

    } catch (err: any) {
      setErrorMsg(`Failed to save: ${err.message}`)
      setStep('review')
    }
  }

  const setField = (k: keyof Omit<ExtractedHotel, 'room_types'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setEditedHotel(h => h ? { ...h, [k]: e.target.value } : h)

  function updateRoom(i: number, k: keyof ExtractedRoomType, v: string) {
    setEditedHotel(h => {
      if (!h) return h
      const rooms = [...h.room_types]
      rooms[i] = { ...rooms[i], [k]: k.includes('rate') ? (v ? parseFloat(v) : null) : v }
      return { ...h, room_types: rooms }
    })
  }

  function removeRoom(i: number) {
    setEditedHotel(h => h ? { ...h, room_types: h.room_types.filter((_, idx) => idx !== i) } : h)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-800">
            {step === 'upload' && 'Upload Contract PDF'}
            {step === 'extracting' && 'Reading Contract…'}
            {step === 'review' && 'Review Extracted Data'}
            {step === 'saving' && 'Saving…'}
            {step === 'done' && 'Contract Saved!'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Upload step */}
          {step === 'upload' && (
            <div className="p-8 flex flex-col items-center gap-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors"
              >
                <FileText size={40} className="text-gray-300" />
                <div className="text-center">
                  <p className="font-medium text-gray-700">Click to upload your hotel contract PDF</p>
                  <p className="text-sm text-gray-400 mt-1">The AI will automatically extract hotel name, room types, rates, dates, and contact details</p>
                  <p className="text-xs text-gray-300 mt-2">PDF only · Max 20MB · Must be text-based (not a scanned image)</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
              {errorMsg && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 w-full">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Extracting step */}
          {step === 'extracting' && (
            <div className="p-10 flex flex-col items-center gap-4">
              <Loader size={36} className="text-teal-500 animate-spin" />
              <div className="text-center">
                <p className="font-medium text-gray-700">Reading {fileName}…</p>
                <p className="text-sm text-gray-400 mt-1">Claude AI is extracting hotel details, room types, and rates</p>
                <p className="text-xs text-gray-300 mt-1">This takes about 10–20 seconds</p>
              </div>
            </div>
          )}

          {/* Review step */}
          {step === 'review' && editedHotel && (
            <div className="p-5 space-y-5">

              {/* Existing hotel warning */}
              {existingMatch && !action && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    ⚠️ "{existingMatch.name}" already exists in your rate directory.
                  </p>
                  <p className="text-xs text-amber-600 mb-3">Do you want to update the existing record, or add this as a new entry?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setAction('update')} className="text-sm bg-amber-600 text-white rounded-lg px-4 py-1.5 hover:bg-amber-700">Update existing</button>
                    <button onClick={() => setAction('add')} className="text-sm border border-amber-400 text-amber-700 rounded-lg px-4 py-1.5 hover:bg-amber-50">Add as new</button>
                  </div>
                </div>
              )}

              {(!existingMatch || action) && (
                <>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-700">
                    ✓ AI extracted the data below. Review everything carefully, edit if needed, then click Save.
                  </div>

                  {/* Hotel details */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Hotel Details</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Hotel name">
                        <input className={inp} value={editedHotel.name} onChange={setField('name')} />
                      </Field>
                      <Field label="City / Area">
                        <input className={inp} value={editedHotel.city} onChange={setField('city')} />
                      </Field>
                      <Field label="Star rating">
                        <select className={inp} value={editedHotel.star_rating ?? ''} onChange={setField('star_rating')}>
                          <option value="">—</option>
                          {[3,4,5].map(n => <option key={n} value={n}>{n} stars</option>)}
                        </select>
                      </Field>
                      <Field label="Chain / Group">
                        <input className={inp} value={editedHotel.chain} onChange={setField('chain')} />
                      </Field>
                      <Field label="Contact name">
                        <input className={inp} value={editedHotel.contact_name} onChange={setField('contact_name')} />
                      </Field>
                      <Field label="Contact email">
                        <input type="email" className={inp} value={editedHotel.contact_email} onChange={setField('contact_email')} />
                      </Field>
                      <Field label="Surcharge waiver">
                        <select className={inp} value={editedHotel.surcharge_waiver} onChange={setField('surcharge_waiver')}>
                          <option value="none">None</option>
                          <option value="50%">50% waiver</option>
                          <option value="100%">100% waiver</option>
                        </select>
                      </Field>
                      <Field label="Contract valid from">
                        <input type="date" className={inp} value={editedHotel.valid_from} onChange={setField('valid_from')} />
                      </Field>
                      <Field label="Contract valid to">
                        <input type="date" className={inp} value={editedHotel.valid_to} onChange={setField('valid_to')} />
                      </Field>
                      <Field label="Booking window from">
                        <input type="date" className={inp} value={editedHotel.booking_window_from} onChange={setField('booking_window_from')} />
                      </Field>
                      <Field label="Booking window to">
                        <input type="date" className={inp} value={editedHotel.booking_window_to} onChange={setField('booking_window_to')} />
                      </Field>
                    </div>
                    {editedHotel.notes && (
                      <Field label="Notes">
                        <textarea className={`${inp} h-16 resize-none mt-3`} value={editedHotel.notes} onChange={setField('notes')} />
                      </Field>
                    )}
                  </div>

                  {/* Room types */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                      Room Types ({editedHotel.room_types.length} extracted)
                    </h3>
                    <div className="space-y-3">
                      {editedHotel.room_types.map((room, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Room type {i + 1}</span>
                            <button onClick={() => removeRoom(i)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <Field label="Name">
                              <input className={inp} value={room.name} onChange={e => updateRoom(i, 'name', e.target.value)} />
                            </Field>
                            <Field label="Category">
                              <select className={inp} value={room.room_category} onChange={e => updateRoom(i, 'room_category', e.target.value)}>
                                <option value="room">Room (non-private pool)</option>
                                <option value="villa">Villa (private pool)</option>
                              </select>
                            </Field>
                            <Field label="Currency">
                              <select className={inp} value={room.currency} onChange={e => updateRoom(i, 'currency', e.target.value)}>
                                <option>IDR</option><option>THB</option><option>USD</option>
                              </select>
                            </Field>
                            <Field label="Meal plan">
                              <select className={inp} value={room.meal_plan} onChange={e => updateRoom(i, 'meal_plan', e.target.value)}>
                                {['RO','BB','HB','FB','AI'].map(m => <option key={m}>{m}</option>)}
                              </select>
                            </Field>
                            <Field label="Low season rate">
                              <input type="number" className={inp} value={room.low_season_rate ?? ''} onChange={e => updateRoom(i, 'low_season_rate', e.target.value)} />
                            </Field>
                            <Field label="High season rate">
                              <input type="number" className={inp} value={room.high_season_rate ?? ''} onChange={e => updateRoom(i, 'high_season_rate', e.target.value)} />
                            </Field>
                            <Field label="Peak season rate">
                              <input type="number" className={inp} value={room.peak_season_rate ?? ''} onChange={e => updateRoom(i, 'peak_season_rate', e.target.value)} />
                            </Field>
                            {room.notes && (
                              <Field label="Notes">
                                <input className={inp} value={room.notes} onChange={e => updateRoom(i, 'notes', e.target.value)} />
                              </Field>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      {errorMsg}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Saving step */}
          {step === 'saving' && (
            <div className="p-10 flex flex-col items-center gap-4">
              <Loader size={36} className="text-teal-500 animate-spin" />
              <p className="text-gray-600">Saving to your rate directory…</p>
            </div>
          )}

          {/* Done step */}
          {step === 'done' && (
            <div className="p-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <Check size={32} className="text-teal-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-lg">{editedHotel?.name} saved!</p>
                <p className="text-sm text-gray-500 mt-1">{editedHotel?.room_types.length} room types added to your rate directory.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('upload'); setExtracted(null); setEditedHotel(null); setExistingMatch(null); setAction(null); setFileName('') }}
                  className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  Upload another contract
                </button>
                <button
                  onClick={() => { onSaved(); onClose() }}
                  className="text-sm bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
                >
                  Go to Rate Directory
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === 'review' && editedHotel && (!existingMatch || action) && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 shrink-0">
            <button onClick={() => { setStep('upload'); setExtracted(null); setEditedHotel(null) }} className="text-sm text-gray-500 hover:text-gray-700">
              ← Upload different PDF
            </button>
            <button
              onClick={save}
              className="text-sm bg-teal-600 text-white rounded-lg px-6 py-2 hover:bg-teal-700 font-medium"
            >
              Save to Rate Directory
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white'
