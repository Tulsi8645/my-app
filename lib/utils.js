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

export function getDeviceInfo(userAgent) {
    if (!userAgent || userAgent === 'Unknown') return 'Unknown Device';

    const ua = userAgent.toLowerCase();

    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('android')) {
        const match = userAgent.match(/Android\s([^\s;]+)/);
        return match ? `Android ${match[1]}` : 'Android Device';
    }
    if (ua.includes('windows')) return 'Windows PC';
    if (ua.includes('macintosh')) return 'Mac';
    if (ua.includes('linux')) return 'Linux PC';

    return 'Unknown Device';
}