import { User } from '../models/user.model.js';

export class AdminService {
  static async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, totalItems] = await Promise.all([
      User.find().skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return { users, pagination: { page, limit, totalPages, totalItems } };
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
    if (existingUser) 
      throw new Error('Email or phone already exists');
    
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
    if (!user) 
      throw new Error('User not found');
    
    user.isBanned = true;
    await user.save();
    return user;
  }

  static async unbanUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) 
      throw new Error('User not found');
    
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
    if (!user) 
      throw new Error('Pending verification not found');
    
    if (!user.craftsmanInfo) 
      throw new Error('No craftsman info found');
    
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
    if (!user) 
      throw new Error('Pending verification not found');
    
    if (!user.craftsmanInfo) 
      throw new Error('No craftsman info found');
    
    user.craftsmanInfo.verificationStatus = 'rejected';
    await user.save();
    return user;
  }
}
