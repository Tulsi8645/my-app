import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Get client IP address 
export function getClientIP(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
}