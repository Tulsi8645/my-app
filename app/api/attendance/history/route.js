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
            clockIn: record.clockIn
                ? new Date(record.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : (record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'),
            clockOut: record.clockOut
                ? new Date(record.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : (record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'),
            status: record.status,
            sessions: record.sessions ? record.sessions.map(s => ({
                checkIn: new Date(s.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                checkOut: s.checkOut ? new Date(s.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Active'
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