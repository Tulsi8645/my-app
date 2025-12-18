export interface User {
    _id: string;
    name: string;
    email: string;
    department: string;
    employeeId: string;
    role: 'employee' | 'admin';
}

export interface Location {
    lat: number;
    lng: number;
    address?: string;
}

export interface Session {
    checkIn: string;
    checkInLocation: object;
    checkInIP: string;
    checkOut?: string;
    checkOutLocation?: object;
    checkOutIP?: string;
}

export interface AttendanceRecord {
    date: string;
    status: 'present' | 'late' | 'absent';
    isAvailable?: boolean;
    onTime?: boolean;
    clockIn?: string;
    clockOut?: string;
    sessions?: Session[];
    distance?: number;
}

export interface Stats {
    present: number;
    late: number;
    onTime?: number;
}

export interface ResultDetails {
    isWithinGeofence: boolean;
    isValidIP: boolean;
}

export interface Result {
    success: boolean;
    message: string;
    details?: ResultDetails;
}

export interface LoginForm {
    email: string;
    password: string;
}
