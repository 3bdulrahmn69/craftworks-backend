import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  IUser,
  ICraftsmanInfo,
  IWallet,
  IUserLogs,
} from '../types/user.types.js';
import { authConfig } from '../config/environment.js';

const craftsmanInfoSchema = new Schema<ICraftsmanInfo>(
  {
    skills: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    portfolioImageUrls: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationDocs: [
      {
        docType: {
          type: String,
          required: true,
        },
        docUrl: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { _id: false }
);

const walletSchema = new Schema<IWallet>(
  {
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    withdrawableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const userLogsSchema = new Schema<IUserLogs>(
  {
    lastLogin: { type: Date },
    lastLogout: { type: Date },
    lastIP: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) {
            return true; // Allow empty/undefined
          }

          // IPv4 validation
          const ipv4Regex =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

          // IPv6 validation (including ::1 and other short forms)
          const ipv6Regex =
            /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^(?:[0-9a-fA-F]{0,4}:){1,7}:$|^:(?::[0-9a-fA-F]{0,4}){1,7}$/;

          return ipv4Regex.test(v) || ipv6Regex.test(v);
        },
        message: 'Invalid IP address format',
      },
    },
    lastLocation: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: function (v: string) {
          // Skip validation if password is already hashed (starts with $2a$, $2b$, etc.)
          if (/^\$2[abxy]\$/.test(v)) {
            return true;
          }

          // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(
            v
          );
        },
        message:
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
      },
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v: string) {
          return !v || /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: 'Invalid phone number format',
      },
    },
    role: {
      type: String,
      enum: ['client', 'craftsman', 'admin', 'moderator'],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    profilePicture : {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Invalid image URL format',
      },
    },
    address: {
      country: { type: String, trim: true },
      state: { type: String, trim: true },
      city: { type: String, trim: true },
      street: { type: String, trim: true },
    },
    craftsmanInfo: {
      type: craftsmanInfoSchema,
      required: function (this: IUser) {
        return this.role === 'craftsman';
      },
    },
    wallet: {
      type: walletSchema,
      default: () => ({ balance: 0, withdrawableBalance: 0 }),
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    userLogs: {
      type: userLogsSchema,
      default: () => ({}),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function (v: number) {
          return !v || (v >= 1 && v <= 5);
        },
        message: 'Rating must be between 1 and 5',
      },
    },
    rating_count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
  }
);

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(
      this.password,
      authConfig.bcryptSaltRounds
    );
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware for updating updatedAt
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method for password comparison
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static method to find user by email or phone
userSchema.statics.findByEmailOrPhone = function (
  email?: string,
  phone?: string
) {
  const query: any = {};
  if (email) {
    query.email = email.toLowerCase();
  }
  if (phone) {
    query.phone = phone;
  }

  return this.findOne({
    $or: Object.keys(query).map((key) => ({ [key]: query[key] })),
  });
};

export const User = model<IUser>('User', userSchema);
