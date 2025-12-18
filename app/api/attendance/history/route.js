import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        await connectDB();

        // Ensure employeeId is valid ObjectId if that's what we expect
        // The checkin route stores employeeId as ObjectId (ref User).
        // Let's assume the frontend passes the correct string.

        let query = {};
        if (employeeId) {
            query = { employeeId: employeeId };
        }

        const records = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(7)
            .lean();

        const formattedRecords = records.map(record => ({
            date: record.date,
            clockIn: record.clockIn,
            clockOut: record.clockOut,
            status: record.status,
            isAvailable: record.isAvailable,
            onTime: record.onTime,
            sessions: record.sessions ? record.sessions.map(s => ({
                checkIn: s.checkIn,
                checkOut: s.checkOut || null
            })) : []
        }));

        return NextResponse.json({ records: formattedRecords });
    } catch (error) {
        console.error('History error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}