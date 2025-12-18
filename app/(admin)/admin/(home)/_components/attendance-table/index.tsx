"use client";

import { cn } from "@/lib/utils";
import {
    Clock,
    MapPin,
    ChevronDown,
    User as UserIcon,
    History,
    Activity,
    Navigation,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from "lucide-react";
import { useState } from "react";

type Session = {
    checkIn: string | Date;
    checkInLocation?: { address: string };
    checkOut?: string | Date;
    checkOutLocation?: { address: string };
};

type AttendanceLog = {
    id: string;
    employeeName: string;
    department: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: string;
    location: string;
    onTime?: boolean;
    sessionsCount: number;
    sessions: Session[];
};

export function AttendanceTable({ logs }: { logs: AttendanceLog[] }) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTime = (dateStr: string | Date | undefined) => {
        if (!dateStr || dateStr === '-') return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr as string;
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr as string;
        }
    };

    const toggleDropdown = (id: string) => {
        setOpenDropdown(openDropdown === id ? null : id);
    };

    return (
        <div className="w-full rounded-2xl bg-white shadow-xl dark:bg-gray-dark border border-stroke dark:border-strokedark overflow-visible bg-opacity-100 mb-10">
            {/* Table Header Section */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stroke dark:border-strokedark bg-gray-600 dark:bg-meta-4/20 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white text-primary">
                        <Activity size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-dark dark:text-white leading-none mb-1">Live Monitoring</h3>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left">
                            <th className="px-6 py-4 font-black text-[11px] text-white uppercase tracking-[0.1em] bg-gray-50/30 dark:bg-meta-4/5 pt-6 pb-4">Employee</th>
                            <th className="px-4 py-4 font-black text-[11px] text-white uppercase tracking-[0.1em] bg-gray-50/30 dark:bg-meta-4/5 pt-6 pb-4 text-center">Sessions</th>
                            <th className="px-4 py-4 font-black text-[11px] text-white uppercase tracking-[0.1em] bg-gray-50/30 dark:bg-meta-4/5 pt-6 pb-4 text-center">Check-In</th>
                            <th className="px-4 py-4 font-black text-[11px] text-white uppercase tracking-[0.1em] bg-gray-50/30 dark:bg-meta-4/5 pt-6 pb-4 text-center">Check-Out</th>
                            <th className="px-8 py-4 font-black text-[11px] text-white uppercase tracking-[0.1em] bg-gray-50/30 dark:bg-meta-4/5 pt-6 pb-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke dark:divide-strokedark">
                        {logs.map((log, logIdx) => (
                            <tr key={log.id} className="group transition-colors duration-200">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-11 w-11 shrink-0">
                                            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-primary to-indigo-600 text-white font-black dark:ring-boxdark">
                                                {getInitials(log.employeeName)}
                                            </div>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white dark:border-boxdark shadow-sm transition-colors",
                                                log.status === 'absent' ? "bg-gray-400" : "bg-green-500"
                                            )} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="font-black text-[13px] text-dark dark:text-white truncate group-hover:text-primary transition-colors">{log.employeeName}</p>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                                <Navigation size={8} className={cn("shrink-0", log.location === 'Unknown' ? "text-gray-300" : "text-primary/60")} />
                                                <span className={cn("truncate max-w-[150px]", log.location === 'Unknown' && "italic opacity-60 text-[9px]")} title={log.location}>
                                                    {log.location === 'Unknown' ? 'Location tracking disabled' : log.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-5 text-center">
                                    <div className="relative inline-block">
                                        <button
                                            onClick={() => toggleDropdown(log.id)}
                                            className={cn(
                                                "group/btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black transition-all border shadow-sm",
                                                openDropdown === log.id
                                                    ? "bg-primary text-white border-primary shadow-lg scale-105"
                                                    : "bg-gray-600 dark:bg-meta-4 text-white border-stroke dark:border-strokedark hover:border-primary/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full transition-colors",
                                                openDropdown === log.id ? "bg-white animate-pulse" : "bg-primary"
                                            )} />
                                            <span>{log.sessionsCount}</span>
                                            <ChevronDown size={12} className={cn("transition-transform duration-300", openDropdown === log.id && "rotate-180")} />
                                        </button>

                                        {/* Dropdown Menu - Smart Flipping */}
                                        {openDropdown === log.id && (
                                            <div className={cn(
                                                "absolute left-1/2 -translate-x-1/2 w-[300px] z-[99999] animate-in fade-in zoom-in-95 duration-200",
                                                logIdx >= logs.length - 2 ? "bottom-full mb-4" : "top-full mt-4"
                                            )}>
                                                <div className="bg-[#0F172A] dark:bg-boxdark rounded-[24px] shadow-[0_25px_70px_rgba(0,0,0,0.6)] border border-white/10 dark:border-strokedark overflow-hidden">
                                                    <div className="bg-gray-400 dark:bg-gray-600 px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Detailed Timeline</span>
                                                            <span className="text-[11px] font-bold text-white">{log.sessionsCount} Activity Points</span>
                                                        </div>
                                                        <Activity size={16} className="text-primary/70" />
                                                    </div>

                                                    <div className="max-h-[380px] overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gradient-to-b from-[#111827] to-[#0F172A]">
                                                        {log.sessions?.map((session, sidx) => (
                                                            <div key={sidx} className="relative pl-7 border-l-2 border-primary/20 group/item">
                                                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-[#0F172A] border-2 border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                </div>

                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[10px] font-black text-primary uppercase">Session #{log.sessions.length - sidx}</span>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-px rounded-2xl overflow-hidden shadow-sm border border-white/5">
                                                                        <div className="bg-white/5 p-3 flex flex-col">
                                                                            <span className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-1">Check In</span>
                                                                            <span className="text-xs font-black text-white">{formatTime(session.checkIn)}</span>
                                                                        </div>
                                                                        <div className="bg-white/[0.02] p-3 flex flex-col border-l border-white/5">
                                                                            <span className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Check Out</span>
                                                                            <span className="text-xs font-black text-white">{formatTime(session.checkOut)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/5 group/loc">
                                                                        <MapPin size={12} className="text-primary shrink-0 group-hover/loc:scale-125 transition-transform" />
                                                                        <span className="text-[10px] text-white/40 truncate font-medium" title={session.checkInLocation?.address}>
                                                                            {session.checkInLocation?.address || 'Verified Terminal'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Arrow pointing to trigger */}
                                                <div className={cn(
                                                    "absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0F172A] dark:bg-boxdark border-white/10 rotate-45 z-[-1]",
                                                    logIdx >= logs.length - 2 ? "-bottom-2 border-r border-b" : "-top-2 border-l border-t"
                                                )} />
                                            </div>
                                        )}
                                    </div>
                                </td>


                                <td className="px-4 py-5 font-black text-[13px] text-center text-dark dark:text-white">
                                    <div className="flex flex-col items-center">
                                        <span className="text-green-500 inline-flex items-center gap-1">
                                            <ArrowUpRight size={14} strokeWidth={3} className="opacity-50" />
                                            {log.checkIn}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-4 py-5 font-black text-[13px] text-center text-dark dark:text-white">
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <span className={cn(
                                            "inline-flex items-center gap-1",
                                            log.checkOut === 'Active' ? "text-blue-500 italic animate-pulse" : "text-red-500/80"
                                        )}>
                                            <ArrowDownRight size={14} strokeWidth={3} className="opacity-50" />
                                            {log.checkOut}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={cn(
                                            "inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider w-fit shadow-sm",
                                            (log.status === 'present' || log.status === 'late')
                                                ? "bg-green-600 text-white dark:bg-green-600 ring-2 ring-green-600/20"
                                                : "bg-red-600 text-white dark:bg-red-600 ring-2 ring-red-600/20"
                                        )}>
                                            {log.status === 'late' || log.status === 'present' ? 'PRESENT' : log.status}
                                        </span>
                                        {log.onTime !== undefined && log.status !== 'absent' && (
                                            <div className={cn(
                                                "text-[9px] font-bold flex items-center gap-1",
                                                log.onTime ? "text-blue-500" : "text-orange-400"
                                            )}>
                                                <div className={cn("h-1 w-1 rounded-full", log.onTime ? "bg-blue-500" : "bg-orange-500")} />
                                                {log.onTime ? "ON TIME" : "LATE ENTRY"}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {logs.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-meta-4/5">
                        <History size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <h4 className="text-sm font-bold text-gray-500 mb-1 tracking-widest uppercase">No Activity Recorded</h4>
                        <p className="text-xs text-gray-400">Live logs will appear here as employees check in.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
