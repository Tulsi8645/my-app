import Attendance from '@/models/Attendance';
import connectDB from './db';

const NEPAL_OFFSET_MS = 5.75 * 60 * 60 * 1000; // 5 hours 45 minutes

/**
 * Automatically clocks out employees who haven't clocked out by 6 PM Nepal time.
 * This can be called for a specific employee or for all employees.
 * 
 * @param {string|null} employeeId - Optional employee ID to clean up specifically.
 * @returns {Promise<number>} - Number of records updated.
 */
export async function performAutoCheckout(employeeId = null) {
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

        // Nepal Today 00:00:00 (Runtime-relative, matching app's 'today' construction)
        const today = new Date(nepalDateStr);
        today.setHours(0, 0, 0, 0);

        const isPastSixPM = currentNepalHour >= 18;

        // 2. Build filter for "open" records that should be closed
        const filter = {
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
            // Set clockOut to 6 PM (12:15 UTC) of that record's day
            // We use the record's date to get the correct calendar day
            const recordDate = new Date(record.date);
            const parts = recordDate.toLocaleDateString("en-US", {
                timeZone: "Asia/Kathmandu",
                year: 'numeric', month: 'numeric', day: 'numeric'
            }).split('/');
            // Parts: [month, day, year]

            const closingTime = new Date(Date.UTC(parts[2], parts[0] - 1, parts[1], 12, 15));

            record.clockOut = closingTime;
            record.isAvailable = false;
            record.status = record.status || 'present'; // Ensure status exists

            // Close the last session if it's still open
            if (record.sessions && record.sessions.length > 0) {
                const lastSession = record.sessions[record.sessions.length - 1];
                if (!lastSession.checkOut) {
                    lastSession.checkOut = closingTime;
                    lastSession.checkOutIP = 'system-auto';
                    lastSession.checkOutLocation = {
                        address: 'Auto Clock-out (6:00 PM)',
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
