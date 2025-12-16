import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        const client = await clientPromise;
        const db = client.db('attendance');

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const records = await db
            .collection('attendance')
            .find({
                employeeId: new ObjectId(employeeId),
                date: { $gte: startOfMonth }
            })
            .toArray();

        const stats = {
            present: records.filter(r => r.status === 'present').length,
            late: records.filter(r => r.status === 'late').length
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