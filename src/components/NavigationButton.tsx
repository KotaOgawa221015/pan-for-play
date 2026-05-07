'use client';

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
};

export function NavigationButton({ children, onClick, variant = 'primary', disabled, className = '' }: Props) {
  const baseStyles = "px-8 py-3 rounded-full font-bold transition-all active:scale-95 shadow-md disabled:opacity-50";
  const variants = {
    primary: "bg-black text-white dark:bg-white dark:text-black",
    secondary: "border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}