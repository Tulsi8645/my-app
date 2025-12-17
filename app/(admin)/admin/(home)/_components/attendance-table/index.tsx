"use client";

import { cn } from "@/lib/utils";

type AttendanceLog = {
    id: string;
    employeeName: string;
    department: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: string;
    location: string;
};

export function AttendanceTable({ logs }: { logs: AttendanceLog[] }) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRandomColor = (name: string) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="flex items-center justify-between px-4 py-6 md:px-6 xl:px-9">
                <h4 className="text-xl font-bold text-dark dark:text-white">
                    Attendance Logs
                </h4>
            </div>

            <div className="w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                                Employee
                            </th>
                            <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                                Department
                            </th>
                            <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                                Date
                            </th>
                            <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                                Check In
                            </th>
                            <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                                Check Out
                            </th>
                            <th className="px-4 py-4 font-medium text-black dark:text-white">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, key) => (
                            <tr key={key} className="border-b border-[#eee] last:border-b-0 dark:border-strokedark hover:bg-gray-1 dark:hover:bg-boxdark/50 transition-colors">
                                <td className="px-4 py-5 pl-9 xl:pl-11">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white font-medium", getRandomColor(log.employeeName))}>
                                            {getInitials(log.employeeName)}
                                        </div>
                                        <p className="font-medium text-black dark:text-white">
                                            {log.employeeName}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-5">
                                    <p className="text-black dark:text-white">
                                        {log.department || 'General'}
                                    </p>
                                </td>
                                <td className="px-4 py-5">
                                    <p className="text-black dark:text-white">
                                        {log.date}
                                    </p>
                                </td>
                                <td className="px-4 py-5">
                                    <p className="font-medium text-green-600 dark:text-green-400">
                                        {log.checkIn}
                                    </p>
                                </td>
                                <td className="px-4 py-5">
                                    <p className="font-medium text-red-600 dark:text-red-400">
                                        {log.checkOut}
                                    </p>
                                </td>
                                <td className="px-4 py-5">
                                    <span
                                        className={cn(
                                            "inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium capitalize",
                                            log.status === "present"
                                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                                : log.status === "late"
                                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                        )}
                                    >
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
