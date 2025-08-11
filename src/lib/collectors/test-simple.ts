// Simple test to verify Reddit API connectivity
async function testRedditAPI() {
  console.log('Testing Reddit API connectivity...')
  
  const testUrl = 'https://www.reddit.com/r/MachineLearning/search.json?q=gemini+api&sort=new&limit=5'
  
  try {
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'GeminiPMDashboard/1.0 (by /u/test)'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Reddit API test successful!')
      console.log('Found', data.data.children.length, 'posts')
      
      if (data.data.children.length > 0) {
        const firstPost = data.data.children[0].data
        console.log('Sample post:', {
          title: firstPost.title,
          author: firstPost.author,
          score: firstPost.score,
          subreddit: firstPost.subreddit
        })
      }
    } else {
      console.log('❌ Reddit API test failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Reddit API test error:', error)
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('\nTesting environment variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'REDDIT_USER_AGENT'
  ]
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
    } else {
      console.log(`❌ ${varName}: Not set`)
    }
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Running simple tests...\n')
  
  testEnvironmentVariables()
  await testRedditAPI()
  
  console.log('\n✅ Tests completed!')
}

// Export for use in other files
export { testRedditAPI, testEnvironmentVariables, runTests }

// Run if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runTests()
} 