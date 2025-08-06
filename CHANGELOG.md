# Changelog

All notable changes to the Craftworks Backend TypeScript project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2025-08-06

### 🚀 Major Updates

#### Enhanced Invitation System with Quote Integration

- **BREAKING**: Invitation acceptance now requires price submission
- **NEW**: When craftsmen accept invitations, they must submit a quote with price and optional notes
- **Enhanced Flow**: Accepting invitation automatically creates a quote for the job
- **Improved Notifications**: Clients receive quote details when craftsmen accept invitations

#### Multilingual Service System Overhaul

- **BREAKING**: Complete service model restructuring for multilingual support
- **NEW**: Services now support both English and Arabic names and descriptions
- **Image Support**: Replaced icons with full image upload via Cloudinary
- **Language API**: Services can be queried with language preference (en/ar)
- **File Upload**: Admin service creation now supports image upload

### 🆕 Added

#### Enhanced Invitation Management

- **Quote Integration**: Accepting invitations automatically creates quotes
- **Price Validation**: Required price field when accepting invitations
- **Enhanced Notifications**: Detailed notifications with quote information
- **Improved User Experience**: Streamlined craftsman response flow

#### Multilingual Service Management

- **Language Support**: Full English/Arabic translation system for services
- **Image Management**: Cloudinary integration for service images
- **Flexible Queries**: Language-specific API responses
- **Admin Tools**: Enhanced service creation and management with file upload

### 🔄 Changed

#### Models

- **src/models/service.model.ts**:
  - Complete restructure with multilingual support
  - Added `name: {en: string, ar: string}` structure
  - Added `description: {en: string, ar: string}` structure
  - Replaced `icon` with `image` field for Cloudinary URLs
  - Added `isActive` field for soft deletes
  - Enhanced validation for both languages

#### Services

- **src/services/invitation.service.ts**:

  - Enhanced `respondToInvitation()` method with price and notes parameters
  - Automatic quote creation when accepting invitations
  - Improved notification system with quote details
  - Better error handling and validation

- **src/services/service.service.ts**:
  - Added language-specific query support
  - Enhanced update methods for partial multilingual updates
  - Soft delete implementation with `isActive` flag
  - New `getServiceById()` method with language support

#### Controllers

- **src/controllers/invitation.controller.ts**:

  - Enhanced invitation response handling with price validation
  - Better error messages and response structure
  - Integration with quote system

- **src/controllers/service.controller.ts**:
  - Complete rewrite with file upload support
  - Language-specific response handling
  - Cloudinary image upload integration
  - Enhanced validation for multilingual data

#### Types

- **src/types/service.types.ts**:
  - New `IServiceTranslation` interface for multilingual content
  - Updated `IService` interface with translation structure
  - Added image field and isActive flag

#### Routes

- **src/routes/service.routes.ts**:
  - Added Multer integration for file uploads
  - Enhanced POST/PUT routes with image upload capability

#### Utils

- **src/utils/userTransformHelper.ts**:
  - Updated service population to use new image field instead of icon
  - Maintained backward compatibility for service data

### 🔧 Infrastructure

#### File Upload System

- **Enhanced Multer Config**: Support for service image uploads
- **Cloudinary Integration**: Automatic image optimization and storage
- **Image Processing**: Standardized 400x400 service images with quality optimization

#### Database Schema

- **Service Migration**: New multilingual schema with proper indexing
- **Unique Constraints**: Separate unique indexes for English and Arabic names
- **Performance Indexes**: Language-specific search optimization

### 🔒 Security & Validation

#### Enhanced Validation

- **Multilingual Validation**: Ensures both languages are provided for services
- **File Upload Security**: Image-only uploads with size limits
- **Price Validation**: Required positive price values for invitation acceptance

#### API Security

- **Role-based Access**: Service management restricted to admin/moderator
- **File Type Validation**: Secure image upload with type checking
- **Data Sanitization**: Enhanced input validation for multilingual content

### 📊 API Enhancements

#### New Endpoints

- **Language-specific Service Queries**: `GET /api/services?lang=en|ar`
- **Enhanced Invitation Response**: `POST /api/jobs/:jobId/invitations/respond` with price and notes

#### Updated Responses

- **Service Responses**: Include full multilingual data or language-specific content
- **Invitation Responses**: Include quote information when accepting invitations

### 🛠️ Technical Improvements

#### Database Optimization

- **Multilingual Indexing**: Efficient searching in both languages
- **Soft Deletes**: Better data management with isActive flags
- **Schema Validation**: Comprehensive validation for translation objects

#### Code Quality

- **Type Safety**: Enhanced TypeScript interfaces for multilingual content
- **Error Handling**: Improved error messages and validation feedback
- **Service Architecture**: Better separation of concerns for multilingual data

### 📱 Developer Experience

#### API Consistency

- **Standardized Responses**: Consistent multilingual response format
- **Better Documentation**: Enhanced API examples with multilingual content
- **Improved Testing**: Better support for testing multilingual features

---

## [1.8.0] - 2025-08-06

### 🚀 Major Updates

#### User Verification System Overhaul

- **BREAKING**: Changed from `isVerified: boolean` to `verificationStatus: enum`
- Updated user verification status from boolean to enum with values: `'pending' | 'verified' | 'rejected' | 'none'`
- Set default verification status to `'none'` for new craftsmen instead of `'pending'`
- Updated all API responses to return `verificationStatus` instead of `isVerified`

#### Job System Enhancement

- **BREAKING**: Made all job fields required except photos
  - `title`, `description`, `service`, `address` (all sub-fields), `location`, `jobDate`, `paymentType` are now required
  - `photos` remain optional
- **BREAKING**: Removed `jobPrice` from job creation process
  - Clients can no longer set job prices during creation
  - Only craftsmen can set prices through quotes
  - Job price gets set automatically when quotes are accepted
- **BREAKING**: Updated `jobDate` to be required field for job scheduling

#### Payment System Overhaul

- **BREAKING**: Restricted payment methods to only `'cash'` and `'visa'`
  - Removed old payment types: `'Escrow'`, `'Cash'`, `'CashProtected'`
  - Updated job model enum: `paymentType: 'cash' | 'visa'`
- **NEW**: Integrated comprehensive wallet system for visa payments
  - Automatic wallet crediting when jobs with visa payment are completed
  - Platform fee calculation (10% default) automatically deducted
  - Real-time notifications for payment processing

### 🆕 Added

#### Wallet System

- **NEW**: `WalletService` class with comprehensive wallet operations
  - `creditWallet()` - Credit craftsman wallet with platform fee calculation
  - `getWalletBalance()` - Retrieve current wallet balance
  - `requestWithdrawal()` - Handle withdrawal requests (ready for payment processor)
- **NEW**: `WalletController` with secure API endpoints
- **NEW**: Wallet API routes:
  - `GET /api/wallet/balance` - Get craftsman's wallet balance (Craftsman only)
  - `POST /api/wallet/withdraw` - Request withdrawal from wallet (Craftsman only)
- **NEW**: Automatic payment processing on job completion
  - Visa payments automatically credit craftsman wallet
  - Platform fee deduction with detailed logging
  - Payment failure handling without blocking job completion

#### Enhanced Logging & Notifications

- **NEW**: Comprehensive action logging for all wallet transactions
- **NEW**: Payment notifications for craftsmen when wallet is credited
- **NEW**: Enhanced job status notifications with payment information

### 🔄 Changed

#### Models

- **src/models/user.model.ts**:

  - Updated `verificationStatus` enum to include `'none'` option
  - Set `verificationStatus` default to `'none'` instead of `'pending'`
  - Enhanced pre-save middleware for verification status handling

- **src/models/job.model.ts**:
  - Made address fields required: `country`, `state`, `city`, `street`
  - Made location coordinates required with proper validation
  - Made `jobDate` required field
  - Updated `paymentType` enum to `['cash', 'visa']`
  - Added completion timestamp when job status becomes 'Completed'

#### Types

- **src/types/user.types.ts**:

  - Updated `ICraftsmanInfo` interface with new verification status options
  - Updated `IUserPublic` interface to use `verificationStatus` instead of `isVerified`

- **src/types/job.types.ts**:
  - Made `address` and `location` fields required (removed optional markers)
  - Made `jobDate` required field
  - Updated `paymentType` type to `'cash' | 'visa'`

#### Services

- **src/services/user.service.ts**:

  - Maintained backward compatibility for existing verification data
  - Enhanced verification document handling

- **src/services/job.service.ts**:
  - Added wallet integration for visa payment processing
  - Enhanced `updateJobStatus()` with automatic payment handling
  - Added platform fee calculation and wallet crediting

#### Controllers

- **src/controllers/job.controller.ts**:
  - Removed `jobPrice` from job creation input validation
  - Enhanced job creation to exclude price from client input
  - Maintained existing coordinate parsing and file upload functionality

#### Utilities

- **src/utils/userTransformHelper.ts**:
  - Updated to return `verificationStatus` instead of `isVerified`
  - Maintained compatibility with existing user data structure

### 🔧 Infrastructure

#### Routes

- **NEW**: Added wallet routes to main application (`/api/wallet`)
- **UPDATED**: Integrated wallet routes with role-based authentication (craftsman only)

#### Main Application

- **src/index.ts**:
  - Added wallet routes import and registration
  - Maintained existing route structure and middleware

#### Documentation

- **README.md**:

  - Updated to version 1.8.0 with comprehensive feature overview
  - Added detailed wallet system documentation
  - Updated payment system explanation
  - Added verification status changes documentation

- **package.json**:
  - Updated version to 1.8.0
  - Updated description to reflect new payment and wallet features

#### API Collection

- **Craftworks-API-Collection.json**:
  - Updated job creation examples with new required fields
  - Updated payment type examples to use lowercase ('cash', 'visa')
  - Added `jobDate` requirement in examples
  - Removed `jobPrice` from creation examples

### 🔒 Security

#### Access Control

- **Wallet endpoints**: Restricted to craftsmen only with role-based authentication
- **Payment processing**: Server-side validation and automatic processing
- **Action logging**: All wallet transactions logged for audit trails

#### Validation

- **Enhanced job validation**: All required fields properly validated
- **Payment type validation**: Restricted to approved payment methods only
- **Wallet balance validation**: Prevents negative balances and invalid transactions

### 🛠️ Technical Details

#### Database Schema Changes

- **User Model**: Updated verification status enum and default values
- **Job Model**: Enhanced field requirements and payment type restrictions
- **Indexes**: Maintained existing performance optimizations

#### Payment Processing Flow

1. Client creates job with required details (no price)
2. Craftsman submits quote with price
3. Client accepts quote → job gets price and craftsman assignment
4. Job completion with visa payment → automatic wallet crediting
5. Platform fee deduction and notification sent
6. Craftsman can check balance and request withdrawals

#### Backward Compatibility

- **Existing users**: All existing verification data preserved
- **API responses**: Gradual migration from `isVerified` to `verificationStatus`
- **Job data**: Existing jobs maintain their current structure
- **Authentication**: All existing authentication flows unchanged

### 📊 Performance & Reliability

#### Error Handling

- **Payment failures**: Don't block job completion
- **Wallet operations**: Comprehensive error logging and user feedback
- **Database operations**: Proper transaction handling for wallet updates

#### Monitoring

- **Action logs**: All wallet transactions tracked
- **Notifications**: Real-time updates for payment processing
- **Audit trail**: Complete financial transaction history

### 🧪 Testing & Validation

#### Build Verification

- ✅ All TypeScript compilation successful
- ✅ Strict type checking passes
- ✅ ES6 module imports/exports working
- ✅ MongoDB schema validation updated

#### API Testing Ready

- Updated Postman collection with new examples
- Enhanced request/response documentation
- Wallet endpoint examples ready for testing

---

## [1.7.0] - Previous Release

### Enhanced Verification System with File Upload Support

- Advanced file upload for verification documents
- Cloudinary integration with organized folder structure
- Custom document naming and type classification
- Multi-file support with validation
- Enhanced security with file type and size limits

---

## [1.6.0] - Previous Release

### Real-time Messaging System

- Socket.IO powered chat system
- Role-based message permissions
- Real-time typing indicators and read receipts
- Image message support with Cloudinary integration

---

_For older versions, see git history and previous documentation._
