import React from 'react';

interface FilterTabsProps {
    options: string[];
    active: string;
    onChange: (value: string) => void;
}

export function FilterTabs({ options, active, onChange }: FilterTabsProps) {
    return (
        <div className="flex gap-2 p-1 bg-[#F4F4F4] rounded-xl w-fit">
            {options.map((option) => {
                const isActive = active === option;
                return (
                    <button
                        key={option}
                        onClick={() => onChange(option)}
                        className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${isActive
                                ? 'bg-white text-[#1A1D1F] shadow-sm'
                                : 'text-[#6F767E] hover:text-[#1A1D1F] hover:bg-black/5'
                            }`}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
}
