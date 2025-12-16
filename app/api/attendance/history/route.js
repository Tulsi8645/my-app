import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        const client = await clientPromise;
        const db = client.db('attendance');

        const records = await db
            .collection('attendance')
            .find({ employeeId: new ObjectId(employeeId) })
            .sort({ date: -1 })
            .limit(7)
            .toArray();

        const formattedRecords = records.map(record => ({
            date: record.date,
            clockIn: record.clockIn || record.checkInTime || null,
            clockOut: record.clockOut || record.checkOutTime || null,
            status: record.status,
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