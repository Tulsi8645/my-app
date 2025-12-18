"use client";

import { useEffect, useState } from "react";

export function HeaderClock() {
    const [time, setTime] = useState<string>("");
    const [date, setDate] = useState<string>("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
            );
            setDate(
                now.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })
            );
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!time) return null;

    return (
        <div className="flex flex-col items-start ml-4 border-l border-stroke dark:border-stroke-dark pl-4 max-[500px]:hidden">
            <div className="text-lg font-bold text-dark dark:text-white leading-none">
                {time}
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                {date}
            </div>
        </div>
    );
}
