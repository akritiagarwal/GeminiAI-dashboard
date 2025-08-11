#!/usr/bin/env node

async function seedRealData() {
  console.log('🚀 Starting comprehensive real data collection...');
  console.log('📊 This will collect data from:');
  console.log('   - Reddit (multiple subreddits)');
  console.log('   - Google AI Forums');
  console.log('   - Hacker News');
  console.log('   - Dev.to');
  console.log('   - Analyze with Gemini AI');
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3003/api/collect/all', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Collection complete!');
    console.log(`📈 Total collected: ${result.collected}`);
    console.log(`🧠 Analyzed with AI: ${result.analyzed}`);
    console.log('');
    console.log('📊 Breakdown by platform:');
    console.log(`   Reddit: ${result.breakdown.reddit}`);
    console.log(`   Google Forums: ${result.breakdown.google_forums}`);
    console.log(`   Hacker News: ${result.breakdown.hackernews}`);
    console.log(`   Dev.to: ${result.breakdown.devto}`);
    console.log('');
    console.log('🎉 Your dashboard now has real, meaningful data!');
    
  } catch (error) {
    console.error('❌ Error during collection:', error);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   1. Your Next.js server is running (npm run dev)');
    console.log('   2. Your environment variables are set');
    console.log('   3. Your Supabase database is connected');
  }
}

// Run the seeding
seedRealData(); 