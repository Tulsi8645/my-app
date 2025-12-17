import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name for this user.'],
            maxlength: [60, 'Name cannot be more than 60 characters'],
        },
        email: {
            type: String,
            required: [true, 'Please provide an email for this user.'],
            unique: true,
            maxlength: [100, 'Email cannot be more than 100 characters'],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password for this user.'],
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        employeeId: {
            type: String,
            unique: true,
            sparse: true,
        },
        image: {
            type: String,
        },
    },
    { timestamps: true }
);

export default models.User || model('User', UserSchema);
