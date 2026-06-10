import { useState } from 'react'
import { Heart, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import type { Tour, City } from '../types'
import { useSession } from '../context/SessionContext'

interface TourCardProps {
  tour: Tour
  city: City
}

const categoryColors: Record<string, string> = {
  Romantic:    'bg-dusty-rose-100 text-dusty-rose-500 border-dusty-rose-200',
  Adventure:   'bg-terracotta-100 text-terracotta-600 border-terracotta-200',
  Cultural:    'bg-amber-50 text-amber-700 border-amber-200',
  Nature:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Water:       'bg-sky-50 text-sky-700 border-sky-200',
  Nightlife:   'bg-purple-50 text-purple-700 border-purple-200',
  'Beach Club':'bg-cyan-50 text-cyan-700 border-cyan-200',
}

const categoryPhotos: Record<string, string> = {
  Romantic:    'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=600&q=80',
  Adventure:   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  Cultural:    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80',
  Nature:      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80',
  Water:       'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  Nightlife:   'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
  'Beach Club':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
}

export default function TourCard({ tour, city }: TourCardProps) {
  const { toggleTour, isSelected } = useSession()
  const selected = isSelected('tour', tour.id)
  const [showDetails, setShowDetails] = useState(false)

  const photo = tour.cover_image_url || categoryPhotos[tour.category]
  const tiktokLinks = [tour.tiktok_1, tour.tiktok_2, tour.tiktok_3, tour.tiktok_4].filter(Boolean)
  const hasDetails = (tour.inclusions?.length > 0) || (tour.exclusions?.length > 0)

  return (
    <div className={`card overflow-hidden transition-all ${selected ? 'ring-2 ring-terracotta-400' : ''}`}>
      {/* Cover photo */}
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={photo}
          alt={tour.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-0.5 rounded-full border font-body backdrop-blur-sm ${categoryColors[tour.category] ?? 'bg-ivory-100 text-stone-500 border-ivory-200'}`}>
          {tour.category}
        </span>
        <button
          onClick={() => toggleTour(tour, city)}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
            selected
              ? 'bg-terracotta-500 text-white scale-110'
              : 'bg-white/80 text-stone-400 hover:bg-white hover:text-terracotta-400'
          }`}
          aria-label={selected ? 'Remove from selection' : 'Add to selection'}
        >
          <Heart size={16} fill={selected ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-display text-xl text-stone-800 leading-tight">{tour.name}</h3>
        {tour.description && (
          <p className="mt-1 text-sm text-stone-500 font-body line-clamp-2">{tour.description}</p>
        )}

        {/* TikTok buttons */}
        {tiktokLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tiktokLinks.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-50 transition-colors font-body"
              >
                TikTok {tiktokLinks.length > 1 ? i + 1 : ''}
              </a>
            ))}
          </div>
        )}

        {/* Details toggle */}
        {hasDetails && (
          <div className="mt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs text-terracotta-600 font-body font-medium hover:text-terracotta-700 transition-colors"
            >
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showDetails ? 'Hide details' : 'Show details'}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-3">
                {tour.inclusions?.length > 0 && (
                  <div>
                    <p className="text-xs font-body font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Included</p>
                    <div className="flex flex-col gap-1">
                      {tour.inclusions.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-stone-600 font-body">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {tour.exclusions?.length > 0 && (
                  <div>
                    <p className="text-xs font-body font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Not Included</p>
                    <div className="flex flex-col gap-1">
                      {tour.exclusions.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <X size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-stone-600 font-body">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
