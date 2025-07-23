import { IUser, IUserPublic } from '../types/user.types.js';

/**
 * Helper function to transform user data based on role
 */
export class UserTransformHelper {
  /**
   * Transform user document to public interface based on role
   */
  static toPublic(user: IUser): IUserPublic {
    const publicUser: IUserPublic = {
      id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    };

    // Add role-specific fields
    if (user.role === 'client' || user.role === 'craftsman')
      publicUser.address = user.address;

    if (user.role === 'client' || user.role === 'craftsman') {
      publicUser.rating = user.rating;
      publicUser.ratingCount = user.ratingCount;
    }

    if (user.role === 'craftsman') publicUser.wallet = user.wallet;

    return publicUser;
  }

  /**
   * Filter user fields for different contexts (login response, profile, etc.)
   */
  static filterForContext(
    user: IUser,
    context: 'login' | 'profile' | 'public' = 'public'
  ): IUserPublic {
    const publicUser = this.toPublic(user);

    // For login context, include more sensitive fields if needed
    if (context === 'login') {
      // Add any login-specific fields here
    }

    // For profile context (when user views their own profile)
    if (context === 'profile') {
      // Keep all applicable fields for own profile
    }

    return publicUser;
  }
}
