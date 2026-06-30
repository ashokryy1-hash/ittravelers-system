export interface HmsDestination {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface HmsCity {
  id: string
  destination_id: string
  name: string
  sort_order: number
}

export interface HmsOutreachHotel {
  id: string
  name: string
  destination_id: string
  city: string | null
  star_rating: number | null
  website: string | null
  google_maps_url: string | null
  contact_name: string | null
  contact_email: string | null
  email_source: 'extracted' | 'manual' | 'not_found'
  stage: 'Prospect' | 'Contacted' | 'Replied' | 'Negotiating' | 'Signed' | 'Declined'
  date_added: string
  last_contact_date: string | null
  follow_up_date: string | null
  notes: string | null
  contract_file_url: string | null
  google_place_id: string | null
  created_at: string
  hms_destinations?: HmsDestination
}

export interface HmsOutreachEmail {
  id: string
  hotel_id: string
  direction: 'sent' | 'received'
  subject: string | null
  body: string | null
  sent_at: string
}

export interface HmsHotel {
  id: string
  name: string
  destination_id: string
  city: string | null
  star_rating: number | null
  chain: string | null
  contract_status: 'Active' | 'Expiring soon' | 'Expired'
  valid_from: string | null
  valid_to: string | null
  booking_window_from: string | null
  booking_window_to: string | null
  contact_name: string | null
  contact_email: string | null
  surcharge_waiver: 'none' | '50%' | '100%'
  photo_link_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  hms_destinations?: HmsDestination
}

export interface HmsRoomType {
  id: string
  hotel_id: string
  name: string
  room_category: 'room' | 'villa'
  low_season_rate: number | null
  high_season_rate: number | null
  peak_season_rate: number | null
  currency: string
  meal_plan: string | null
  availability: number | null
  notes: string | null
  sort_order: number
  hms_hotels?: HmsHotel
}

export interface HmsSurchargeRule {
  id: string
  destination_id: string
  season_name: string
  start_date: string
  end_date: string
  room_surcharge: number
  villa_surcharge: number
}

export interface HmsBooking {
  id: string
  client_name: string
  hotel_id: string | null
  room_type_id: string | null
  checkin_date: string
  checkout_date: string
  nights: number | null
  rate_per_night: number | null
  total_price_idr: number | null
  total_price_egp: number | null
  currency: string
  meal_plan: string | null
  status: 'Availability pending' | 'Confirmed' | 'Paid' | 'Cancelled'
  hotel_confirmation_number: string | null
  cutoff_date: string | null
  notes: string | null
  quoted_price: number | null
  paid_price: number | null
  created_at: string
  hms_hotels?: HmsHotel
  hms_room_types?: HmsRoomType
}

export interface HmsBookingEmail {
  id: string
  booking_id: string
  direction: 'sent' | 'received'
  subject: string | null
  body: string | null
  sent_at: string
}

export interface HmsSettings {
  IDR_to_EGP: string
  THB_to_EGP: string
  USD_to_EGP: string
  outlook_sender_email: string
  outlook_sender_name: string
  agency_signature: string
  google_places_api_key: string
  followup_reminder_days: string
  google_meet_link: string
  calendly_link: string
  office_address: string
  sample_package_link: string
}

export type Season = 'low' | 'high' | 'peak'

export interface RateQuoteResult {
  hotel: HmsHotel
  roomType: HmsRoomType
  season: Season
  baseRate: number
  surcharge: number
  totalPerNight: number
  totalStay: number
  nights: number
}
