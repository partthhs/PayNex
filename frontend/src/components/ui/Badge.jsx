const variants = {
  primary: 'bg-blue-100 text-blue-700 border border-blue-200',
  success: 'bg-green-100 text-green-700 border border-green-200',
  warning: 'bg-amber-100 text-amber-700 border border-amber-200',
  danger:  'bg-red-100 text-red-700 border border-red-200',
  muted:   'bg-slate-100 text-slate-600 border border-slate-200',
  navy:    'bg-[#172554] text-white',
  sky:     'bg-sky-100 text-sky-700 border border-sky-200',
}

export default function Badge({ variant = 'muted', className = '', children }) {
  return (
    <span className={[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant] || variants.muted, className,
    ].join(' ')}>
      {children}
    </span>
  )
}
