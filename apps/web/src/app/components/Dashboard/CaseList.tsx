import React, { useState } from 'react';
import { FileText, MoreHorizontal, Edit2, MessageCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { SectionHeader, FilterTabs, ProgressBar, IconButton } from './shared';

interface CaseItem {
    id: string;
    title: string;
    date: string;
    status: 'draft' | 'submitted' | 'archived';
    progress: number;
    imageColor: string; // Tailwind class
}

// Mock Data
const MOCK_CASES: CaseItem[] = [
    { id: '1', title: 'Import Elektronik China', date: '25 Sep - 4 Oct', status: 'submitted', progress: 100, imageColor: 'bg-[#FFE8B6]' },
    { id: '2', title: 'Export Maschinen USA', date: '28 Sep', status: 'draft', progress: 35, imageColor: 'bg-[#CABDFF]' },
    { id: '3', title: 'Import Textilien Indien', date: '29 Sep', status: 'submitted', progress: 100, imageColor: 'bg-[#D2F7E2]' },
    { id: '4', title: 'Export Autos Schweiz', date: '30 Sep', status: 'draft', progress: 12, imageColor: 'bg-[#FFD88D]' },
    { id: '5', title: 'Veredelung Aluminium', date: '01 Oct', status: 'draft', progress: 85, imageColor: 'bg-[#B1E5FC]' },
    { id: '6', title: 'Import Rohstoffe Brasilien', date: '02 Oct', status: 'submitted', progress: 100, imageColor: 'bg-[#C7ACC1]' },
    { id: '7', title: 'Musterversand Japan', date: '03 Oct', status: 'draft', progress: 5, imageColor: 'bg-[#E3E3E3]' },
];

export function CaseList({ title = "Verfahren" }: { title?: string }) {
    const [activeFilter, setActiveFilter] = useState('Alle');

    return (
        <div className="bg-[#FCFCFC] rounded-lg p-6 w-full shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            {/* Header */}
            <SectionHeader
                title={title}
                action={
                    <div className="flex gap-4 items-center flex-wrap justify-end">
                        <FilterTabs
                            options={['Alle', 'Entwürfe', 'Archiv']}
                            active={activeFilter}
                            onChange={setActiveFilter}
                        />

                        {/* Search Input Placeholder */}
                        <div className="bg-[#F4F4F4] rounded-xl px-4 py-1.5 flex items-center w-full sm:w-[200px] md:w-[260px]">
                            <span className="text-gray-400 mr-2 text-xs">🔍</span>
                            <input type="text" placeholder="Suche..." className="bg-transparent border-none outline-none text-sm w-full font-semibold text-[#1A1D1F] placeholder:text-[#9A9FA5]" />
                        </div>
                    </div>
                }
                className="mb-8"
            />

            {/* List Header */}
            <div className="flex text-[13px] font-semibold text-[#6F767E] mb-4 px-4 uppercase tracking-wider">
                <div className="w-[40%] pl-2">Vorgang</div>
                <div className="w-[40%]">Fortschritt</div>
                <div className="w-[20%] text-right pr-4">Aktionen</div>
            </div>

            <div className="h-[1px] bg-[#EFEFEF] w-full mb-4"></div>

            {/* Rows */}
            <div className="flex flex-col gap-3">
                {MOCK_CASES.map((item) => (
                    <div key={item.id} className="group flex items-center p-3 hover:bg-[#F4F4F4] rounded-xl transition-colors min-h-[80px]">
                        {/* Title & Icon */}
                        <div className="w-[40%] flex items-center gap-5">
                            <div className={`w-20 h-20 rounded-lg ${item.imageColor} flex-shrink-0 flex items-center justify-center shadow-sm`}>
                                <FileText className="text-[#1A1D1F]/40 w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <div>
                                <div className="text-[15px] font-bold text-[#1A1D1F] mb-1 leading-snug">{item.title}</div>
                                <div className="text-[13px] font-semibold text-[#9A9FA5]">{item.date}</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-[40%] pr-12">
                            <ProgressBar
                                value={item.progress}
                                colorClass={item.status === 'submitted' ? 'bg-[#83BF6E]' : 'bg-[#2A85FF]'}
                                heightClass="h-3"
                            />
                            {/* Stats below bar */}
                            {item.status === 'draft' && (
                                <div className="mt-2 flex gap-2">
                                    <span className="h-3 w-8 bg-[#CABDFF] rounded-sm block"></span>
                                    <span className="h-3 w-5 bg-[#FFD88D] rounded-sm block"></span>
                                </div>
                            )}
                        </div>

                        {/* Actions (Hover) */}
                        <div className="w-[20%] flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                            <IconButton icon={Edit2} size={16} title="Bearbeiten" />
                            <IconButton icon={MessageCircle} size={16} title="Nachrichten" />
                            <IconButton icon={MoreHorizontal} size={16} title="Mehr" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Placeholder */}
            <div className="mt-8 pt-4 border-t border-[#EFEFEF] flex justify-center gap-4 items-center">
                <IconButton icon={ArrowLeft} size={20} variant="outline" className="w-10 h-10 border-2" />
                <IconButton icon={ArrowRight} size={20} variant="outline" className="w-10 h-10 border-2" />
            </div>
        </div>
    );
}
