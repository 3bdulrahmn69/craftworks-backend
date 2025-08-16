# User Profile Update Examples (v1.9.2)

This document provides comprehensive examples for the updated user profile update endpoint that now uses PATCH instead of PUT and enforces single-field updates.

## Endpoint

`PATCH /api/users/me`

## Key Changes

1. **Method Changed**: `PUT` → `PATCH`
2. **Single Field Constraint**: Only one field can be updated per request
3. **Verification Protection**: Verified craftsmen cannot update their name
4. **Profile Picture Exception**: Profile picture uploads don't count towards the single-field limit

## Valid Single Field Updates

### 1. Update Full Name

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmed Hassan"
  }'
```

### 2. Update Email

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

### 3. Update Phone

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+201234567890"
  }'
```

### 4. Update Address

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "country": "Egypt",
      "state": "Cairo",
      "city": "New Cairo",
      "street": "123 New Street"
    }
  }'
```

### 5. Update Service (Craftsmen Only)

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer CRAFTSMAN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "507f1f77bcf86cd799439020"
  }'
```

### 6. Update Bio (Craftsmen Only)

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer CRAFTSMAN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Professional craftsman with 15+ years experience in electrical work and home automation systems."
  }'
```

## Profile Picture Updates

Profile picture updates are special - they don't count towards the single-field limit and can be combined with one other field:

### Profile Picture Only

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profilePicture=@/path/to/image.jpg"
```

### Profile Picture + One Field

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profilePicture=@/path/to/image.jpg" \
  -F "fullName=Updated Name"
```

## Error Cases

### 1. Multiple Fields Error

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmed Hassan",
    "phone": "+201234567890"
  }'
```

**Response:**

```json
{
  "success": false,
  "message": "Only one field can be updated at a time"
}
```

### 2. Verified Craftsman Name Update Error

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer VERIFIED_CRAFTSMAN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Different Name"
  }'
```

**Response:**

```json
{
  "success": false,
  "message": "Verified craftsmen cannot update their name"
}
```

### 3. No Fields Provided Error

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**

```json
{
  "success": false,
  "message": "At least one field must be provided for update"
}
```

## JavaScript/Frontend Examples

### Using Fetch API

```javascript
// Update single field
async function updateUserProfile(field, value) {
  try {
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ [field]: value })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Profile updated successfully:', result.data);
    } else {
      console.error('Update failed:', result.message);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Examples
updateUserProfile('fullName', 'Ahmed Hassan');
updateUserProfile('phone', '+201234567890');
updateUserProfile('bio', 'Professional craftsman...');
```

### Using Axios

```javascript
import axios from 'axios';

// Update single field
async function updateProfile(field, value) {
  try {
    const response = await axios.patch('/api/users/me',
      { [field]: value },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    console.log('Profile updated:', response.data);
  } catch (error) {
    console.error('Update failed:', error.response.data.message);
  }
}

// Profile picture with additional field
async function updateProfileWithPicture(file, additionalField = null) {
  const formData = new FormData();
  formData.append('profilePicture', file);

  if (additionalField) {
    formData.append(additionalField.key, additionalField.value);
  }

  try {
    const response = await axios.patch('/api/users/me', formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Profile updated:', response.data);
  } catch (error) {
    console.error('Update failed:', error.response.data.message);
  }
}
```

## Migration from v1.9.1

If you're upgrading from the previous version, here are the key changes you need to make:

### Before (v1.9.1)

```javascript
// Multiple fields allowed
fetch('/api/users/me', {
  method: 'PUT', // Old method
  body: JSON.stringify({
    fullName: 'New Name',
    phone: '+201234567890',
    address: { ... }
  })
});
```

### After (v1.9.2)

```javascript
// Only one field at a time
fetch('/api/users/me', {
  method: 'PATCH', // New method
  body: JSON.stringify({
    fullName: 'New Name' // Only one field
  })
});

// Multiple updates require multiple requests
await updateProfile('fullName', 'New Name');
await updateProfile('phone', '+201234567890');
await updateProfile('address', { ... });
```

## Best Practices

1. **Validate Client-Side**: Check that only one field is being updated before sending the request
2. **Handle Verification Status**: Check if the user is a verified craftsman before allowing name updates
3. **Use Proper Error Handling**: Always check the `success` field in the response
4. **Batch Updates Carefully**: If you need to update multiple fields, send separate requests
5. **Profile Pictures**: Remember that profile picture updates can be combined with one other field
