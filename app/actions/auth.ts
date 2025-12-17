"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
    (await cookies()).delete("token");
    redirect("/");
}

export async function getCurrentUser() {
    const token = (await cookies()).get("token")?.value;

    if (!token) return null;

    try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-me');
        const { payload } = await jwtVerify(token, secret);

        // We know the token has email, id, role. 
        // We might want to fetch full details from DB if name isn't in token.
        // Let's check api/auth/login.
        // Login puts: id, role, email. Name is NOT in token.
        // So we must fetch from DB.

        const { MongoClient, ObjectId } = await import('mongodb');
        const clientPromise = (await import('@/lib/mongodb')).default;
        const client = await clientPromise;
        const db = client.db('attendance');

        const user = await db.collection('users').findOne({ _id: new ObjectId(payload.id as string) });

        if (!user) return null;

        return {
            name: user.name,
            email: user.email,
            role: user.role,
            img: user.img || "/images/user/user-03.png" // Fallback if no image
        };
    } catch (error) {
        return null;
    }
}
