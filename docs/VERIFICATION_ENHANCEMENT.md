# Verification System Enhancement Documentation

## Overview

This document outlines the enhancements made to the Craftworks backend to support:

1. Including verification status in user profiles (`/users/:id`)
2. Enhanced verification document upload with custom names and multiple files (`/users/craftsman/verification`)

## Changes Made

### 1. User Types Enhancement

**File: `src/types/user.types.ts`**

- Added `isVerified?: boolean` field to `IUserPublic` interface
- Added optional `docName?: string` field to `IVerificationDoc` interface

### 2. User Model Update

**File: `src/models/user.model.ts`**

- Updated `verificationDocs` schema to include optional `docName` field

### 3. User Transform Helper Enhancement

**File: `src/utils/userTransformHelper.ts`**

- Modified `toPublic()` method to include verification status for craftsmen
- Craftsmen now return `isVerified: true/false` based on verification status

### 4. Multer Configuration for Verification

**File: `src/config/multerVerification.ts` (NEW)**

- Created specialized multer configuration for verification documents
- Supports both images and PDF files
- File size limit: 10MB
- Maximum files: 10
- Accepted types: images (jpg, jpeg, png, gif, webp) and PDF

### 5. Routes Enhancement

**File: `src/routes/user.routes.ts`**

- Updated verification route to use new upload configuration
- Added support for multiple file uploads with field name `verificationDocs`

### 6. Validation Enhancement

**File: `src/utils/validation.ts`**

- Updated `validateVerificationSubmission()` method
- Removed strict validation for `verificationDocs` URLs (handled by file upload)
- Added validation for `docNames` and `docTypes` arrays

### 7. Controller Enhancement

**File: `src/controllers/user.controller.ts`**

- Completely rewritten `submitVerification()` method
- Added file upload handling with Cloudinary integration
- Supports custom document names and types
- Validates file count matches names and types count
- Uploads each file to Cloudinary with proper organization

### 8. Service Enhancement

**File: `src/services/user.service.ts`**

- Updated `submitVerification()` method signature to include optional `docName`

## API Changes

### GET /api/users/:id

**Enhancement:** Now includes `isVerified` field for craftsmen

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "fullName": "John Doe",
    "role": "craftsman",
    "isVerified": true,  // NEW FIELD
    "rating": 4.5,
    "ratingCount": 10,
    "profilePicture": "url",
    "service": { ... }
  }
}
```

### POST /api/users/craftsman/verification

**Enhancement:** Now supports file uploads with custom names

**Request Format (multipart/form-data):**

```
Files:
- verificationDocs[]: Array of files (images/PDFs)

Form Data:
- docNames[]: ["ID Card Front", "ID Card Back", "License"] (required)
- docTypes[]: ["ID-Card", "ID-Card", "Professional-License"] (required)
- service: "service_id" (optional)
- portfolioImageUrls[]: ["url1", "url2"] (optional)
```

**Key Requirements:**

- Files, docNames, and docTypes arrays must have the same length
- At least one file is required
- Each file gets uploaded to Cloudinary with proper naming
- Supports up to 10 files, 10MB each
- Only document images required - no skills or bio needed

**Cloudinary Upload Configuration:**

- Folder: `verification-documents`
- Public ID format: `{userId}_{docType}_{timestamp}`
- Images: Auto-optimized to WebP, max 1200x1200
- PDFs: Preserved as-is
- All files: Auto-detect resource type

## Usage Examples

### 1. Checking Verification Status

```javascript
// GET /api/users/64a7b8f5e1234567890abcde
{
  "success": true,
  "data": {
    "id": "64a7b8f5e1234567890abcde",
    "fullName": "Ahmed Hassan",
    "role": "craftsman",
    "isVerified": true,  // Craftsman is verified
    "rating": 4.8,
    "service": {
      "name": "Plumbing Services",
      "icon": "plumbing-icon.svg"
    }
  }
}
```

### 2. Submitting Verification with Files

```javascript
const formData = new FormData();

// Add files
formData.append('verificationDocs', idCardFrontFile);
formData.append('verificationDocs', idCardBackFile);
formData.append('verificationDocs', licenseFile);

// Add metadata
formData.append('docNames[]', 'ID Card Front');
formData.append('docNames[]', 'ID Card Back');
formData.append('docNames[]', 'Professional License');

formData.append('docTypes[]', 'ID-Card');
formData.append('docTypes[]', 'ID-Card');
formData.append('docTypes[]', 'Professional-License');

// Optional: Add service ID and portfolio
formData.append('service', 'service_id_here');
formData.append('portfolioImageUrls[]', 'https://example.com/portfolio1.jpg');

// POST /api/users/craftsman/verification
fetch('/api/users/craftsman/verification', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  },
  body: formData
});
```

## File Organization in Cloudinary

Files are organized as follows:

```
verification-documents/
├── {userId}_ID-Card_1691234567890.webp
├── {userId}_ID-Card_1691234567891.webp
├── {userId}_Professional-License_1691234567892.pdf
└── ...
```

## Security Considerations

1. **File Type Validation**: Only images and PDFs are allowed
2. **File Size Limits**: 10MB per file, 10 files maximum
3. **Authentication**: Only authenticated craftsmen can upload
4. **Authorization**: Role-based access control
5. **Cloudinary Security**: Files uploaded to secure folder structure

## Error Handling

The enhanced system provides detailed error messages for:

- Missing files
- Mismatched array lengths (files, names, types)
- Invalid file types
- File size exceeded
- Cloudinary upload failures
- Authentication/authorization issues

## Backward Compatibility

These changes are backward compatible:

- Existing user profiles continue to work
- New `isVerified` field is optional and only appears for craftsmen
- Old verification documents without `docName` continue to function
