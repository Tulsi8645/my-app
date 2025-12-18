import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getClientIP } from '@/lib/utils';

export async function POST(request) {
    try {
        const { employeeId, latitude, longitude, address, timestamp, type } = await request.json();

        const ipAddress = getClientIP(request);

        await connectDB();

        const nepalDateStr = new Date().toLocaleDateString("en-US", {
            timeZone: "Asia/Kathmandu",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const today = new Date(nepalDateStr);
        today.setHours(0, 0, 0, 0);

        // Lazy Cleanup: Check for previous day's forgotten checkout
        const previousOpenRecord = await Attendance.findOne({
            employeeId,
            date: { $lt: today },
            clockOut: { $exists: false } // Check if clockOut is missing
        }).sort({ date: -1 });

        if (previousOpenRecord) {
            // Found a forgotten checkout
            const recordDate = new Date(previousOpenRecord.date);
            // Create 6 PM (18:00) timestamp for that day in Nepal Time? 
            // We need to set it relative to that day.
            // Assuming the date stored is 00:00 UTC or Local? stored date is usually UTC normalized or just date.
            // Let's assume we construct 6 PM on the record's date.

            // Reconstruct the date in Nepal Time to be safe? 
            // Or just take the JS date object and set hours if we trust the date object is correct day.
            // MongoDB stores as Date.

            const autoClockOutTime = new Date(recordDate);
            // This might set it to 00:00 UTC. 
            // We want 18:00 Nepal Time.
            // Nepal is UTC+5:45. 18:00 Nepal = 12:15 UTC.
            // Let's try to be precise.

            // Convert recordDate to Nepal date string to get YYYY-MM-DD
            const recNepalDateStr = recordDate.toLocaleDateString("en-US", {
                timeZone: "Asia/Kathmandu",
                year: 'numeric',
                month: 'numeric', // numeric is easier to parse? or just use parts
                day: 'numeric'
            });
            // Actually recordDate from DB should be treated as the day. 
            // Let's blindly set time to 6 PM local if we assume the server is... wait server time might differ.
            // Safest is to work with UTC if we know the offset, or use toLocaleString if we trust the runtime TZ data.
            // Let's assume we want 18:00 Nepal Time.

            // 18:00 Nepal Time = 18 - 5.75 = 12.25 UTC = 12:15 UTC.
            // So we add 12h 15m to the start of day (UTC)? 
            // If date is stored as 00:00 UTC (which likely it is if we did setHours(0,0,0,0) previously without timezone info or with UTC), then adding hours works.

            // However, existing code uses:
            // nepalDateStr = new Date().toLocaleDateString("en-US", {timeZone: "Asia/Kathmandu"...})
            // today = new Date(nepalDateStr) -> This uses local server time for parsing "MM/DD/YYYY".
            // If server is UTC, checkIn code sets hours 0,0,0,0.

            // Let's set the time explicitly using a constructed string to be safe across timezones
            const dateParts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kathmandu',
                year: 'numeric', month: '2-digit', day: '2-digit'
            }).formatToParts(recordDate);

            // Parts: month, literal, day, literal, year
            // This is getting complicated.

            // Simpler: Just set hours to 18, mins 0 if we assume the date object is "start of day".
            // If we want roughly 6 PM.
            // Let's do:
            // const closingTime = new Date(recordDate);
            // closingTime.setHours(18, 0, 0, 0); 
            // Wait, if recordDate is 2025-12-17T00:00:00.000Z. setHours(18) makes it 18:00 UTC.
            // 18:00 UTC is 23:45 Nepal. That is almost midnight. Close enough?
            // User requested 6 PM. 
            // 6 PM Nepal is 12:15 UTC.
            // So if base is 00:00 UTC, we want 12:15.

            const closingTime = new Date(recordDate);
            closingTime.setUTCHours(12, 15, 0, 0); // 12:15 UTC = 18:00 Nepal

            previousOpenRecord.clockOut = closingTime;

            // Also close the last session
            const lastSession = previousOpenRecord.sessions[previousOpenRecord.sessions.length - 1];
            if (lastSession && !lastSession.checkOut) {
                lastSession.checkOut = closingTime;
                // Location? Maybe mark as "Auto-Checkout"?
                // db schema has location object. leave empty or defaults.
            }

            await previousOpenRecord.save();
        }

        // Find today's attendance record
        let attendance = await Attendance.findOne({
            employeeId,
            date: today
        });

        if (type === 'checkin') {
            const lastSession = attendance?.sessions?.[attendance.sessions.length - 1];

            if (lastSession && !lastSession.checkOut) {
                return NextResponse.json(
                    { error: 'Already checked in' },
                    { status: 400 }
                );
            }

            // Always mark as present regardless of time
            // Status will be calculated based on onTime logic below

            const newSession = {
                checkIn: new Date(timestamp),
                checkInLocation: { latitude, longitude, address },
                checkInIP: ipAddress,
            };

            if (attendance) {
                // Determine if we need to update the main status/clockIn
                // If it's the first session ever (unlikely if attendance exists but possible if empty sessions), set clockIn
                if (attendance.sessions.length === 0 && !attendance.clockIn) {
                    attendance.clockIn = new Date(timestamp);
                    attendance.isAvailable = true;
                    // Calculate onTime
                    const checkInTime = new Date(timestamp);
                    const nepalTime = new Date(checkInTime.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
                    // Create 9:30 AM cutoff for today (Nepal time)
                    const limit = new Date(nepalTime);
                    limit.setHours(9, 30, 0, 0);

                    attendance.onTime = nepalTime <= limit;
                    attendance.status = attendance.onTime ? 'present' : 'late';

                } else if (!attendance.clockIn) {
                    // Migration fallback
                    attendance.clockIn = new Date(timestamp);
                    attendance.isAvailable = true;
                    // Calculate onTime
                    const checkInTime = new Date(timestamp);
                    const nepalTime = new Date(checkInTime.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
                    // Create 9:30 AM cutoff for today (Nepal time)
                    const limit = new Date(nepalTime);
                    limit.setHours(9, 30, 0, 0);

                    attendance.onTime = nepalTime <= limit;
                    attendance.status = attendance.onTime ? 'present' : 'late';
                }

                attendance.sessions.push(newSession);
                await attendance.save();

            } else {
                // Calculate onTime
                const checkInTime = new Date(timestamp);
                const nepalTime = new Date(checkInTime.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
                // Create 9:30 AM cutoff for today (Nepal time)
                const limit = new Date(nepalTime);
                limit.setHours(9, 30, 0, 0);

                const onTime = nepalTime <= limit;

                // New daily record
                attendance = await Attendance.create({
                    employeeId,
                    date: today,
                    clockIn: new Date(timestamp),
                    status: onTime ? 'present' : 'late',
                    isAvailable: true,
                    onTime: onTime,
                    sessions: [newSession],
                    // removed root checkInLocation
                });
            }

        } else {
            // Check-out logic
            const lastSession = attendance?.sessions?.[attendance.sessions.length - 1];

            if (!attendance || !lastSession || lastSession.checkOut) {
                return NextResponse.json(
                    { error: 'Must clock in first' },
                    { status: 400 }
                );
            }

            // Update the last session
            lastSession.checkOut = new Date(timestamp);
            lastSession.checkOutLocation = { latitude, longitude, address };
            lastSession.checkOutIP = ipAddress;

            // Also update root clockOut
            attendance.clockOut = new Date(timestamp);

            await attendance.save();
        }

        return NextResponse.json({
            success: true,
            message: `${type === 'checkin' ? 'Clock In' : 'Clock Out'} successful`
        });

    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}