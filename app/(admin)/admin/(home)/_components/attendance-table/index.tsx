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
    return (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="px-4 py-6 md:px-6 xl:px-9">
                <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
                    Recent Attendance Logs
                </h4>
            </div>

            <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-dark-3 sm:grid-cols-8 md:px-6 2xl:px-7.5">
                <div className="col-span-2 flex items-center">
                    <p className="font-medium">Employee Name</p>
                </div>
                <div className="col-span-2 hidden items-center sm:flex">
                    <p className="font-medium">Department</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="font-medium">Date</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="font-medium">Check In</p>
                </div>
                <div className="col-span-1 hidden items-center sm:flex">
                    <p className="font-medium">Check Out</p>
                </div>
                <div className="col-span-1 flex items-center">
                    <p className="font-medium">Status</p>
                </div>
            </div>

            {logs.map((log, key) => (
                <div
                    className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-dark-3 sm:grid-cols-8 md:px-6 2xl:px-7.5"
                    key={key}
                >
                    <div className="col-span-2 flex items-center">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <p className="text-sm text-dark dark:text-white">
                                {log.employeeName}
                            </p>
                        </div>
                    </div>
                    <div className="col-span-2 hidden items-center sm:flex">
                        <p className="text-sm text-dark dark:text-white">
                            {log.department || '-'}
                        </p>
                    </div>
                    <div className="col-span-1 flex items-center">
                        <p className="text-sm text-dark dark:text-white">
                            {log.date}
                        </p>
                    </div>
                    <div className="col-span-1 flex items-center">
                        <p className="text-sm text-green-500">
                            {log.checkIn}
                        </p>
                    </div>
                    <div className="col-span-1 hidden items-center sm:flex">
                        <p className="text-sm text-red-500">
                            {log.checkOut}
                        </p>
                    </div>
                    <div className="col-span-1 flex items-center">
                        <span
                            className={cn(
                                "inline-flex rounded-full px-3.5 py-1 text-sm font-medium",
                                log.status === "present"
                                    ? "bg-[#219653]/10 text-[#219653]"
                                    : log.status === "late"
                                        ? "bg-[#FFA70B]/10 text-[#FFA70B]"
                                        : "bg-[#D34053]/10 text-[#D34053]"
                            )}
                        >
                            {log.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
