import { Star } from 'lucide-react'

export default function RatingStars({ rating = 0, reviews, size = 'sm' }) {
  const starSize = size === 'md' ? 16 : 12
  const full  = Math.floor(rating)
  const empty = 5 - Math.ceil(rating)

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full  }).map((_, i) => (
          <Star key={`f${i}`} size={starSize} className="text-amber-400 fill-amber-400" />
        ))}
        {rating % 1 >= 0.5 && (
          <span className="relative inline-flex" style={{ width: starSize, height: starSize }}>
            <Star size={starSize} className="text-slate-200 fill-slate-200 absolute" />
            <span className="overflow-hidden inline-block" style={{ width: '50%' }}>
              <Star size={starSize} className="text-amber-400 fill-amber-400" />
            </span>
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} size={starSize} className="text-slate-200 fill-slate-200" />
        ))}
      </div>
      <span className="text-xs text-slate-500 font-medium">{rating.toFixed(1)}</span>
      {reviews != null && (
        <span className="text-xs text-slate-400">({reviews.toLocaleString()})</span>
      )}
    </div>
  )
}
