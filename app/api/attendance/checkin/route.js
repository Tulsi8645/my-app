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
            const status = 'present';

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
                    attendance.status = status;
                } else if (!attendance.clockIn) {
                    // Migration fallback
                    attendance.clockIn = new Date(timestamp);
                }

                attendance.sessions.push(newSession);
                await attendance.save();

            } else {
                // New daily record
                attendance = await Attendance.create({
                    employeeId,
                    date: today,
                    clockIn: new Date(timestamp),
                    status: status,
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