import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  IUser,
  ICraftsmanInfo,
  IWallet,
  IUserLogs,
} from '../types/user.types.js';
import { authConfig } from '../config/environment.js';
import { ValidationHelper } from '../utils/validation.js';

const craftsmanInfoSchema = new Schema<ICraftsmanInfo>(
  {
    skills: {
      type: [String],
      default: [],
    },
    service: {
      type: String,
      validate: {
        validator: function (v: string) {
          // Validate that service ID is a valid MongoDB ObjectId
          return !v || /^[0-9a-fA-F]{24}$/.test(v);
        },
        message: 'Service ID must be a valid ObjectId',
      },
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
          return ValidationHelper.validateIpAddress(v);
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
          return ValidationHelper.validateEmail(v);
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
          if (/^\$2[abxy]\$/.test(v)) return true;
          return ValidationHelper.validatePassword(v).isValid;
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
          return !v || ValidationHelper.validatePhone(v);
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
    profilePicture: {
      type: String,
      validate: {
        validator: function (v: string) {
          return ValidationHelper.validateImageUrl(v);
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
    rating: {
      type: Number,
      min: 0,
      max: 5,
      validate: {
        validator: function (v: number) {
          return ValidationHelper.validateRating(v);
        },
        message: 'Rating must be between 1 and 5',
      },
    },
    ratingCount: {
      type: Number,
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
  if (!this.isModified('password')) return next();

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

// Pre-save middleware for wallet initialization
userSchema.pre('save', function (next) {
  // Initialize wallet only for craftsmen
  if (this.role === 'craftsman' && !this.wallet)
    this.wallet = { balance: 0, withdrawableBalance: 0 };

  // Initialize craftsman info if missing for craftsmen
  if (this.role === 'craftsman' && !this.craftsmanInfo)
    this.craftsmanInfo = {
      skills: [],
      service: undefined,
      bio: '',
      portfolioImageUrls: [],
      verificationStatus: 'pending',
      verificationDocs: [],
    };

  // Remove wallet for non-craftsmen
  if (this.role !== 'craftsman') this.set('wallet', undefined);

  // Handle address for different roles
  if (this.role === 'admin' || this.role === 'moderator')
    // Remove address for admins and moderators
    this.set('address', undefined);
  else if (!this.address)
    // Set default country for clients and craftsmen if not set
    this.address = { country: 'Egypt' };
  else if (!this.address.country) this.address.country = 'Egypt';

  // Remove rating fields only from admins and moderators
  if (this.role === 'admin' || this.role === 'moderator') {
    this.set('rating', undefined);
    this.set('ratingCount', undefined);
  } else if (this.rating === undefined) {
    this.rating = 0;
    this.ratingCount = 0;
  }

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
  if (email) query.email = email.toLowerCase();

  if (phone) query.phone = phone;

  return this.findOne({
    $or: Object.keys(query).map((key) => ({ [key]: query[key] })),
  });
};

export const User = model<IUser>('User', userSchema);
