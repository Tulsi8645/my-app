import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getClientIP } from '@/lib/utils';
import { ObjectId } from 'mongodb';

export async function POST(request) {
    try {
        const { employeeId, latitude, longitude, address, timestamp, type } = await request.json();

        const ipAddress = getClientIP(request);

        const client = await clientPromise;
        const db = client.db('attendance');

        const nepalDateStr = new Date().toLocaleDateString("en-US", {
            timeZone: "Asia/Kathmandu",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const today = new Date(nepalDateStr);
        today.setHours(0, 0, 0, 0);

        // Find or create today's attendance record
        const existingRecord = await db.collection('attendance').findOne({
            employeeId: new ObjectId(employeeId),
            date: today
        });

        if (type === 'checkin') {
            // Check if user is currently checked in (last session active)
            // Fallback to legacy checkInTime if sessions not present (migration handling)
            const sessions = existingRecord?.sessions || (existingRecord?.checkInTime ? [{
                checkIn: existingRecord.checkInTime,
                checkOut: existingRecord.checkOutTime || null,
                checkInLocation: existingRecord.checkInLocation || {},
                checkInIP: existingRecord.checkInIP || ''
            }] : []);

            const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

            if (lastSession && !lastSession.checkOut) {
                return NextResponse.json(
                    { error: 'Already checked in' },
                    { status: 400 }
                );
            }

            // Prepare new session
            const newSession = {
                checkIn: new Date(timestamp),
                checkInLocation: { latitude, longitude, address },
                checkInIP: ipAddress,
                checkOut: null // Explicitly null for active session
            };

            // Calculate status
            // Use Nepal Time (UTC+5:45) for Late calculation
            // Late if after 9:30 AM Nepal Time
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kathmandu',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            });

            const parts = formatter.formatToParts(new Date(timestamp));
            const hour = parseInt(parts.find(p => p.type === 'hour').value);
            const minute = parseInt(parts.find(p => p.type === 'minute').value);

            const isLate = hour > 9 || (hour === 9 && minute > 30);
            const status = isLate ? 'late' : 'present';

            if (existingRecord) {
                // Determine if this is the very first clock-in of the day (e.g. if record was created empty or valid summary missing)
                // But normally existingRecord implies distinct day doc.
                // We just push the session.
                // If it's the first session ever for this doc (unlikely if existingRecord true, but possible if empty doc), set clockIn.

                const updateQuery = {
                    $push: { sessions: newSession },
                    $set: { status: status },
                    $unset: { clockOut: "" }
                };

                if (existingRecord.clockIn) {
                    // If already clocked in once, don't overwrite 'present' with 'late' for subsequent sessions
                    delete updateQuery.$set.status;
                }

                // Legacy migration: if no clockIn but checkInTime exists
                if (!existingRecord.clockIn && existingRecord.checkInTime) {
                    updateQuery.$set.clockIn = existingRecord.checkInTime;
                }

                // If this is the *first* session being added to a doc that somehow has no sessions/clockIn
                if ((!sessions || sessions.length === 0) && !existingRecord.clockIn) {
                    updateQuery.$set.clockIn = new Date(timestamp);
                    updateQuery.$set.status = status; // Ensure status is set for first session
                }

                // Ensure sessions array is migrated if missing
                if (!existingRecord.sessions && existingRecord.checkInTime) {
                    updateQuery.$set.sessions = [
                        {
                            checkIn: existingRecord.checkInTime,
                            checkOut: existingRecord.checkOutTime,
                            checkInLocation: existingRecord.checkInLocation || {},
                            checkOutLocation: existingRecord.checkOutLocation || {},
                            checkInIP: existingRecord.checkInIP || '',
                            checkOutIP: existingRecord.checkOutIP || ''
                        },
                        newSession
                    ];
                    delete updateQuery.$push;
                }

                await db.collection('attendance').updateOne(
                    { _id: existingRecord._id },
                    updateQuery
                );
            } else {
                // New daily record
                await db.collection('attendance').updateOne(
                    {
                        employeeId: new ObjectId(employeeId),
                        date: today
                    },
                    {
                        $set: {
                            clockIn: new Date(timestamp), // First clock in
                            checkInLocation: { latitude, longitude, address },
                            checkInIP: ipAddress,
                            status: status,
                            sessions: [newSession]
                        },
                        $setOnInsert: {
                            employeeId: new ObjectId(employeeId),
                            date: today
                        }
                    },
                    { upsert: true }
                );
            }
        } else {
            // Check-out logic
            const sessions = existingRecord?.sessions || (existingRecord?.checkInTime ? [{
                checkIn: existingRecord.checkInTime,
                checkOut: existingRecord.checkOutTime,
                checkInLocation: existingRecord.checkInLocation,
                checkInIP: existingRecord.checkInIP
            }] : []);

            const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

            if (!existingRecord || !lastSession || lastSession.checkOut) {
                return NextResponse.json(
                    { error: 'Must clock in first' },
                    { status: 400 }
                );
            }

            // Update the last session
            const sessionIndex = sessions.length - 1;

            const updateQuery = {
                $set: {
                    clockOut: new Date(timestamp), // Update latest clock out
                    checkOutLocation: { latitude, longitude, address }, // Legacy/Latest reference
                    checkOutIP: ipAddress
                }
            };

            // If we are working with the legacy implicit session or array session
            if (existingRecord.sessions) {
                updateQuery.$set[`sessions.${sessionIndex}.checkOut`] = new Date(timestamp);
                updateQuery.$set[`sessions.${sessionIndex}.checkOutLocation`] = { latitude, longitude, address };
                updateQuery.$set[`sessions.${sessionIndex}.checkOutIP`] = ipAddress;
            } else {
                // Migration case
                updateQuery.$set.sessions = [{
                    checkIn: existingRecord.checkInTime,
                    checkInLocation: existingRecord.checkInLocation || {},
                    checkInIP: existingRecord.checkInIP || '',
                    checkOut: new Date(timestamp),
                    checkOutLocation: { latitude, longitude, address },
                    checkOutIP: ipAddress
                }];
                // Also ensure clockIn is set if missing
                if (!existingRecord.clockIn) {
                    updateQuery.$set.clockIn = existingRecord.checkInTime;
                }
            }

            await db.collection('attendance').updateOne(
                { _id: existingRecord._id },
                updateQuery
            );
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