import { Document } from 'mongoose';

export interface IAddress {
  country?: string;
  state?: string;
  city?: string;
  street?: string;
}

export interface IVerificationDoc {
  docType: string;
  docUrl: string;
}

export interface ICraftsmanInfo {
  skills: string[];
  bio?: string;
  portfolioImageUrls: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocs: IVerificationDoc[];
}

export interface IWallet {
  balance: number;
  withdrawableBalance: number;
}

export interface IUserLogs {
  lastLogin?: Date;
  lastLogout?: Date;
  lastIP?: string;
  lastLocation?: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  phone?: string;
  role: 'client' | 'craftsman' | 'admin' | 'moderator';
  fullName: string;
  profilePicture?: string;
  address?: IAddress;
  craftsmanInfo?: ICraftsmanInfo;
  wallet?: IWallet; // Only for craftsmen
  isBanned: boolean;
  resetPasswordToken?: string | undefined;
  resetPasswordExpires?: Date | undefined;
  userLogs: IUserLogs;
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  ratingCount: number;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserPublic {
  id: string;
  email?: string;
  phone?: string;
  address?: IAddress; // Only for clients and craftsmen
  role: string;
  fullName: string;
  profilePicture?: string;
  rating?: number; // Only for craftsmen
  ratingCount?: number; // Only for craftsmen
  wallet?: IWallet; // Only for craftsmen
  createdAt?: Date;
}

export interface IAuthRequest {
  email?: string;
  phone?: string;
  password: string;
  role?: string;
  fullName?: string;
  type?: 'public' | 'internal';
}

export interface IAuthResponse {
  token: string;
  user: IUserPublic;
}

export interface IJWTPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}
