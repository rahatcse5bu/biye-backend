#!/bin/bash

# Groq AI Biodata Search - Test Examples
# Run these commands to test the AI biodata features

BASE_URL="http://localhost:5000"

# 1. Test AI Search
echo "=== Testing AI Biodata Search ==="
curl -X POST $BASE_URL/api/v1/ai-biodata/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find me a Muslim, educated girl aged 24-28 from Dhaka with tech background",
    "context": "Available profiles from database"
  }' | json_pp

echo "\n"

# 2. Test Parse Biodata Form
echo "=== Testing Biodata Form Parser ==="
curl -X POST $BASE_URL/api/v1/ai-biodata/parse \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "full_name": "Fatima Khan",
      "age": "26",
      "height": "5 feet 4 inches",
      "religion": "Islam",
      "occupation": "Software Engineer",
      "education": "Bachelors in Computer Science",
      "city": "Dhaka",
      "interests": "Reading, Traveling, Cooking"
    }
  }' | json_pp

echo "\n"

# 3. Test Summary Generation
echo "=== Testing Summary Generation ==="
curl -X POST $BASE_URL/api/v1/ai-biodata/summary \
  -H "Content-Type: application/json" \
  -d '{
    "biodataDetails": {
      "name": "Amar Khan",
      "age": 32,
      "education": "MBA",
      "occupation": "Business Analyst",
      "height": "6 feet",
      "religion": "Islam",
      "family_status": "Middle class",
      "interests": ["Technology", "Travel", "Sports"],
      "looking_for": "A caring, educated woman"
    }
  }' | json_pp

echo "\n"

# 4. Test Compatibility Check
echo "=== Testing Compatibility Check ==="
curl -X POST $BASE_URL/api/v1/ai-biodata/compatibility \
  -H "Content-Type: application/json" \
  -d '{
    "biodata1": {
      "name": "Rahim Ahmed",
      "age": 28,
      "religion": "Islam",
      "education": "Bachelor in Engineering",
      "occupation": "Software Engineer",
      "city": "Dhaka",
      "height": "5.10",
      "family_income": "50000+"
    },
    "biodata2": {
      "name": "Aisha Hassan",
      "age": 26,
      "religion": "Islam",
      "education": "Bachelor in Business",
      "occupation": "Marketing Manager",
      "city": "Dhaka",
      "height": "5.4",
      "family_income": "30000+"
    }
  }' | json_pp

echo "\n"

# 5. Test Direct Chat
echo "=== Testing Direct Chat ==="
curl -X POST $BASE_URL/api/v1/ai-biodata/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "system",
        "content": "You are a matrimony compatibility expert. Provide brief, helpful advice."
      },
      {
        "role": "user",
        "content": "What should I look for in a life partner?"
      }
    ],
    "model": "mixtral-8x7b-32768",
    "temperature": 0.7,
    "max_tokens": 1024
  }' | json_pp

echo "\n✅ All tests completed!"
