import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import mongoose from 'mongoose';
import { performAutoCheckout } from '@/lib/attendance-service';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        await connectDB();
        await performAutoCheckout(employeeId);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let query = {
            date: { $gte: startOfMonth }
        };

        if (employeeId) {
            query.employeeId = employeeId;
        }

        const records = await Attendance.find(query).lean();

        const stats = {
            present: new Set(records.filter(r => r.isAvailable || r.status === 'present' || r.status === 'late').map(r => new Date(r.date).toDateString())).size,
            late: new Set(records.filter(r => r.status === 'late' || (r.onTime === false)).map(r => new Date(r.date).toDateString())).size,
            onTime: new Set(records.filter(r => r.onTime).map(r => new Date(r.date).toDateString())).size
        };

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}