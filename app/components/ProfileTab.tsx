import React from 'react';
import { LogOut } from 'lucide-react';
import { User, Stats } from '../types';

interface ProfileTabProps {
    user: User | null;
    stats: Stats | null;
    handleLogout: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, stats, handleLogout }) => {
    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center pt-4">
                <div className="relative">
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-300 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white ring-1 ring-gray-100">
                        {user?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-4">{user?.name}</h2>
                <div className="flex items-center mt-1">
                    {user?.role && (
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                            {user.role}
                        </span>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{stats.present || 0}</div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days Present</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                        <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.late || 0}</div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days Late</div>
                    </div>
                </div>
            )}

            {/* Detailed Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Personal Details</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between group">
                        <span className="text-sm text-gray-500">Employee ID</span>
                        <span className="text-sm font-medium text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                            {user?.employeeId}
                        </span>
                    </div>
                    <div className="flex items-center justify-between group">
                        <span className="text-sm text-gray-500">Email Address</span>
                        <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between group">
                        <span className="text-sm text-gray-500">Department</span>
                        <span className="text-sm font-medium text-gray-900">{user?.department}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
