import Attendance from '@/models/Attendance';
import connectDB from './db';

/**
 * Automatically clocks out employees who haven't clocked out by 6 PM Nepal time.
 * This can be called for a specific employee or for all employees.
 * 
 * @param {string|null} employeeId - Optional employee ID to clean up specifically.
 * @returns {Promise<number>} - Number of records updated.
 */
export async function performAutoCheckout(employeeId: string | null = null): Promise<number> {
    try {
        await connectDB();

        const now = new Date(); // Current UTC time

        // Nepal Today's Date String (MM/DD/YYYY)
        const nepalDateStr = now.toLocaleDateString("en-US", {
            timeZone: "Asia/Kathmandu",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Current hour in Nepal
        const currentNepalHour = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kathmandu',
            hour: 'numeric',
            hour12: false
        }).format(now));

        const [m, d, y] = nepalDateStr.split('/');
        const utcBase = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d));
        const today = new Date(utcBase - (5.75 * 60 * 60 * 1000));

        const isPastSixPM = currentNepalHour >= 18;

        // 2. Build filter for "open" records that should be closed
        const filter: any = {
            $or: [
                { isAvailable: true },
                { clockOut: { $exists: false } }
            ],
            $and: [
                {
                    $or: [
                        { date: { $lt: today } } // Any previous day
                    ]
                }
            ]
        };

        // If it's currently past 6 PM Nepal, also include today's records
        if (isPastSixPM) {
            filter.$and[0].$or.push({ date: today });
        }

        // If specified, only check for one employee
        if (employeeId) {
            filter.employeeId = employeeId;
        }

        const openRecords = await Attendance.find(filter);

        if (openRecords.length === 0) return 0;

        let updatedCount = 0;
        for (const record of openRecords) {
            const recordDate = new Date(record.date);
            const isToday = recordDate.getTime() === today.getTime();

            // Get the start time of the session we are closing
            let sessionStartTime = record.clockIn;
            if (record.sessions && record.sessions.length > 0) {
                const lastSession = record.sessions[record.sessions.length - 1];
                if (!lastSession.checkIn) continue;
                sessionStartTime = lastSession.checkIn;
            }

            if (!sessionStartTime) continue;

            const sessionStartHourNepal = parseInt(new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kathmandu',
                hour: 'numeric',
                hour12: false
            }).format(new Date(sessionStartTime)));

            // If they clocked in AFTER 6 PM today, skip auto-checkout (let them work)
            if (isToday && sessionStartHourNepal >= 18) {
                continue;
            }

            // Set clockOut to 6 PM (12:15 UTC) or 11:59 PM (18:14 UTC) of that record's day
            const parts = recordDate.toLocaleDateString("en-US", {
                timeZone: "Asia/Kathmandu",
                year: 'numeric', month: 'numeric', day: 'numeric'
            }).split('/');

            let utcH = 12;
            let utcM = 15;
            let label = '6:00 PM';

            // If they started after 6 PM (on a previous day), close at 11:59 PM to ensure positive duration
            if (sessionStartHourNepal >= 18) {
                utcH = 18;
                utcM = 14;
                label = '11:59 PM';
            }

            const closingTime = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]), utcH, utcM));

            record.clockOut = closingTime;
            record.isAvailable = false;
            record.status = record.status || 'present';

            // Close the last session if it's still open
            if (record.sessions && record.sessions.length > 0) {
                const lastSession = record.sessions[record.sessions.length - 1];
                if (!lastSession.checkOut) {
                    lastSession.checkOut = closingTime;
                    lastSession.checkOutIP = 'system-auto';
                    lastSession.checkOutDevice = 'System (Auto)';
                    lastSession.checkOutLocation = {
                        address: `Auto Clock-out (${label})`,
                        latitude: null,
                        longitude: null
                    };
                }
            }

            await record.save();
            updatedCount++;
        }

        return updatedCount;
    } catch (error) {
        console.error('Auto-checkout error:', error);
        return 0;
    }
}
