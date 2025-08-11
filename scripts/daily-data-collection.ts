#!/usr/bin/env tsx

import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

interface DiscourseTopic {
  id: number
  title: string
  excerpt: string
  created_at: string
  last_posted_at: string
  reply_count: number
  views: number
  slug: string
  category_id: number
  tags: string[]
  last_poster_username: string
}

interface DiscourseResponse {
  topic_list: {
    topics: DiscourseTopic[]
  }
}

interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    author: string
    url: string
    created_utc: number
    score: number
    num_comments: number
    subreddit: string
    permalink: string
  }
}

interface RedditResponse {
  data: {
    children: RedditPost[]
  }
}

class DailyDataCollector {
  private supabase: any
  private baseUrl = 'https://discuss.ai.google.dev'
  private redditBaseUrl = 'https://www.reddit.com'

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async fetchDiscourseEndpoint(endpoint: string, source: string): Promise<any[]> {
    try {
      console.log(`🔍 Fetching: ${endpoint}`)
      
      const response = await axios.get(`${this.baseUrl}${endpoint}.json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Gemini API Sentiment Monitor)'
        },
        timeout: 10000
      })

      const data = response.data as DiscourseResponse
      const topics = data.topic_list?.topics || []
      
      console.log(`✅ Fetched ${topics.length} topics from ${source}`)
      
      // Filter for posts from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentTopics = topics.filter(topic => {
        const topicDate = new Date(topic.created_at)
        return topicDate > sevenDaysAgo
      })

      console.log(`✅ Found ${recentTopics.length} recent topics (last 7 days) from ${source}`)
      
      // Transform to our format
      const transformedTopics = recentTopics.map(topic => ({
        platform: 'google_forum',
        content: topic.excerpt || topic.title,
        author: topic.last_poster_username || 'unknown',
        url: `${this.baseUrl}/t/${topic.slug}/${topic.id}`,
        timestamp: topic.created_at,
        metadata: {
          title: topic.title,
          replies: topic.reply_count,
          views: topic.views,
          tags: topic.tags || [],
          category: source,
          source_id: topic.id.toString(),
          last_posted: topic.last_posted_at,
          source_endpoint: endpoint
        }
      }))

      return transformedTopics

    } catch (error) {
      console.error(`❌ Error fetching ${endpoint}:`, error)
      return []
    }
  }

  private async fetchRedditSubreddit(subreddit: string): Promise<any[]> {
    try {
      console.log(`🔍 Fetching Reddit: r/${subreddit}`)
      
      const response = await axios.get(`${this.redditBaseUrl}/r/${subreddit}/hot.json?limit=25`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Gemini API Sentiment Monitor)'
        },
        timeout: 10000
      })

      const data = response.data as RedditResponse
      const posts = data.data.children || []
      
      console.log(`✅ Fetched ${posts.length} posts from r/${subreddit}`)
      
      // Filter for posts from last 7 days
      const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 60 * 60
      const recentPosts = posts.filter(post => post.data.created_utc > sevenDaysAgo)

      console.log(`✅ Found ${recentPosts.length} recent posts (last 7 days) from r/${subreddit}`)
      
      // Transform to our format
      const transformedPosts = recentPosts.map(post => ({
        platform: 'reddit',
        content: post.data.selftext || post.data.title,
        author: post.data.author,
        url: `https://www.reddit.com${post.data.permalink}`,
        timestamp: new Date(post.data.created_utc * 1000).toISOString(),
        metadata: {
          title: post.data.title,
          score: post.data.score,
          comments: post.data.num_comments,
          subreddit: post.data.subreddit,
          source_id: post.data.id,
          source_url: post.data.url
        }
      }))

      return transformedPosts

    } catch (error) {
      console.error(`❌ Error fetching r/${subreddit}:`, error)
      return []
    }
  }

  private async storeInSupabase(data: any[]) {
    if (data.length === 0) {
      console.log('No data to store')
      return []
    }

    // Remove duplicates based on platform, content, and author
    const uniqueData = data.filter((item, index, self) => 
      index === self.findIndex(t => 
        t.platform === item.platform && 
        t.content === item.content && 
        t.author === item.author
      )
    )

    console.log(`📦 Storing ${uniqueData.length} unique items (removed ${data.length - uniqueData.length} duplicates)`)

    const { data: insertedData, error } = await this.supabase
      .from('developer_feedback')
      .insert(uniqueData)
      .select()

    if (error) {
      console.error('❌ Error inserting data:', error)
      throw error
    } else {
      console.log(`✅ Inserted ${insertedData?.length || 0} items`)
      return insertedData
    }
  }

  async collectAllData() {
    console.log('🚀 Starting daily data collection...')
    console.log('📅', new Date().toISOString())
    
    const allData: any[] = []
    
    // Google Forum endpoints
    const googleForumEndpoints = [
      { endpoint: '/c/ai-studio/8', source: 'ai-studio' },
      { endpoint: '/c/ai-studio/8/l/hot', source: 'ai-studio-hot' },
      { endpoint: '/tags/c/ai-studio/8/ai-studio', source: 'ai-studio-tagged' },
      { endpoint: '/tags/c/ai-studio/8/ai-studio/l/hot', source: 'ai-studio-tagged-hot' },
      { endpoint: '/tags/c/ai-studio/8/models', source: 'ai-studio-models' },
      { endpoint: '/tags/c/ai-studio/8/models/l/hot', source: 'ai-studio-models-hot' },
      { endpoint: '/tags/c/gemini-api/4/api', source: 'gemini-api' },
      { endpoint: '/tags/c/gemini-api/4/api/l/hot', source: 'gemini-api-hot' },
      { endpoint: '/tags/c/gemini-api/4/gemini-15', source: 'gemini-15' },
      { endpoint: '/tags/c/gemini-api/4/gemini-15/l/hot', source: 'gemini-15-hot' },
      { endpoint: '/tags/c/gemini-api/4/gemini-flash', source: 'gemini-flash' },
      { endpoint: '/tags/c/gemini-api/4/gemini-flash/l/hot', source: 'gemini-flash-hot' },
      { endpoint: '/tags/c/gemini-api/4/bug', source: 'gemini-api-bugs' },
      { endpoint: '/tags/c/gemini-api/4/bug/l/hot', source: 'gemini-api-bugs-hot' },
      { endpoint: '/tags/c/ai-studio/8/bug', source: 'ai-studio-bugs' },
      { endpoint: '/tags/c/ai-studio/8/bug/l/hot', source: 'ai-studio-bugs-hot' },
      { endpoint: '/tag/prompt', source: 'prompt-tag' },
      { endpoint: '/tag/prompt/l/hot', source: 'prompt-tag-hot' }
    ]

    // Reddit subreddits
    const redditSubreddits = [
      'GeminiAI',
      'GoogleAIStudio', 
      'ChatGPT',
      'GrokAI',
      'GoogleGeminiAI'
    ]

    console.log('\n📊 Collecting Google Forum data...')
    for (const { endpoint, source } of googleForumEndpoints) {
      const data = await this.fetchDiscourseEndpoint(endpoint, source)
      allData.push(...data)
      await this.delay(1000) // Rate limiting
    }

    console.log('\n📊 Collecting Reddit data...')
    for (const subreddit of redditSubreddits) {
      const data = await this.fetchRedditSubreddit(subreddit)
      allData.push(...data)
      await this.delay(2000) // Reddit rate limiting
    }

    console.log(`\n📦 Total collected: ${allData.length} items`)
    
    if (allData.length > 0) {
      console.log('\n💾 Storing data in database...')
      await this.storeInSupabase(allData)
    }

    // Generate summary
    const platformCounts = allData.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📈 Collection Summary:')
    console.log('Platform counts:', platformCounts)
    console.log('✅ Daily data collection completed!')
    
    return {
      totalCollected: allData.length,
      platformCounts,
      timestamp: new Date().toISOString()
    }
  }
}

// Main execution
async function main() {
  try {
    const collector = new DailyDataCollector()
    const result = await collector.collectAllData()
    console.log('\n🎉 Script completed successfully!')
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { DailyDataCollector } 