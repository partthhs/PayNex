import { CURRENCY } from '../../constants'

function formatINR(n) {
  return n.toLocaleString('en-IN')
}

const cls = {
  sm: { price: 'text-base font-bold', orig: 'text-xs', pct: 'text-xs px-1.5 py-0.5' },
  md: { price: 'text-xl font-bold',   orig: 'text-sm', pct: 'text-xs px-2 py-0.5'   },
  lg: { price: 'text-3xl font-bold',  orig: 'text-base', pct: 'text-sm px-2.5 py-1' },
}

export default function PriceDisplay({ price, originalPrice, size = 'md' }) {
  const c = cls[size] || cls.md
  const pct = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null

  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className={`${c.price} text-blue-700`}>{CURRENCY}{formatINR(price)}</span>
      {originalPrice && (
        <>
          <span className={`${c.orig} text-slate-400 line-through`}>{CURRENCY}{formatINR(originalPrice)}</span>
          <span className={`${c.pct} bg-green-100 text-green-700 rounded-full font-semibold`}>{pct}% off</span>
        </>
      )}
    </div>
  )
}
