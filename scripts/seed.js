const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;

// Helper to create date object from string "YYYY-MM-DD HH:mm"
function createDate(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`);
}

async function seed() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('attendance');

        console.log('Connected to database...');

        // 1. Setup Employee
        const hashedPassword = await bcrypt.hash('password123', 10);
        const employeeId = 'EMP-2024-001';

        // Remove existing employee to ensure clean slate without allowedIPs
        await db.collection('employees').deleteOne({ employeeId });

        const employeeResult = await db.collection('employees').insertOne({
            name: 'John Doe',
            email: 'john.doe@company.com',
            password: hashedPassword,
            employeeId: employeeId,
            department: 'Engineering'
        });

        const userObjectId = employeeResult.insertedId;
        console.log(`Created employee: ${employeeId} (${userObjectId})`);

        // 2. Clear existing attendance for this employee
        await db.collection('attendance').deleteMany({ employeeId: userObjectId });
        console.log('Cleared existing attendance records for employee.');

        // 3. Generate Attendance History (Past 7 Days)
        const records = [];
        const today = new Date();
        const dummyLocation = { latitude: 40.7128, longitude: -74.0060 }; // NYC
        const dummyIP = '192.168.1.1';

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Skip weekends for realism (0=Sun, 6=Sat)
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            let sessions = [];
            let clockInTime, clockOutTime;
            let status = 'present';

            // Variation 1: Standard Day (9-5)
            if (i % 3 === 0) {
                clockInTime = createDate(dateStr, '09:00');
                clockOutTime = createDate(dateStr, '17:00');
                sessions = [{
                    checkIn: clockInTime,
                    checkOut: clockOutTime,
                    checkInLocation: dummyLocation,
                    checkOutLocation: dummyLocation,
                    checkInIP: dummyIP,
                    checkOutIP: dummyIP
                }];
            }
            // Variation 2: Late Arrival (10-6)
            else if (i % 3 === 1) {
                clockInTime = createDate(dateStr, '10:15');
                clockOutTime = createDate(dateStr, '18:00');
                status = 'late';
                sessions = [{
                    checkIn: clockInTime,
                    checkOut: clockOutTime,
                    checkInLocation: dummyLocation,
                    checkOutLocation: dummyLocation,
                    checkInIP: dummyIP,
                    checkOutIP: dummyIP
                }];
            }
            // Variation 3: Multiple Sessions (Morning + Afternoon)
            else {
                const session1Start = createDate(dateStr, '08:30');
                const session1End = createDate(dateStr, '12:00');
                const session2Start = createDate(dateStr, '13:00');
                const session2End = createDate(dateStr, '17:30');

                clockInTime = session1Start;
                clockOutTime = session2End;

                sessions = [
                    {
                        checkIn: session1Start,
                        checkOut: session1End,
                        checkInLocation: dummyLocation,
                        checkOutLocation: dummyLocation,
                        checkInIP: dummyIP,
                        checkOutIP: dummyIP
                    },
                    {
                        checkIn: session2Start,
                        checkOut: session2End,
                        checkInLocation: dummyLocation,
                        checkOutLocation: dummyLocation,
                        checkInIP: dummyIP,
                        checkOutIP: dummyIP
                    }
                ];
            }

            records.push({
                employeeId: userObjectId,
                date: new Date(dateStr), // Store as Date object for queries
                status: status,
                clockIn: clockInTime,
                clockOut: clockOutTime,
                checkInLocation: dummyLocation, // Legacy field population
                checkOutLocation: dummyLocation, // Legacy field population
                sessions: sessions
            });
        }

        if (records.length > 0) {
            await db.collection('attendance').insertMany(records);
            console.log(`Inserted ${records.length} attendance records.`);
        }

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await client.close();
    }
}

seed();