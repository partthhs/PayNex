import { forwardRef } from 'react'

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 border border-slate-200',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:ring-blue-500 bg-white',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-300 bg-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
  navy: 'bg-[#172554] text-white hover:bg-[#1e3a8a] focus:ring-blue-700',
  white: 'bg-white text-[#172554] hover:bg-slate-100 focus:ring-slate-300 shadow-xs',
}

const sizes = {
  xs: 'h-7 px-2.5 text-xs rounded-lg',
  sm: 'h-9 px-3.5 text-xs font-semibold rounded-lg',
  md: 'h-10 px-4 text-sm font-semibold rounded-lg',
  lg: 'h-11 px-5 text-sm sm:text-base font-semibold rounded-xl',
}

const Button = forwardRef(({
  variant = 'primary', size = 'md', className = '',
  disabled = false, onClick, children, type = 'button', fullWidth = false,
}, ref) => (
  <button
    ref={ref} type={type} disabled={disabled} onClick={onClick}
    className={[
      'inline-flex items-center justify-center gap-2 font-medium shrink-0',
      'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-60 select-none',
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ')}
  >
    {children}
  </button>
))

Button.displayName = 'Button'
export default Button
