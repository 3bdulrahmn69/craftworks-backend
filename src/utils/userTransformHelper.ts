import { IUser, IUserPublic } from '../types/user.types.js';
import { Service } from '../models/service.model.js';

/**
 * Helper function to transform user data based on role
 */
export class UserTransformHelper {
  /**
   * Transform user document to public interface based on role
   */
  static async toPublic(user: IUser): Promise<IUserPublic> {
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

    if (user.role === 'craftsman' && user.craftsmanInfo?.service)
      // Populate service data if craftsman has a service
      try {
        const service = await Service.findById(user.craftsmanInfo.service);
        if (service)
          publicUser.service = {
            _id: service._id.toString(),
            name: service.name,
            image: service.image,
            description: service.description,
          } as any;
        else publicUser.service = user.craftsmanInfo.service; // Fallback to ID if service not found
      } catch (error) {
        publicUser.service = user.craftsmanInfo.service; // Fallback to ID on error
      }

    // Add verification status for craftsmen
    if (user.role === 'craftsman' && user.craftsmanInfo) {
      publicUser.verificationStatus = user.craftsmanInfo.verificationStatus;
      publicUser.bio = user.craftsmanInfo.bio;
      publicUser.portfolioImageUrls = user.craftsmanInfo.portfolioImageUrls;
    }

    return publicUser;
  }

  /**
   * Filter user fields for different contexts (login response, profile, etc.)
   */
  static async filterForContext(
    user: IUser,
    context: 'login' | 'profile' | 'public' = 'public'
  ): Promise<IUserPublic> {
    const publicUser = await this.toPublic(user);

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
