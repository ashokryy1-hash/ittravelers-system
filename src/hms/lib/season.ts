import type { HmsSurchargeRule, Season } from '../types'

export function getSeasonForDate(
  date: Date,
  rules: HmsSurchargeRule[]
): { season: Season; rule: HmsSurchargeRule | null } {
  const d = date.toISOString().split('T')[0]
  for (const rule of rules) {
    if (d >= rule.start_date && d <= rule.end_date) {
      if (rule.season_name.toLowerCase().includes('peak')) {
        return { season: 'peak', rule }
      }
      return { season: 'high', rule }
    }
  }
  return { season: 'low', rule: null }
}

export function getSeasonForStay(
  checkin: string,
  checkout: string,
  rules: HmsSurchargeRule[]
): { season: Season; rule: HmsSurchargeRule | null } {
  // Use checkin date to determine season (simplified: majority-wins not needed, use first night)
  return getSeasonForDate(new Date(checkin), rules)
}

export function getSurcharge(
  season: Season,
  rule: HmsSurchargeRule | null,
  category: 'room' | 'villa',
  waiver: 'none' | '50%' | '100%'
): number {
  if (season === 'low' || !rule) return 0
  const base = category === 'villa' ? rule.villa_surcharge : rule.room_surcharge
  if (waiver === '100%') return 0
  if (waiver === '50%') return base * 0.5
  return base
}

export function seasonLabel(season: Season): string {
  return season === 'peak' ? 'Peak' : season === 'high' ? 'High' : 'Low'
}

export function nightsBetween(checkin: string, checkout: string): number {
  const a = new Date(checkin).getTime()
  const b = new Date(checkout).getTime()
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)))
}
