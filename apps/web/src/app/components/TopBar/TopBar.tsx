import React from 'react';
import { ICON_MAP } from '../Sidebar/icon-map';

export function TopBar() {
    const SearchIcon = ICON_MAP['search'];
    const PlusIcon = ICON_MAP['plus'];
    const MessageIcon = ICON_MAP['message'];
    const BellIcon = ICON_MAP['bell'];
    const UserIcon = ICON_MAP['users']; // Fallback Avatar

    return (
        <header className="w-full h-[96px] bg-[#FCFCFC] border-b border-[#F4F4F4] px-10 py-6 flex items-center justify-between flex-shrink-0 z-10 sticky top-0">

            {/* Search Box */}
            <div className="w-[360px] h-12 bg-[#F4F4F4] rounded-xl flex items-center justify-between px-2 gap-2.5">
                <div className="flex items-center gap-3 px-2 flex-grow">
                    <div className="text-[#6F767E]">
                        <SearchIcon size={24} strokeWidth={1.5} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search or type a command"
                        className="bg-transparent border-none outline-none text-[15px] font-semibold text-[#1A1D1F] placeholder:text-[#9A9FA5] w-full h-6 p-0 focus:ring-0"
                    />
                </div>
                {/* Shortcut Command: ⌘ F */}
                <div className="h-8 px-3 bg-white rounded-lg shadow-[inset_0px_-1px_2px_rgba(0,0,0,0.05),inset_0px_-1px_1px_rgba(0,0,0,0.04),inset_0px_2px_0px_rgba(255,255,255,0.25)] flex items-center justify-center cursor-default select-none">
                    <span className="text-[16px] font-semibold text-[#1A1D1F]">⌘ F</span>
                </div>
            </div>

            {/* Right Block */}
            <div className="flex items-center gap-6">
                {/* Create Button */}
                <button className="h-12 px-5 bg-[#2A85FF] rounded-xl flex items-center gap-2 hover:bg-[#2A85FF]/90 transition-colors active:scale-95 duration-200">
                    <PlusIcon size={24} color="#FCFCFC" strokeWidth={2.5} />
                    <span className="text-[15px] font-bold text-[#FCFCFC] -tracking-[0.01em]">Hinzufügen</span>
                </button>

                {/* Action Icons Group */}
                <div className="flex items-center gap-6">
                    {/* Message */}
                    <button className="relative w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#F4F4F4] transition-colors">
                        <div className="text-[#6F767E]">
                            <MessageIcon size={24} strokeWidth={1.5} />
                        </div>
                        {/* Badge */}
                        <div className="absolute right-3 top-3 w-3 h-3 bg-[#FF6A55] border-2 border-[#FCFCFC] rounded-full" />
                    </button>

                    {/* Notification */}
                    <button className="relative w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#F4F4F4] transition-colors">
                        <div className="text-[#6F767E]">
                            <BellIcon size={24} strokeWidth={1.5} />
                        </div>
                        {/* Badge */}
                        <div className="absolute right-3 top-3 w-3 h-3 bg-[#FF6A55] border-2 border-[#FCFCFC] rounded-full" />
                    </button>
                </div>

                {/* User Avatar */}
                <button className="w-12 h-12 rounded-full overflow-hidden bg-[#FFBC99] relative hover:opacity-90 transition-opacity">
                    {/* Image fallback pattern or img tag */}
                    <div className="w-full h-full flex items-center justify-center text-[#1A1D1F]/50">
                        <UserIcon size={24} />
                    </div>
                </button>
            </div>

        </header>
    );
}
