import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  passwordResetOtpHash?: string;
  passwordResetOtpExpires?: Date;
  passwordResetOtpAttempts?: number;
  passwordResetOtpLastSentAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
    passwordResetOtpHash: { type: String },
    passwordResetOtpExpires: { type: Date },
    passwordResetOtpAttempts: { type: Number, default: 0 },
    passwordResetOtpLastSentAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output to remove password
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
