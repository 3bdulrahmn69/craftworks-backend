# API Usage Examples

## 1. Getting User Profile with Verification Status

### Request

```http
GET /api/users/64a7b8f5e1234567890abcde
Authorization: Bearer your-jwt-token
```

### Response for Verified Craftsman

```json
{
  "success": true,
  "data": {
    "id": "64a7b8f5e1234567890abcde",
    "email": "ahmed.hassan@example.com",
    "fullName": "Ahmed Hassan",
    "role": "craftsman",
    "profilePicture": "https://res.cloudinary.com/your-cloud/image/upload/v1691234567/profile-images/ahmed.webp",
    "rating": 4.8,
    "ratingCount": 25,
    "isVerified": true,
    "service": {
      "_id": "64a7b8f5e1234567890abcdf",
      "name": "Plumbing Services",
      "icon": "plumbing-icon.svg",
      "description": "Professional plumbing services"
    },
    "createdAt": "2023-07-07T10:30:00.000Z"
  },
  "message": "User profile retrieved successfully"
}
```

### Response for Client (No Verification Status)

```json
{
  "success": true,
  "data": {
    "id": "64a7b8f5e1234567890abcde",
    "email": "sara.ahmed@example.com",
    "fullName": "Sara Ahmed",
    "role": "client",
    "profilePicture": "https://res.cloudinary.com/your-cloud/image/upload/v1691234567/profile-images/sara.webp",
    "createdAt": "2023-07-07T10:30:00.000Z"
  },
  "message": "User profile retrieved successfully"
}
```

## 2. Submitting Verification Documents with Files

### Frontend JavaScript Example

```javascript
async function submitVerificationWithFiles() {
  const formData = new FormData();

  // Get file inputs from DOM
  const idCardFront = document.getElementById('idCardFront').files[0];
  const idCardBack = document.getElementById('idCardBack').files[0];
  const license = document.getElementById('license').files[0];

  // Add files
  formData.append('verificationDocs', idCardFront);
  formData.append('verificationDocs', idCardBack);
  formData.append('verificationDocs', license);

  // Add document metadata
  formData.append('docNames[]', 'National ID Card - Front');
  formData.append('docNames[]', 'National ID Card - Back');
  formData.append('docNames[]', 'Professional License');

  formData.append('docTypes[]', 'ID-Card');
  formData.append('docTypes[]', 'ID-Card');
  formData.append('docTypes[]', 'Professional-License');

  // Optional: Add service ID and portfolio images
  formData.append('service', '64a7b8f5e1234567890abcdf'); // Service ID (optional)
  formData.append('portfolioImageUrls[]', 'https://example.com/portfolio1.jpg'); // Optional

  try {
    const response = await fetch('/api/users/craftsman/verification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      console.log('Verification submitted successfully!', result.data);
      // Handle success (e.g., show success message, redirect)
    } else {
      console.error('Verification failed:', result.message);
      // Handle error (e.g., show error message)
    }
  } catch (error) {
    console.error('Network error:', error);
    // Handle network error
  }
}
```

### React Example with File Upload

```jsx
import React, { useState } from 'react';

function VerificationForm() {
  const [files, setFiles] = useState({
    idCardFront: null,
    idCardBack: null,
    license: null
  });
  const [formData, setFormData] = useState({
    service: '',
    portfolioImageUrls: []
  });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (fileType, file) => {
    setFiles(prev => ({ ...prev, [fileType]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();

    // Add files
    if (files.idCardFront) submitData.append('verificationDocs', files.idCardFront);
    if (files.idCardBack) submitData.append('verificationDocs', files.idCardBack);
    if (files.license) submitData.append('verificationDocs', files.license);

    // Add metadata
    const docNames = [];
    const docTypes = [];

    if (files.idCardFront) {
      docNames.push('National ID Card - Front');
      docTypes.push('ID-Card');
    }
    if (files.idCardBack) {
      docNames.push('National ID Card - Back');
      docTypes.push('ID-Card');
    }
    if (files.license) {
      docNames.push('Professional License');
      docTypes.push('Professional-License');
    }

    docNames.forEach(name => submitData.append('docNames[]', name));
    docTypes.forEach(type => submitData.append('docTypes[]', type));

    // Add optional form data
    if (formData.service) submitData.append('service', formData.service);
    formData.portfolioImageUrls.forEach(url =>
      url && submitData.append('portfolioImageUrls[]', url)
    );

    try {
      const response = await fetch('/api/users/craftsman/verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        alert('Verification submitted successfully!');
        // Reset form or redirect
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>ID Card Front:</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileChange('idCardFront', e.target.files[0])}
        />
      </div>

      <div>
        <label>ID Card Back:</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileChange('idCardBack', e.target.files[0])}
        />
      </div>

      <div>
        <label>Professional License:</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileChange('license', e.target.files[0])}
        />
      </div>

      {/* Optional service and portfolio fields can be added here */}

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Verification'}
      </button>
    </form>
  );
}
```

### cURL Example

```bash
curl -X POST "http://localhost:5000/api/users/craftsman/verification" \
  -H "Authorization: Bearer your-jwt-token-here" \
  -F "verificationDocs=@/path/to/id-card-front.jpg" \
  -F "verificationDocs=@/path/to/id-card-back.jpg" \
  -F "verificationDocs=@/path/to/license.pdf" \
  -F "docNames[]=National ID Card - Front" \
  -F "docNames[]=National ID Card - Back" \
  -F "docNames[]=Professional License" \
  -F "docTypes[]=ID-Card" \
  -F "docTypes[]=ID-Card" \
  -F "docTypes[]=Professional-License" \
  -F "service=64a7b8f5e1234567890abcdf"
```

## Error Responses

### Missing Files

```json
{
  "success": false,
  "message": "At least one verification document file is required"
}
```

### Mismatched Arrays

```json
{
  "success": false,
  "message": "Number of files, document names, and document types must match"
}
```

### File Upload Error

```json
{
  "success": false,
  "message": "Failed to upload National ID Card - Front"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "At least one skill is required, All document names must be non-empty strings"
}
```
