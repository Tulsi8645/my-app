"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface AttendanceTimelineProps {
    series: { name: string; data: { x: string; y: number[]; fillColor?: string }[] }[];
    selectedDate?: string;
}

const AttendanceTimeline: React.FC<AttendanceTimelineProps> = ({ series, selectedDate }) => {
    const router = useRouter();

    // Default to today if no date selected
    const dateValue = selectedDate || new Date().toISOString().split('T')[0];

    // 8 AM to 8 PM view
    const minTime = new Date(dateValue).setHours(8, 0, 0, 0);
    const maxTime = new Date(dateValue).setHours(20, 0, 0, 0);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        router.push(`?date=${newDate}`);
    };

    const options: ApexOptions = {
        chart: {
            height: 350,
            type: 'rangeBar',
            fontFamily: "Satoshi, sans-serif",
            toolbar: {
                show: true,
                tools: {
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            zoom: {
                enabled: true
            },
            background: 'transparent'
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '50%',
                rangeBarGroupRows: true
            }
        },
        colors: ["#30c95eff"],
        fill: {
            type: 'solid'
        },
        xaxis: {
            type: 'datetime',
            min: minTime,
            max: maxTime,
            labels: {
                datetimeUTC: false, // Force local time
                style: {
                    colors: '#94a3b8' // Slate-400
                },
                datetimeFormatter: {
                    year: 'yyyy',
                    month: 'MMM \'yy',
                    day: 'dd MMM',
                    hour: 'hh:mm tt' // 12-hour format for readability
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#94a3b8' // Slate-400
                }
            }
        },
        grid: {
            borderColor: '#334155'
        },
        legend: {
            show: true,
            position: 'top',
            labels: {
                colors: '#94a3b8'
            }
        },
        tooltip: {
            theme: 'dark',
            x: {
                format: 'hh:mm tt' // 12-hour format in tooltip
            }
        }
    };

    return (
        <div className="col-span-12 rounded-[10px] border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-gray-dark sm:px-7.5 xl:col-span-12">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h4 className="text-xl font-semibold text-black dark:text-white">
                        Activity for {dateValue}
                    </h4>
                </div>
                <div>
                    <input
                        type="date"
                        value={dateValue}
                        onChange={handleDateChange}
                        className="rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
                    />
                </div>
            </div>
            <div>
                <div id="attendanceTimeline" className="-ml-5">
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="rangeBar"
                        height={350}
                    />
                </div>
            </div>
        </div>
    );
};

export default AttendanceTimeline;
