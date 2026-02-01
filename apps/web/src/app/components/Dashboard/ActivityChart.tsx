import React from 'react';
import { SectionHeader } from './shared';

// Mock Data representing weekly declarations
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MOCK_VALUES = [40, 70, 50, 30, 60, 95, 45]; // percentage bar heights

export function ActivityChart() {
    return (
        <div className="flex flex-col p-6 bg-[#FCFCFC] rounded-lg h-[347px] relative w-full shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            <SectionHeader
                title="Anmeldungen"
                action={
                    <div className="text-xs text-gray-400 font-semibold border border-[#EFEFEF] px-3 py-1 rounded-lg cursor-pointer hover:bg-gray-50">
                        Wöchentlich ▼
                    </div>
                }
                className="mb-8"
            />

            {/* Chart Area */}
            <div className="flex justify-between items-end h-[170px] w-full px-2 mt-auto">
                {DAYS.map((day, i) => (
                    <div key={day} className="flex flex-col items-center gap-3 group relative cursor-pointer w-full">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#272B30] text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                            {MOCK_VALUES[i]} Fälle
                            {/* Triangle */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#272B30]"></div>
                        </div>

                        {/* Bar */}
                        <div
                            className={`w-8 rounded-sm transition-all duration-300 ${i === 5 ? 'bg-[#2A85FF]' : 'bg-[#B5E4CA] opacity-80 group-hover:opacity-100 group-hover:scale-y-110 origin-bottom'}`}
                            style={{ height: `${MOCK_VALUES[i] * 1.5}px` }}
                        ></div>

                        {/* Label */}
                        <span className="text-[13px] font-semibold text-[#6F767E]">{day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
