import { Heart, ExternalLink } from 'lucide-react'
import type { Hotel, City } from '../types'
import { useSession } from '../context/SessionContext'
import StarRating from './StarRating'

interface HotelCardProps {
  hotel: Hotel
  city: City
}

export default function HotelCard({ hotel, city }: HotelCardProps) {
  const { toggleHotel, isSelected } = useSession()
  const selected = isSelected('hotel', hotel.id)
  const visibleRooms = hotel.room_types.slice(0, 3)
  const extraRooms = hotel.room_types.length - 3

  return (
    <div className={`card p-5 transition-all ${selected ? 'ring-2 ring-terracotta-400 bg-terracotta-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl text-stone-800 leading-tight">{hotel.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={hotel.star_rating} />
            {hotel.chain && (
              <span className="text-xs text-stone-400 font-body">{hotel.chain}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleHotel(hotel, city)}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            selected
              ? 'bg-terracotta-500 text-white shadow-md scale-110'
              : 'bg-ivory-100 text-stone-400 hover:bg-dusty-rose-100 hover:text-terracotta-400'
          }`}
          aria-label={selected ? 'Remove from selection' : 'Add to selection'}
        >
          <Heart size={16} fill={selected ? 'currentColor' : 'none'} />
        </button>
      </div>

      {hotel.room_types.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {visibleRooms.map(room => (
            <span key={room} className="text-xs bg-ivory-100 text-stone-600 px-2.5 py-1 rounded-full font-body border border-ivory-300">
              {room}
            </span>
          ))}
          {extraRooms > 0 && (
            <span className="text-xs bg-ivory-200 text-stone-500 px-2.5 py-1 rounded-full font-body border border-ivory-300">
              +{extraRooms} more
            </span>
          )}
        </div>
      )}

      {hotel.notes && (
        <p className="mt-2 text-xs text-stone-500 italic font-body">{hotel.notes}</p>
      )}

      <div className="flex gap-2 mt-4">
        {hotel.photo_link_url && (
          <a
            href={hotel.photo_link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-terracotta-600 border border-terracotta-200 px-3 py-1.5 rounded-full hover:bg-terracotta-50 transition-colors font-body"
          >
            <ExternalLink size={12} />
            Photos
          </a>
        )}
        {hotel.tiktok_url && (
          <a
            href={hotel.tiktok_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-50 transition-colors font-body"
          >
            <ExternalLink size={12} />
            TikTok
          </a>
        )}
      </div>
    </div>
  )
}
