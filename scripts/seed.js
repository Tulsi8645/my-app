const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;

async function seed() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('attendance');

        console.log('Connected to database...');

        // 1. Setup Employee
        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = 'john.doe@company.com';

        // Check if user exists
        const existingUser = await db.collection('employees').findOne({ email });

        if (existingUser) {
            console.log('User already exists:', email);
        } else {
            const employeeId = 'EMP-' + Date.now(); // Unique ID
            const result = await db.collection('employees').insertOne({
                name: 'John Doe',
                email: email,
                password: hashedPassword,
                employeeId: employeeId,
                department: 'Engineering'
            });
            console.log(`Created new employee: ${employeeId} (${result.insertedId})`);
        }

        console.log('Seed operation completed.');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await client.close();
    }
}

seed();