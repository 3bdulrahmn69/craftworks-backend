# Migration Guide v1.8.0 → v1.9.0

This guide helps you migrate from version 1.8.0 to 1.9.0 of the Craftworks Backend API.

## ⚠️ Breaking Changes

### 1. Invitation Response Enhancement

**BEFORE (v1.8.0):**

```json
POST /api/jobs/:jobId/invitations/respond
{
  "response": "Accepted"
}
```

**AFTER (v1.9.0):**

```json
POST /api/jobs/:jobId/invitations/respond
{
  "response": "Accepted",
  "price": 150.00,
  "notes": "I can complete this job within 2 days with high quality materials"
}
```

**Migration Actions Required:**

- **Add price validation** when accepting invitations
- **Update frontend forms** to include price input field
- **Handle optional notes** field for additional craftsman communication
- **Update error handling** for price validation messages

### 2. Service Model Complete Restructure

**BEFORE (v1.8.0):**

```json
{
  "services": [
    {
      "_id": "...",
      "name": "Plumbing",
      "icon": "fa-wrench",
      "description": "Professional plumbing services"
    }
  ]
}
```

**AFTER (v1.9.0):**

```json
{
  "services": [
    {
      "_id": "...",
      "name": {
        "en": "Plumbing",
        "ar": "السباكة"
      },
      "description": {
        "en": "Professional plumbing services",
        "ar": "خدمات سباكة احترافية"
      },
      "image": "https://res.cloudinary.com/...",
      "isActive": true
    }
  ]
}
```

**Language-Specific Response:**

```json
GET /api/services?lang=en
{
  "services": [
    {
      "_id": "...",
      "name": "Plumbing",
      "description": "Professional plumbing services",
      "image": "https://res.cloudinary.com/...",
      "isActive": true
    }
  ]
}
```

**Migration Actions Required:**

- **Update service models** in frontend to handle multilingual structure
- **Add language selection** in service management interfaces
- **Replace icon references** with image URLs
- **Update service creation forms** to include both English and Arabic fields
- **Handle isActive field** for service filtering

### 3. Service Creation with File Upload

**BEFORE (v1.8.0):**

```json
POST /api/services
Content-Type: application/json
{
  "name": "Plumbing",
  "icon": "fa-wrench",
  "description": "Professional services"
}
```

**AFTER (v1.9.0):**

```http
POST /api/services
Content-Type: multipart/form-data

nameEn: Plumbing
nameAr: السباكة
descriptionEn: Professional plumbing services
descriptionAr: خدمات سباكة احترافية
image: [FILE]
```

**Migration Actions Required:**

- **Change to multipart forms** for service creation/update
- **Add file upload components** for service images
- **Update form validation** for required language fields
- **Handle image preview** in admin interfaces

## 🆕 New Features

### 1. Enhanced Invitation-to-Quote Flow

**New Workflow:**

1. Client sends invitation to craftsman
2. Craftsman accepts invitation WITH price and optional notes
3. System automatically creates a quote
4. Client receives notification with quote details
5. Client can accept/reject the quote as usual

**Frontend Integration Required:**

```typescript
// Enhanced invitation response
const respondToInvitation = async (response: 'Accepted' | 'Rejected', price?: number, notes?: string) => {
  const payload: any = { response };

  if (response === 'Accepted') {
    if (!price || price <= 0) {
      throw new Error('Price is required when accepting invitation');
    }
    payload.price = price;
    if (notes) payload.notes = notes;
  }

  const result = await api.post(`/jobs/${jobId}/invitations/respond`, payload);
  return result.data;
};
```

### 2. Multilingual Service Management

**Language-Specific Queries:**

```typescript
// Get services in specific language
const getServices = async (lang?: 'en' | 'ar') => {
  const params = lang ? { lang } : {};
  const response = await api.get('/services', { params });
  return response.data;
};

// Service creation with file upload
const createService = async (serviceData: FormData) => {
  const response = await api.post('/services', serviceData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
```

## 🔄 Recommended Updates

### Frontend Code Updates

#### 1. Update Invitation Response Form

```typescript
// Enhanced invitation response component
const InvitationResponseForm = ({ invitation, onSubmit }) => {
  const [response, setResponse] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (response === 'Accepted') {
      if (!price || parseFloat(price) <= 0) {
        alert('Price is required when accepting invitation');
        return;
      }
    }

    onSubmit({
      response,
      ...(response === 'Accepted' && {
        price: parseFloat(price),
        notes: notes.trim() || undefined
      })
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <button type="button" onClick={() => setResponse('Accepted')}>
          Accept Invitation
        </button>
        <button type="button" onClick={() => setResponse('Rejected')}>
          Reject Invitation
        </button>
      </div>

      {response === 'Accepted' && (
        <>
          <div>
            <label>Price (Required):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div>
            <label>Notes (Optional):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about your quote..."
            />
          </div>
        </>
      )}

      <button type="submit">Submit Response</button>
    </form>
  );
};
```

#### 2. Update Service Management

```typescript
// Multilingual service form
const ServiceForm = ({ service, onSubmit }) => {
  const [formData, setFormData] = useState({
    nameEn: service?.name?.en || '',
    nameAr: service?.name?.ar || '',
    descriptionEn: service?.description?.en || '',
    descriptionAr: service?.description?.ar || '',
    image: null,
    isActive: service?.isActive ?? true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('nameEn', formData.nameEn);
    data.append('nameAr', formData.nameAr);
    data.append('descriptionEn', formData.descriptionEn);
    data.append('descriptionAr', formData.descriptionAr);
    data.append('isActive', formData.isActive.toString());

    if (formData.image) {
      data.append('image', formData.image);
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name (English):</label>
        <input
          value={formData.nameEn}
          onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Name (Arabic):</label>
        <input
          value={formData.nameAr}
          onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Description (English):</label>
        <textarea
          value={formData.descriptionEn}
          onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Description (Arabic):</label>
        <textarea
          value={formData.descriptionAr}
          onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Service Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
          />
          Active
        </label>
      </div>

      <button type="submit">Save Service</button>
    </form>
  );
};
```

#### 3. Language-Aware Service Display

```typescript
// Service list with language preference
const ServiceList = ({ language = 'en' }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchServices(language);
  }, [language]);

  const fetchServices = async (lang) => {
    const response = await api.get(`/services?lang=${lang}`);
    setServices(response.data.data);
  };

  return (
    <div>
      {services.map(service => (
        <div key={service._id}>
          <img src={service.image} alt={service.name} />
          <h3>{service.name}</h3>
          <p>{service.description}</p>
        </div>
      ))}
    </div>
  );
};
```

## 📱 Mobile App Updates

### 1. Update API Models

```dart
// Updated Dart models
class Service {
  final String id;
  final ServiceTranslation? name;
  final ServiceTranslation? description;
  final String? image;
  final bool isActive;

  // For language-specific responses
  final String? displayName;
  final String? displayDescription;
}

class ServiceTranslation {
  final String en;
  final String ar;
}

class InvitationResponse {
  final String response; // 'Accepted' | 'Rejected'
  final double? price;   // Required when accepting
  final String? notes;   // Optional
}
```

### 2. Update Invitation Response Flow

```dart
// Enhanced invitation response
Future<void> respondToInvitation(String jobId, String response, {double? price, String? notes}) async {
  final Map<String, dynamic> payload = {'response': response};

  if (response == 'Accepted') {
    if (price == null || price <= 0) {
      throw Exception('Price is required when accepting invitation');
    }
    payload['price'] = price;
    if (notes != null && notes.isNotEmpty) {
      payload['notes'] = notes;
    }
  }

  await apiClient.post('/jobs/$jobId/invitations/respond', data: payload);
}
```

## 🧪 Testing Updates

### API Testing

```javascript
// Updated invitation tests
describe('Invitation Response', () => {
  it('should require price when accepting invitation', async () => {
    const response = await request(app)
      .post(`/api/jobs/${jobId}/invitations/respond`)
      .set('Authorization', `Bearer ${craftsmanToken}`)
      .send({ response: 'Accepted' })
      .expect(400);

    expect(response.body.message).toContain('Price is required');
  });

  it('should create quote when accepting invitation with price', async () => {
    const response = await request(app)
      .post(`/api/jobs/${jobId}/invitations/respond`)
      .set('Authorization', `Bearer ${craftsmanToken}`)
      .send({
        response: 'Accepted',
        price: 150.00,
        notes: 'Quality work guaranteed'
      })
      .expect(200);

    expect(response.body.data.quote).toBeDefined();
    expect(response.body.data.quote.price).toBe(150.00);
  });
});

// Service multilingual tests
describe('Service Management', () => {
  it('should create service with multilingual data', async () => {
    const response = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nameEn', 'Plumbing')
      .field('nameAr', 'السباكة')
      .field('descriptionEn', 'Professional plumbing')
      .field('descriptionAr', 'خدمات سباكة احترافية')
      .attach('image', 'test-image.jpg')
      .expect(201);

    expect(response.body.data.name.en).toBe('Plumbing');
    expect(response.body.data.name.ar).toBe('السباكة');
  });

  it('should return language-specific service data', async () => {
    const response = await request(app)
      .get('/api/services?lang=en')
      .expect(200);

    expect(response.body.data[0].name).toBe('Plumbing'); // String, not object
  });
});
```

## 🚀 Deployment Checklist

- [ ] Update API documentation with new multilingual service structure
- [ ] Update frontend/mobile apps with enhanced invitation flow
- [ ] Test file upload functionality for service images
- [ ] Verify multilingual service creation and querying
- [ ] Update admin interfaces for service management
- [ ] Train customer support on new invitation-quote flow
- [ ] Monitor invitation acceptance rates and quote generation

## 🆘 Support & Rollback

If issues arise during migration:

1. **Database Migration**: New service structure is backward compatible during transition
2. **API Compatibility**: Old service structure can be supported temporarily with transform layer
3. **File Upload Issues**: Service creation will work without images (optional field)
4. **Language Support**: Default to English if Arabic translations missing

For support, check the enhanced logging for invitation and service operations.

---

# Previous Migration Guide v1.7.0 → v1.8.0

This guide helps you migrate from version 1.7.0 to 1.8.0 of the Craftworks Backend API.

## ⚠️ Breaking Changes

### 1. User Verification Status

**BEFORE (v1.7.0):**

```typescript
// API Response
{
  "user": {
    "id": "...",
    "fullName": "John Doe",
    "isVerified": true  // Boolean
  }
}
```

**AFTER (v1.8.0):**

```typescript
// API Response
{
  "user": {
    "id": "...",
    "fullName": "John Doe",
    "verificationStatus": "verified"  // Enum: 'pending' | 'verified' | 'rejected' | 'none'
  }
}
```

**Migration Actions Required:**

- Update frontend code to use `verificationStatus` instead of `isVerified`
- Handle new status values: `'none'` (default), `'pending'`, `'verified'`, `'rejected'`
- Update UI logic to show appropriate status indicators

### 2. Job Creation Requirements

**BEFORE (v1.7.0):**

```json
{
  "title": "Fix sink",
  "description": "Leaky sink",
  "service": "serviceId",
  "paymentType": "Cash",
  "jobPrice": 100
}
```

**AFTER (v1.8.0):**

```json
{
  "title": "Fix sink",
  "description": "Leaky sink",
  "service": "serviceId",
  "address": {
    "country": "Egypt",
    "state": "Cairo",
    "city": "New Cairo",
    "street": "123 Main St"
  },
  "location": {
    "type": "Point",
    "coordinates": [31.2, 30.1]
  },
  "jobDate": "2024-02-15T10:00:00.000Z",
  "paymentType": "cash"
}
```

**Migration Actions Required:**

- **Remove `jobPrice`** from job creation requests
- **Add required fields**: `address` (all sub-fields), `location`, `jobDate`
- **Update payment types**: Use lowercase `'cash'` or `'visa'` only
- Ensure address validation on frontend
- Add date picker for `jobDate` in job creation forms

### 3. Payment Type Changes

**BEFORE (v1.7.0):**

```typescript
type PaymentType = 'Escrow' | 'Cash' | 'CashProtected';
```

**AFTER (v1.8.0):**

```typescript
type PaymentType = 'cash' | 'visa';
```

**Migration Actions Required:**

- Update payment type dropdowns to only show 'Cash' and 'Visa'
- Remove references to 'Escrow' and 'CashProtected'
- Handle visa payment flow with wallet integration

## 🆕 New Features

### 1. Wallet System (Craftsmen Only)

**New API Endpoints:**

```typescript
// Get wallet balance
GET /api/wallet/balance
Headers: Authorization: Bearer <craftsman_token>

Response: {
  "success": true,
  "data": {
    "balance": 450.00,
    "withdrawableBalance": 450.00
  }
}

// Request withdrawal
POST /api/wallet/withdraw
Headers: Authorization: Bearer <craftsman_token>
Body: {
  "amount": 100.00
}

Response: {
  "success": true,
  "data": {
    "success": true,
    "message": "Withdrawal request submitted successfully",
    "amount": 100.00,
    "requestId": "..."
  }
}
```

**Integration Required:**

- Add wallet balance display in craftsman dashboard
- Add withdrawal request functionality
- Handle wallet notifications for payment receipts

### 2. Automatic Payment Processing

**How it works:**

1. Job completed with `paymentType: 'visa'` → Craftsman wallet automatically credited
2. Platform fee (10%) automatically deducted
3. Craftsman receives notification with payment details

**No frontend changes required** - this is automatic server-side processing.

## 🔄 Recommended Updates

### Frontend Code Updates

#### 1. Update Verification Status Checking

```typescript
// OLD
if (user.isVerified) {
  showVerifiedBadge();
}

// NEW
switch (user.verificationStatus) {
  case 'verified':
    showVerifiedBadge();
    break;
  case 'pending':
    showPendingBadge();
    break;
  case 'rejected':
    showRejectedBadge();
    break;
  case 'none':
    showUnverifiedBadge();
    break;
}
```

#### 2. Update Job Creation Forms

```typescript
// Add required fields to job creation form
const jobData = {
  title: formData.title,
  description: formData.description,
  service: formData.serviceId,
  address: {
    country: formData.country,    // Required
    state: formData.state,        // Required
    city: formData.city,          // Required
    street: formData.street       // Required
  },
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]  // Required
  },
  jobDate: formData.jobDate,      // Required
  paymentType: formData.paymentType, // 'cash' or 'visa' only
  // Remove jobPrice - not allowed anymore
};
```

#### 3. Add Wallet Features (Craftsmen)

```typescript
// Wallet balance component
const WalletBalance = () => {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (user.role === 'craftsman') {
      fetchWalletBalance();
    }
  }, []);

  const fetchWalletBalance = async () => {
    const response = await api.get('/wallet/balance');
    setWallet(response.data.data);
  };

  const requestWithdrawal = async (amount) => {
    await api.post('/wallet/withdraw', { amount });
    // Refresh balance and show success message
  };

  return (
    <div>
      <h3>Wallet Balance: ${wallet?.balance || 0}</h3>
      <p>Available: ${wallet?.withdrawableBalance || 0}</p>
      {/* Add withdrawal form */}
    </div>
  );
};
```

## 📱 Mobile App Updates

### 1. Update API Models

```dart
// Dart/Flutter model updates
class User {
  final String verificationStatus; // Changed from bool isVerified
  // ... other fields
}

class Job {
  final Address address; // Now required
  final Location location; // Now required
  final DateTime jobDate; // Now required
  final String paymentType; // 'cash' or 'visa' only
  // Remove jobPrice from creation
}
```

### 2. Update Job Creation Flow

- Add address input fields (all required)
- Add location picker (required)
- Add date/time picker for job scheduling (required)
- Remove price input from initial job creation
- Update payment type picker

### 3. Add Wallet Screen (Craftsmen)

- Balance display
- Transaction history
- Withdrawal request form
- Payment notifications handling

## 🧪 Testing Updates

### API Testing

Update your API tests to reflect new requirements:

```javascript
// Update job creation tests
describe('Job Creation', () => {
  it('should require all fields except photos', async () => {
    const jobData = {
      title: 'Test Job',
      description: 'Test Description',
      service: 'validServiceId',
      address: {
        country: 'Egypt',
        state: 'Cairo',
        city: 'New Cairo',
        street: '123 Test St'
      },
      location: {
        type: 'Point',
        coordinates: [31.2, 30.1]
      },
      jobDate: new Date().toISOString(),
      paymentType: 'cash'
      // Don't include jobPrice
    };

    const response = await request(app)
      .post('/api/jobs')
      .send(jobData)
      .expect(201);
  });
});

// Add wallet tests
describe('Wallet', () => {
  it('should get balance for craftsman', async () => {
    const response = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${craftsmanToken}`)
      .expect(200);

    expect(response.body.data).toHaveProperty('balance');
    expect(response.body.data).toHaveProperty('withdrawableBalance');
  });
});
```

## 🚀 Deployment Checklist

- [ ] Update API documentation
- [ ] Update frontend/mobile apps with new models
- [ ] Test wallet functionality thoroughly
- [ ] Verify payment processing works correctly
- [ ] Update user-facing documentation
- [ ] Train customer support on new verification statuses
- [ ] Monitor wallet transactions and notifications

## 🆘 Support & Rollback

If issues arise during migration:

1. **Database Migration**: The changes are backward compatible - no data loss
2. **API Compatibility**: Old `isVerified` field can be computed from `verificationStatus`
3. **Rollback Strategy**: Previous version can run alongside temporarily
4. **Monitoring**: Check wallet transaction logs and payment processing

For support, check the API logs and wallet transaction audit trail in the admin panel.
