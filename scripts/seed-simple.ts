#!/usr/bin/env node

async function seedSimpleData() {
  console.log('🚀 Starting simplified data seeding...');
  console.log('📊 This will seed:');
  console.log('   - Google Forum posts (real data)');
  console.log('   - Recent Gemini API news');
  console.log('   - Sentiment analysis');
  console.log('');
  
  try {
    // Use the new real data endpoint
    const response = await fetch('http://localhost:3003/api/seed/real-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Seeding complete!');
    console.log(`📈 Forum posts: ${result.forumCount}`);
    console.log(`📰 News items: ${result.newsCount}`);
    console.log(`📊 Total items: ${result.totalCount}`);
    console.log('🚀 Your dashboard now has real, meaningful data!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   1. Your Next.js server is running (npm run dev)');
    console.log('   2. Your environment variables are set');
    console.log('   3. Your Supabase database is connected');
  }
}

// Run the seeding
seedSimpleData(); 