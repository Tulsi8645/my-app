import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import { getClientIP } from '@/lib/utils';
import { performAutoCheckout } from '@/lib/attendance-service';

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
        const [m, d, y] = nepalDateStr.split('/');
        const utcBase = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d));
        const today = new Date(utcBase - (5.75 * 60 * 60 * 1000));

        // Auto-checkout for previous days or today (if past 6 PM)
        await performAutoCheckout(employeeId);


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
                attendance.isAvailable = true;
                attendance.clockOut = undefined; // Clear previous checkout if it exists
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
            attendance.isAvailable = false;

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