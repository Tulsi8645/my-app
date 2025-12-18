import mongoose, { Schema, model, models } from 'mongoose';

const LocationSchema = new Schema({
    latitude: Number,
    longitude: Number,
    address: String,
}, { _id: false });

const SessionSchema = new Schema({
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: Date,
    checkInLocation: LocationSchema,
    checkOutLocation: LocationSchema,
    checkInIP: String,
    checkOutIP: String,
}, { _id: false });

const AttendanceSchema = new Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        clockIn: {
            type: Date,
        },
        clockOut: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['present', 'late', 'absent', 'leave'],
            default: 'present',
        },
        isAvailable: {
            type: Boolean,
            default: false,
        },
        onTime: {
            type: Boolean,
        },
        sessions: [SessionSchema],
    },
    { timestamps: true }
);

// Compound index to ensure unique attendance document per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default models.Attendance || model('Attendance', AttendanceSchema);
