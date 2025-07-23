import { IAuthRequest } from '../types/user.types.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationHelper {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^01[0-9]{9}$/;
    return phoneRegex.test(phone);
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8)
      errors.push('Password must be at least 8 characters long');

    if (!/(?=.*[a-z])/.test(password))
      errors.push('Password must contain at least one lowercase letter');

    if (!/(?=.*[A-Z])/.test(password))
      errors.push('Password must contain at least one uppercase letter');

    if (!/(?=.*\d)/.test(password))
      errors.push('Password must contain at least one number');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateRole(role: string): boolean {
    const validRoles = ['client', 'craftsman', 'admin', 'moderator'];
    return validRoles.includes(role.toLowerCase());
  }

  static validateRegistration(data: IAuthRequest): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!data.password) errors.push('Password is required');
    else {
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid)
        errors.push(...passwordValidation.errors);
    }

    if (!data.role) errors.push('Role is required');
    else if (!this.validateRole(data.role)) errors.push('Invalid role');

    if (!data.fullName) errors.push('Full name is required');
    else if (data.fullName.trim().length < 2)
      errors.push('Full name must be at least 2 characters long');

    // At least email or phone is required
    if (!data.email && !data.phone)
      errors.push('Either email or phone is required');

    // Validate email if provided
    if (data.email && !this.validateEmail(data.email))
      errors.push('Invalid email format');

    // Validate phone if provided
    if (data.phone && !this.validatePhone(data.phone))
      errors.push('Invalid phone format');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateLogin(data: Partial<IAuthRequest>): ValidationResult {
    const errors: string[] = [];

    if (!data.password) errors.push('Password is required');

    if (!data.type) errors.push('Login type is required');
    else if (!['public', 'internal'].includes(data.type))
      errors.push('Invalid login type');

    if (!data.email && !data.phone)
      errors.push('Either email or phone is required');

    if (data.email && !this.validateEmail(data.email))
      errors.push('Invalid email format');

    if (data.phone && !this.validatePhone(data.phone))
      errors.push('Invalid phone format');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static validateObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  static isValidObjectId(id: string): boolean {
    return this.validateObjectId(id);
  }

  static validateUserUpdate(data: any): ValidationResult {
    const errors: string[] = [];

    // Validate email if provided
    if (data.email && !this.validateEmail(data.email))
      errors.push('Invalid email format');

    // Validate phone if provided
    if (data.phone && !this.validatePhone(data.phone))
      errors.push('Invalid phone format');

    // Validate fullName if provided
    if (data.fullName !== undefined)
      if (!data.fullName || data.fullName.trim().length < 2)
        errors.push('Full name must be at least 2 characters long');

    // Validate profilePicture  if provided
    if (
      data.profilePicture &&
      !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(data.profilePicture)
    )
      errors.push('Invalid image URL format');

    // Validate address if provided
    if (data.address)
      if (typeof data.address !== 'object')
        errors.push('Address must be an object');
      else {
        const addressFields = ['country', 'state', 'city', 'street'];
        for (const field of addressFields)
          if (
            data.address[field] !== undefined &&
            typeof data.address[field] !== 'string'
          )
            errors.push(`${field} must be a string`);
      }

    // Validate craftsmanInfo if provided
    if (data.craftsmanInfo)
      if (typeof data.craftsmanInfo !== 'object')
        errors.push('Craftsman info must be an object');
      else {
        if (
          data.craftsmanInfo.skills &&
          !Array.isArray(data.craftsmanInfo.skills)
        )
          errors.push('Skills must be an array');

        if (
          data.craftsmanInfo.bio !== undefined &&
          typeof data.craftsmanInfo.bio !== 'string'
        )
          errors.push('Bio must be a string');

        if (
          data.craftsmanInfo.portfolioImageUrls &&
          !Array.isArray(data.craftsmanInfo.portfolioImageUrls)
        )
          errors.push('Portfolio image URLs must be an array');
      }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateVerificationSubmission(data: any): ValidationResult {
    const errors: string[] = [];

    // Validate skills
    if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0)
      errors.push('At least one skill is required');
    else
      for (const skill of data.skills)
        if (typeof skill !== 'string' || skill.trim().length === 0) {
          errors.push('All skills must be non-empty strings');
          break;
        }

    // Validate bio if provided
    if (data.bio !== undefined && typeof data.bio !== 'string')
      errors.push('Bio must be a string');

    // Validate portfolioImageUrls if provided
    if (data.portfolioImageUrls)
      if (!Array.isArray(data.portfolioImageUrls))
        errors.push('Portfolio image URLs must be an array');
      else
        for (const url of data.portfolioImageUrls)
          if (
            typeof url !== 'string' ||
            !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url)
          ) {
            errors.push('Invalid portfolio image URL format');
            break;
          }

    // Validate verificationDocs
    if (
      !data.verificationDocs ||
      !Array.isArray(data.verificationDocs) ||
      data.verificationDocs.length === 0
    )
      errors.push('At least one verification document is required');
    else
      for (const doc of data.verificationDocs) {
        if (typeof doc !== 'object' || !doc.docType || !doc.docUrl) {
          errors.push(
            'Each verification document must have docType and docUrl'
          );
          break;
        }
        if (
          typeof doc.docType !== 'string' ||
          doc.docType.trim().length === 0
        ) {
          errors.push('Document type must be a non-empty string');
          break;
        }
        if (
          typeof doc.docUrl !== 'string' ||
          !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(doc.docUrl)
        ) {
          errors.push('Invalid document URL format');
          break;
        }
      }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateForgotPassword(data: { email?: string }): ValidationResult {
    const errors: string[] = [];
    if (!data.email || !this.validateEmail(data.email))
      errors.push('Valid email is required');
    return { isValid: errors.length === 0, errors };
  }

  static validateResetPassword(data: {
    token?: string;
    newPassword?: string;
  }): ValidationResult {
    const errors: string[] = [];
    if (!data.token) errors.push('Token is required');
    if (!data.newPassword) errors.push('New password is required');
    else {
      const passwordValidation = this.validatePassword(data.newPassword);
      if (!passwordValidation.isValid)
        errors.push(...passwordValidation.errors);
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateDateRange(start?: any, end?: any): ValidationResult {
    const errors: string[] = [];
    if (start && isNaN(new Date(start).getTime()))
      errors.push('Invalid start date');
    if (end && isNaN(new Date(end).getTime())) errors.push('Invalid end date');
    return { isValid: errors.length === 0, errors };
  }

  static validateLogFilters(filters: any): ValidationResult {
    const errors: string[] = [];
    if (filters.categories && !Array.isArray(filters.categories))
      errors.push('Categories must be an array');
    if (filters.actions && !Array.isArray(filters.actions))
      errors.push('Actions must be an array');
    if (filters.userRoles && !Array.isArray(filters.userRoles))
      errors.push('User roles must be an array');
    if (filters.success !== undefined && typeof filters.success !== 'boolean')
      errors.push('Success must be a boolean');
    if (filters.search && typeof filters.search !== 'string')
      errors.push('Search must be a string');
    return { isValid: errors.length === 0, errors };
  }

  static validateIpAddress(ip: string): boolean {
    if (!ip) return true;
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex =
      /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^(?:[0-9a-fA-F]{0,4}:){1,7}:$|^:(?::[0-9a-fA-F]{0,4}){1,7}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  static validateImageUrl(url: string): boolean {
    return !url || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  static validateRating(rating: number): boolean {
    return !rating || (rating >= 1 && rating <= 5);
  }
}
