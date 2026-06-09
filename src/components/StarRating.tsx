interface StarRatingProps {
  rating: number
}

export default function StarRating({ rating }: StarRatingProps) {
  return (
    <span className="text-gold-500" aria-label={`${rating} stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}
