import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    size?: number; // Icon size
    variant?: 'ghost' | 'outline' | 'white';
}

export function IconButton({ icon: Icon, size = 18, variant = 'white', className = '', ...props }: IconButtonProps) {
    const variants = {
        white: 'bg-white border border-gray-100 shadow-sm hover:bg-gray-50 text-[#6F767E]',
        outline: 'bg-transparent border border-[#EFEFEF] hover:bg-[#FCFCFC] text-[#6F767E]',
        ghost: 'bg-transparent hover:bg-[#EFEFEF]/50 text-[#6F767E]',
    };

    return (
        <button
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${variants[variant]} ${className}`}
            {...props}
        >
            <Icon size={size} />
        </button>
    );
}
