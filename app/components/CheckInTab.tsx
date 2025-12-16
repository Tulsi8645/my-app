import React from 'react';
import { Clock, MapPin, LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { Employee, Location, Result } from '../types';

interface CheckInTabProps {
    employee: Employee | null;
    currentTime: Date;
    location: Location | null;
    loading: boolean;
    result: Result | null;
    handleCheckIn: (type: 'checkin' | 'checkout') => void;
    isCheckedIn: boolean;
}

const CheckInTab: React.FC<CheckInTabProps> = ({
    employee,
    currentTime,
    location,
    loading,
    result,
    handleCheckIn,
    isCheckedIn
}) => {
    return (
        <div className="p-6 space-y-8">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-blue-300 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Good Day,</h2>
                        <p className="text-blue-100 text-lg font-medium mt-1">{employee?.name.split(' ')[0]}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="text-5xl font-bold tracking-tighter">
                        {currentTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }).split(' ')[0]}
                        <span className="text-xl font-medium text-blue-200 ml-2">
                            {currentTime.toLocaleTimeString('en-US', { hour12: true }).split(' ')[1]}
                        </span>
                    </div>
                    <div className="text-blue-100 font-medium mt-2 flex items-center space-x-2">
                        <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                        <span>{currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative">

                {/* Status Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm border border-white ring-1 ${isCheckedIn
                        ? 'bg-green-100 text-green-700 ring-green-100'
                        : 'bg-gray-100 text-gray-600 ring-gray-200'
                        } flex items-center space-x-2`}>
                        <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        <span>{isCheckedIn ? 'Clocked In' : 'Clocked Out'}</span>
                    </span>
                </div>

                <div className="pt-6 space-y-6">
                    {/* Location Info */}
                    <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm">Target Location</h3>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                {location?.address || 'Locating...'}
                            </p>
                        </div>
                        {location ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div>
                        {!isCheckedIn ? (
                            <button
                                onClick={() => handleCheckIn('checkin')}
                                disabled={loading}
                                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-px shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                            >
                                <div className="relative flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 rounded-2xl">
                                    <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                                        <LogIn className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="font-bold text-white text-lg">Clock In</span>
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={() => handleCheckIn('checkout')}
                                disabled={loading}
                                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 p-px shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                            >
                                <div className="relative flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 rounded-2xl">
                                    <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                                        <LogOut className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="font-bold text-white text-lg">Clock Out</span>
                                </div>
                            </button>
                        )}
                        <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                            {loading ? 'Processing request...' : 'Tap to record attendance'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Result Feedback */}
            {result && (
                <div className={`transform transition-all duration-300 ease-in-out ${result.success
                    ? 'bg-green-50 border-green-100 text-green-800'
                    : 'bg-red-50 border-red-100 text-red-800'
                    } rounded-2xl p-4 shadow-sm border flex items-center space-x-3`}>
                    {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium text-sm">{result.message}</span>
                </div>
            )}
        </div>
    );
};

export default CheckInTab;
