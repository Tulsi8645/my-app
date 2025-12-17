"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import React from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface AttendanceTimelineProps {
    series: { name: string; data: { x: string; y: number[]; fillColor?: string }[] }[];
}

const AttendanceTimeline: React.FC<AttendanceTimelineProps> = ({ series }) => {
    // Calculate min/max for today's view (09:00 to 18:00 or dynamic based on data)
    // If empty, default to 9-6

    const options: ApexOptions = {
        chart: {
            height: 350,
            type: 'rangeBar',
            fontFamily: "Satoshi, sans-serif",
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
            labels: {
                datetimeFormatter: {
                    year: 'yyyy',
                    month: 'MMM \'yy',
                    day: 'dd MMM',
                    hour: 'HH:mm'
                }
            }
        },
        tooltip: {
            x: {
                format: 'HH:mm'
            }
        },
        legend: {
            show: true,
            position: 'top'
        },
        title: {
            text: "Today's Activity",
            style: {
                fontSize: '16px',
                fontWeight: 600
            }
        }
    };

    return (
        <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
            <div className="mb-4 justify-between gap-4 sm:flex">
                <div>
                    <h4 className="text-xl font-semibold text-black dark:text-white">
                        Daily Attendance Timeline
                    </h4>
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
