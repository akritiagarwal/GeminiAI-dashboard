#!/bin/bash

# Daily Data Collection Script for Gemini API PM Dashboard
# Run this script manually every day to collect fresh data

echo "🚀 Starting Daily Data Collection for Gemini API PM Dashboard"
echo "📅 $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the gemini-pm-dashboard directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found. Please create it with your Supabase credentials."
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Run the collection script
echo "🔍 Running data collection..."
npx tsx scripts/daily-data-collection.ts

echo ""
echo "✅ Daily collection completed!"
echo "📊 Check your dashboard at http://localhost:3002 to see the new data" 