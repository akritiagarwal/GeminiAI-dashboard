import { redditCollector } from './reddit'

async function testRedditCollector() {
  console.log('Testing Reddit collector...')
  
  try {
    // Test getting last collection time
    const lastCollection = await redditCollector.getLastCollectionTime()
    console.log('Last collection time:', lastCollection)
    
    // Test a small collection (just one subreddit, one term)
    console.log('Testing small collection...')
    const result = await redditCollector.collectData()
    console.log('Collection result:', result)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testRedditCollector()
}

export { testRedditCollector } 