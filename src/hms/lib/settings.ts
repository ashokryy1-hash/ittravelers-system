import { supabase } from '../../lib/supabase'
import type { HmsSettings } from '../types'

export async function getSettings(): Promise<HmsSettings> {
  const { data } = await supabase.from('hms_settings').select('*')
  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.key] = row.value
  return {
    IDR_to_EGP: map.IDR_to_EGP ?? '0.0018',
    THB_to_EGP: map.THB_to_EGP ?? '0.085',
    USD_to_EGP: map.USD_to_EGP ?? '50.5',
    outlook_sender_email: map.outlook_sender_email ?? '',
    outlook_sender_name: map.outlook_sender_name ?? 'ITTravelers',
    agency_signature: map.agency_signature ?? '',
    google_places_api_key: map.google_places_api_key ?? '',
    followup_reminder_days: map.followup_reminder_days ?? '7',
  }
}

export async function saveSetting(key: string, value: string) {
  await supabase.from('hms_settings').upsert({ key, value })
}
