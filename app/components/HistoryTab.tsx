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
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <Calendar className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No records found</h3>
                    <p className="text-gray-500 mt-1 max-w-xs mx-auto">You haven't marked any attendance yet. Start by clocking in!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((record, index) => (
                        <div key={index} className={`relative bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md overflow-hidden group ${record.status === 'present' ? 'border-green-100 hover:border-green-200' :
                            record.status === 'late' ? 'border-yellow-100 hover:border-yellow-200' :
                                'border-red-100 hover:border-red-200'
                            }`}>
                            {/* Decorative Background Gradient */}
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16 blur-xl ${record.status === 'present' ? 'bg-green-500' :
                                record.status === 'late' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                }`}></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-3 rounded-xl border ${record.status === 'present' ? 'bg-green-50 border-green-100 text-green-700' :
                                            record.status === 'late' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                                                'bg-red-50 border-red-100 text-red-700'
                                            }`}>
                                            <div className="text-xs font-bold uppercase tracking-wider text-center leading-none">
                                                {new Date(record.date).toLocaleDateString(undefined, { month: 'short' })}
                                            </div>
                                            <div className="text-xl font-black text-center leading-none mt-1">
                                                {new Date(record.date).getDate()}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">
                                                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mt-1 ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Icon/Visual */}
                                    <div className={`w-2 h-12 rounded-full ${record.status === 'present' ? 'bg-green-500' :
                                        record.status === 'late' ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-center">
                                        <span className="text-xs font-medium text-gray-500 uppercase">Clock In</span>
                                        <div className="font-bold text-gray-900 text-xl mt-0.5">
                                            {formatTime(record.clockIn)}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-center text-right">
                                        <span className="text-xs font-medium text-gray-500 uppercase">Clock Out</span>
                                        <div className="font-bold text-gray-900 text-xl mt-0.5">
                                            {formatTime(record.clockOut)}
                                        </div>
                                    </div>
                                </div>

                                {record.sessions && record.sessions.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                        <div className="space-y-2">
                                            {record.sessions.map((session, sIdx) => (
                                                <div key={sIdx} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg border border-gray-50 shadow-sm">
                                                    <span className="font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-xs">{formatTime(session.checkIn)}</span>
                                                    <span className="text-gray-300 mx-1">➜</span>
                                                    <span className="font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-xs">
                                                        {session.checkOut ? formatTime(session.checkOut) : <span className="text-green-600 font-bold animate-pulse">Active</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryTab;
