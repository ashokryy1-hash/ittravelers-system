export interface Destination {
  id: string
  name: string
  country: string
  cover_image_url: string
  vibe_description: string
  mood_tags: string[]
}

export interface City {
  id: string
  destination_id: string
  name: string
  vibe_tagline: string
  has_hotels: boolean
  sort_order: number
  cover_image_url: string
}

export interface Hotel {
  id: string
  city_id: string
  name: string
  star_rating: number
  chain: string
  room_types: string[]
  cover_image_url: string
  photo_link_url: string
  tiktok_url: string
  notes: string
  sort_order: number
}

export interface Tour {
  id: string
  name: string
  description: string
  category: 'Romantic' | 'Adventure' | 'Cultural' | 'Nature' | 'Water' | 'Nightlife' | 'Beach Club'
  cover_image_url: string
  tour_link_url: string
  tiktok_1: string
  tiktok_2: string
  tiktok_3: string
  tiktok_4: string
  inclusions: string[]
  exclusions: string[]
  sort_order: number
}

export interface TourCity {
  tour_id: string
  city_id: string
}

export interface SessionSelection {
  type: 'hotel' | 'tour'
  id: string
  name: string
  cityName: string
  details?: string
}
