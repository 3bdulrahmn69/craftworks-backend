import { User } from '../models/user.model.js';
import { Service } from '../models/service.model.js';

export class AdminService {
  static async getAllUsers(page: number, limit: number) {
    console.log(
      '🔍 AdminService.getAllUsers called with page:',
      page,
      'limit:',
      limit
    );

    // Use custom pagination logic to handle manual population
    const skip = (page - 1) * limit;
    const totalItems = await User.countDocuments({});
    const totalPages = Math.ceil(totalItems / limit);

    console.log('📊 Found', totalItems, 'total users');

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('👥 Retrieved', users.length, 'users from database');

    // Manually populate service for craftsmen
    let populatedCount = 0;
    for (const user of users) {
      if (user.role === 'craftsman' && user.craftsmanInfo?.service) {
        try {
          console.log(
            `🔍 Populating service ${user.craftsmanInfo.service} for user ${user.fullName}`
          );
          const service = await Service.findById(
            user.craftsmanInfo.service
          ).lean();
          if (service) {
            // Type assertion to allow assigning service object
            (user.craftsmanInfo as any).service = service;
            populatedCount++;
            console.log(
              `✅ Service populated: ${service.name?.en || 'Unknown'}`
            );
          } else {
            console.log(
              `❌ Service not found with ID: ${user.craftsmanInfo.service}`
            );
          }
        } catch (error) {
          // Keep original service ID if population fails
          console.warn(
            `Failed to populate service for user ${user._id}:`,
            error
          );
        }
      }
    }

    console.log(`🎯 Successfully populated ${populatedCount} services`);

    return {
      data: users,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async createAdmin({
    email,
    password,
    fullName,
    role,
    phone,
  }: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    phone?: string;
  }) {
    if (!['admin', 'moderator'].includes(role))
      throw new Error('Role must be admin or moderator');

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) throw new Error('Email or phone already exists');

    const newUser = new User({
      email,
      password,
      fullName,
      role,
      phone,
      isBanned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newUser.save();
    return newUser;
  }

  static async banUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.isBanned = true;
    await user.save();
    return user;
  }

  static async unbanUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.isBanned = false;
    await user.save();
    return user;
  }

  static async getPendingVerifications() {
    return User.find({
      role: 'craftsman',
      'craftsmanInfo.verificationStatus': 'pending',
    }).lean();
  }

  static async approveVerification(verificationId: string) {
    const user = await User.findOne({
      _id: verificationId,
      role: 'craftsman',
      'craftsmanInfo.verificationStatus': 'pending',
    });
    if (!user) throw new Error('Pending verification not found');

    if (!user.craftsmanInfo) throw new Error('No craftsman info found');

    user.craftsmanInfo.verificationStatus = 'verified';
    await user.save();
    return user;
  }

  static async rejectVerification(verificationId: string) {
    const user = await User.findOne({
      _id: verificationId,
      role: 'craftsman',
      'craftsmanInfo.verificationStatus': 'pending',
    });
    if (!user) throw new Error('Pending verification not found');

    if (!user.craftsmanInfo) throw new Error('No craftsman info found');

    user.craftsmanInfo.verificationStatus = 'rejected';
    await user.save();
    return user;
  }
}
