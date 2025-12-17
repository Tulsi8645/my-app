"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function TimeWidget({ name = "Sujeet" }: { name?: string }) {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null; // Prevent hydration mismatch

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
        });
    };

    const getTimeParts = (date: Date) => {
        const timeStr = formatTime(date);
        const [timeVal, period] = timeStr.split(" ");
        return { timeVal, period };
    };

    const { timeVal, period } = getTimeParts(time);

    return (
        <div className="col-span-2 rounded-sm border border-stroke bg-gradient-to-r from-blue-500 to-indigo-600 p-6 shadow-default dark:border-strokedark">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-2xl font-bold text-white">
                        Good Day,
                    </h4>
                    <p className="text-lg font-medium text-white/90">
                        {name}
                    </p>
                </div>
                <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                    <Clock className="text-white" size={32} />
                </div>
            </div>

            <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold text-white sm:text-5xl">
                        {timeVal}
                    </h3>
                    <span className="text-xl font-medium text-white/80">
                        {period}
                    </span>
                </div>
                <p className="mt-2 text-lg text-white/90">
                    {formatDate(time)}
                </p>
            </div>
        </div>
    );
}
