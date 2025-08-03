#!/usr/bin/env bash

# Test script for image upload endpoint

# Check if required parameters are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <JWT_TOKEN> <CHAT_ID>"
    echo "Example: $0 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' '688f72b36b407272cc0238b1'"
    exit 1
fi

JWT_TOKEN="$1"
CHAT_ID="$2"

# Create a test image (simple 1x1 pixel PNG)
echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0K4y9wAAAABJRU5ErkJggg==" | base64 -d > test-image.png

echo "📸 Testing image upload to chat: $CHAT_ID"
echo "🔑 Using JWT: ${JWT_TOKEN:0:20}..."

# Test the image upload endpoint
echo "📤 Uploading test image..."
curl -X POST "http://localhost:5000/api/messages/chats/$CHAT_ID/upload-image" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "image=@test-image.png" \
  -v

# Clean up
rm -f test-image.png

echo ""
echo "✅ Test completed!"
echo "💡 Check the server logs to see if the image was uploaded to Cloudinary"
