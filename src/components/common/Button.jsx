import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-blue-700 hover:bg-blue-800 text-white shadow-md',
  secondary: 'bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300',
  success: 'bg-green-700 hover:bg-green-800 text-white shadow-md',
  danger: 'bg-red-700 hover:bg-red-800 text-white shadow-md',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200
        disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
