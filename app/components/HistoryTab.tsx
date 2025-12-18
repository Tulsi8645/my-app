import React from 'react';
import { Calendar } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface HistoryTabProps {
    history: AttendanceRecord[];
    loading: boolean;
}

const formatTime = (isoString: string | undefined | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const HistoryTab: React.FC<HistoryTabProps> = ({ history, loading }) => {
    // Group history by date to merge duplicate documents
    const groupedHistory = React.useMemo(() => {
        const groups: { [key: string]: AttendanceRecord } = {};

        history.forEach(record => {
            const dateKey = new Date(record.date).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = { ...record, sessions: [...(record.sessions || [])] };
            } else {
                // Merge sessions
                groups[dateKey].sessions = [
                    ...(groups[dateKey].sessions || []),
                    ...(record.sessions || [])
                ];
                // Update clock times to cover the full merged range
                const currentStart = groups[dateKey].clockIn ? new Date(groups[dateKey].clockIn!).getTime() : Infinity;
                const newStart = record.clockIn ? new Date(record.clockIn).getTime() : Infinity;
                if (newStart < currentStart) groups[dateKey].clockIn = record.clockIn;

                const currentEnd = groups[dateKey].clockOut ? new Date(groups[dateKey].clockOut!).getTime() : 0;
                const newEnd = record.clockOut ? new Date(record.clockOut).getTime() : 0;
                if (newEnd > currentEnd) groups[dateKey].clockOut = record.clockOut;

                // If merged record has a later status (e.g. present vs active), take the more final one? 
                // Creating a simplified status logic: if any is present/late, take that.
                if (record.status !== 'absent' && groups[dateKey].status === 'absent') {
                    groups[dateKey].status = record.status;
                }
            }
            // Sort sessions chronologically (Earliest first) so the latest 'Active' session is at the bottom
            groups[dateKey].sessions?.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
        });

        // Convert back to array, filter for isAvailable, and sort desc
        return Object.values(groups)
            .filter(record => record.isAvailable)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [history]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
                    <p className="text-sm text-gray-500 mt-1">Your recent activity timeline</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-600" />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Loading history...</p>
                </div>
            ) : groupedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <Calendar className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No records found</h3>
                    <p className="text-gray-500 mt-1 max-w-xs mx-auto">You haven't marked any attendance yet. Start by clocking in!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedHistory.map((record, index) => {
                        let bgClass = 'bg-white';
                        let borderClass = 'border-gray-100';
                        let textClass = 'text-gray-900';
                        let subTextClass = 'text-gray-500';
                        let iconBgClass = 'bg-gray-100';
                        let dateBoxClass = 'bg-white/50 text-gray-900';

                        if (record.status === 'absent') {
                            bgClass = 'bg-gradient-to-br from-red-50 to-red-100';
                            borderClass = 'border-red-200';
                            textClass = 'text-red-900';
                            subTextClass = 'text-red-700';
                            iconBgClass = 'bg-red-200/50';
                            dateBoxClass = 'bg-white/60 text-red-900 shadow-sm';
                        } else if (record.onTime === false || record.status === 'late') {
                            bgClass = 'bg-gradient-to-br from-orange-50 to-amber-100';
                            borderClass = 'border-orange-200';
                            textClass = 'text-orange-900';
                            subTextClass = 'text-orange-800';
                            iconBgClass = 'bg-orange-200/50';
                            dateBoxClass = 'bg-white/60 text-orange-900 shadow-sm';
                        } else {
                            // Present / On Time
                            bgClass = 'bg-gradient-to-br from-emerald-50 to-green-100';
                            borderClass = 'border-emerald-200';
                            textClass = 'text-emerald-900';
                            subTextClass = 'text-emerald-700';
                            iconBgClass = 'bg-emerald-200/50';
                            dateBoxClass = 'bg-white/60 text-emerald-900 shadow-sm';
                        }

                        return (
                            <div key={index} className={`relative rounded-3xl p-6 shadow-sm border transition-all hover:shadow-md group ${bgClass} ${borderClass}`}>

                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        {/* Date Box */}
                                        <div className={`p-3 rounded-2xl flex flex-col items-center justify-center min-w-[3.5rem] backdrop-blur-sm ${dateBoxClass}`}>
                                            <div className="text-xs font-bold uppercase tracking-wider leading-none opacity-80">
                                                {new Date(record.date).toLocaleDateString(undefined, { month: 'short' })}
                                            </div>
                                            <div className="text-2xl font-black leading-tight">
                                                {new Date(record.date).getDate()}
                                            </div>
                                        </div>

                                        <div>
                                            <div className={`font-bold text-lg ${textClass}`}>
                                                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                {record.onTime !== undefined ? (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-white/60 backdrop-blur-sm shadow-sm ${record.onTime ? 'text-emerald-700' : 'text-orange-700'}`}>
                                                        {record.onTime ? 'On Time' : 'Late'}
                                                    </span>
                                                ) : record.status !== 'present' && (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-white/60 backdrop-blur-sm shadow-sm ${textClass}`}>
                                                        {record.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/20 flex flex-col justify-center`}>
                                        <span className={`text-xs font-bold uppercase tracking-wide opacity-70 mb-1 ${subTextClass}`}>Clock In</span>
                                        <div className={`font-black text-xl ${textClass}`}>
                                            {formatTime(record.clockIn)}
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/20 flex flex-col justify-center text-right`}>
                                        <span className={`text-xs font-bold uppercase tracking-wide opacity-70 mb-1 ${subTextClass}`}>Clock Out</span>
                                        <div className={`font-black text-xl ${textClass}`}>
                                            {formatTime(record.clockOut)}
                                        </div>
                                    </div>
                                </div>

                                {record.sessions && record.sessions.length > 0 && (
                                    <div className="mt-5 pt-4 border-t border-black/5">
                                        <div className="space-y-2">
                                            {record.sessions.map((session, sIdx) => (
                                                <div key={sIdx} className="flex items-center justify-between text-sm p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 hover:bg-white/60 transition-colors">
                                                    <span className={`font-bold ${textClass} opacity-90`}>{formatTime(session.checkIn)}</span>
                                                    <span className={`${subTextClass} opacity-50`}>➜</span>
                                                    <span className={`font-bold ${textClass} opacity-90`}>
                                                        {session.checkOut ? formatTime(session.checkOut) : <span className="text-emerald-600 font-extrabold animate-pulse">Active</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HistoryTab;
