import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { authConfig } from '../config/environment.js';
import {
  IUser,
  IJWTPayload,
  IUserPublic,
  IAuthRequest,
} from '../types/user.types.js';
import { ValidationHelper } from '../utils/validation.js';
import logger, { loggerHelpers } from './logger.js';

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthService {
  /**
   * Register a new user
   */
  static async registerUser(
    userData: IAuthRequest,
    userIP?: string
  ): Promise<{ token: string; user: IUserPublic }> {
    const { email, password, phone, role, fullName } = userData;

    // Check for existing email
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        loggerHelpers.logUserAction(
          'register_email_exists',
          existingEmail._id.toString(),
          { email }
        );
        throw new AuthenticationError('Email already exists', 409);
      }
    }

    // Check for existing phone
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        loggerHelpers.logUserAction(
          'register_phone_exists',
          existingPhone._id.toString(),
          { phone }
        );
        throw new AuthenticationError('Phone number already exists', 409);
      }
    }

    // Create new user
    const user = new User({
      email: email?.toLowerCase(),
      password,
      phone,
      role: role?.toLowerCase(),
      fullName: ValidationHelper.sanitizeInput(fullName ?? ''),
      userLogs: {
        lastIP: userIP,
      },
      craftsmanInfo:
        role?.toLowerCase() === 'craftsman'
          ? {
              skills: [],
              bio: '',
              portfolioImageUrls: [],
              verificationStatus: 'pending',
              verificationDocs: [],
            }
          : undefined,
    });

    await user.save();
    loggerHelpers.logUserAction('user_registered', user._id.toString(), {
      email,
      phone,
      role: user.role,
    });

    // Generate JWT token
    const token = this.generateToken(user._id.toString(), user.role);
    const userResponse = this.sanitizeUserData(user);

    return { token, user: userResponse };
  }

  /**
   * Authenticate user login
   */
  static async authenticateUser(
    loginData: Partial<IAuthRequest>,
    userIP?: string
  ): Promise<{ token: string; user: IUserPublic }> {
    const { email, phone, password, type } = loginData;

    if (!password) throw new AuthenticationError('Password is required', 400);

    // Find user by email or phone
    let user: IUser | null = null;
    if (email) user = await User.findOne({ email: email.toLowerCase() });
    else if (phone) user = await User.findOne({ phone });

    if (!user) {
      loggerHelpers.logAuthAttempt(false, email, phone, 'User not found');
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if user is banned
    if (user.isBanned) {
      loggerHelpers.logAuthAttempt(false, email, phone, 'User banned');
      throw new AuthenticationError('Account is banned', 403);
    }

    // Validate role based on login type
    if (type === 'clients' && !['client', 'craftsman'].includes(user.role)) {
      loggerHelpers.logAuthAttempt(
        false,
        email,
        phone,
        'Invalid role for client login'
      );
      throw new AuthenticationError('Access denied for this user type', 403);
    }

    if (type === 'admins' && !['admin', 'moderator'].includes(user.role)) {
      loggerHelpers.logAuthAttempt(
        false,
        email,
        phone,
        'Invalid role for admin login'
      );
      throw new AuthenticationError('Access denied for this user type', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      loggerHelpers.logAuthAttempt(false, email, phone, 'Invalid password');
      throw new AuthenticationError('Invalid credentials');
    }

    // Update user logs
    user.userLogs.lastLogin = new Date();
    if (userIP) user.userLogs.lastIP = userIP;

    await user.save();

    // Generate JWT token
    const token = this.generateToken(user._id.toString(), user.role);

    loggerHelpers.logAuthAttempt(true, email, phone);
    loggerHelpers.logUserAction('user_logged_in', user._id.toString(), {
      role: user.role,
    });

    const userResponse = this.sanitizeUserData(user);

    return { token, user: userResponse };
  }

  /**
   * Handle user logout
   */
  static async logoutUser(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.userLogs.lastLogout = new Date();
        await user.save();
        loggerHelpers.logUserAction('user_logged_out', userId);
      }
    } catch (error) {
      logger.error('Logout error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw new AuthenticationError('Logout failed', 500);
    }
  }

  /**
   * Handle forgot password
   */
  static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      // Don't reveal if user exists or not for security
      return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    loggerHelpers.logUserAction(
      'password_reset_requested',
      user._id.toString(),
      { email }
    );

    // TODO: Send email with reset token (integrate with email service)
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user)
      throw new AuthenticationError('Invalid or expired reset token', 400);

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    loggerHelpers.logUserAction(
      'password_reset_completed',
      user._id.toString()
    );
  }

  /**
   * Generate JWT token
   */
  private static generateToken(userId: string, role: string): string {
    const tokenPayload: IJWTPayload = {
      userId,
      role,
    };

    return jwt.sign(tokenPayload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiration,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): IJWTPayload {
    try {
      return jwt.verify(token, authConfig.jwtSecret) as IJWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError)
        throw new AuthenticationError('Token expired');

      if (error instanceof jwt.JsonWebTokenError)
        throw new AuthenticationError('Invalid token');

      throw new AuthenticationError('Authentication error', 500);
    }
  }

  /**
   * Sanitize user data for response
   */
  private static sanitizeUserData(user: IUser): IUserPublic {
    return {
      id: user._id.toString(),
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role,
      fullName: user.fullName,
      profilePicture: user.profilePicture ?? undefined,
      rating: user.rating ?? undefined,
      ratingCount: user.ratingCount,
    };
  }
}
