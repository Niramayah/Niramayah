import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = "" }: BadgeProps) {
  const variantClasses = variant === 'outline' 
    ? "bg-transparent border border-slate-200" 
    : "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}
