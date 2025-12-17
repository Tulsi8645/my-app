import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        await connectDB();

        const user = await User.findOne({ email }).lean();

        if (!user) {
            console.log('Login failed: User not found for email:', email);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('User found:', user.email);
        console.log('Password match:', isValidPassword);

        if (!isValidPassword) {
            console.log('Login failed: Password mismatch');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Remove password from response
        const { password: _, ...userData } = user;

        // Create JWT
        const { SignJWT } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-me');
        const token = await new SignJWT({
            id: user._id.toString(),
            role: user.role,
            email: user.email
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        const redirectUrl = user.role === 'admin' ? '/admin' : '/';

        const response = NextResponse.json({
            user: userData,
            redirectUrl,
            message: 'Login successful'
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400, // 1 day
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}