import { Heart, ExternalLink } from 'lucide-react'
import type { Tour, City } from '../types'
import { useSession } from '../context/SessionContext'

interface TourCardProps {
  tour: Tour
  city: City
}

const categoryColors: Record<string, string> = {
  Romantic: 'bg-dusty-rose-100 text-dusty-rose-500 border-dusty-rose-200',
  Adventure: 'bg-terracotta-100 text-terracotta-600 border-terracotta-200',
  Cultural: 'bg-amber-50 text-amber-700 border-amber-200',
  Nature: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Water: 'bg-sky-50 text-sky-700 border-sky-200',
}

export default function TourCard({ tour, city }: TourCardProps) {
  const { toggleTour, isSelected } = useSession()
  const selected = isSelected('tour', tour.id)

  return (
    <div className={`card p-5 transition-all ${selected ? 'ring-2 ring-terracotta-400 bg-terracotta-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border mb-2 font-body ${categoryColors[tour.category] ?? 'bg-ivory-100 text-stone-500 border-ivory-200'}`}>
            {tour.category}
          </span>
          <h3 className="font-display text-xl text-stone-800 leading-tight">{tour.name}</h3>
          {tour.description && (
            <p className="mt-1 text-sm text-stone-500 font-body line-clamp-2">{tour.description}</p>
          )}
        </div>
        <button
          onClick={() => toggleTour(tour, city)}
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

      <div className="flex gap-2 mt-4">
        {tour.tour_link_url && (
          <a
            href={tour.tour_link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-terracotta-600 border border-terracotta-200 px-3 py-1.5 rounded-full hover:bg-terracotta-50 transition-colors font-body"
          >
            <ExternalLink size={12} />
            Tour Link
          </a>
        )}
        {tour.tiktok_url && (
          <a
            href={tour.tiktok_url}
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
