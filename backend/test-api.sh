#!/bin/bash

# Simple API test script
# Usage: ./test-api.sh [BASE_URL]

BASE_URL=${1:-http://localhost:3000}

echo "🧪 Testing Airbnb Utilities API"
echo "Base URL: $BASE_URL"
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test login
echo "2️⃣ Testing login..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✅ Login successful!"
  echo "Token: ${TOKEN:0:50}..."
else
  echo "❌ Login failed!"
  exit 1
fi
echo ""

# Test get user info
echo "3️⃣ Testing get current user..."
curl -s "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test get landlords
echo "4️⃣ Testing get landlords..."
curl -s "$BASE_URL/api/landlords" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test get properties
echo "5️⃣ Testing get properties..."
curl -s "$BASE_URL/api/properties" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "✅ All tests completed!"
echo ""
echo "Your token (save this for further testing):"
echo "$TOKEN"
