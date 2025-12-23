const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env' });
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;

async function seed() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();

        console.log('Connected to database...');

        // 1. Setup Employee
        const hashedPassword = await bcrypt.hash('strongpassword', 10);
        const email = 'tecobitpvtltd@gmail.com';

        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email });

        if (existingUser) {
            console.log('User already exists:', email);
        } else {
            const employeeId = 'EMP-' + Date.now(); // Unique ID
            const result = await db.collection('users').insertOne({
                name: 'Tecobit Technology',
                email: email,
                department: 'Management',
                password: hashedPassword,
                employeeId: employeeId,
                role: 'admin'
            });
            console.log(`Created new employee user: ${employeeId} (${result.insertedId})`);
        }

        console.log('Seed operation completed.');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await client.close();
    }
}

seed();