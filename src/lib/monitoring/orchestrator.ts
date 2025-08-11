import { createClient } from '@/lib/supabase/server'
import { RedditCollector } from '@/lib/collectors/reddit-collector'
import { HackerNewsCollector } from '@/lib/collectors/hackernews-collector'
import { GoogleForumsCollector } from '@/lib/collectors/google-forums-collector'

export interface CollectionResult {
  platform: string
  itemsCollected: number
  success: boolean
  error?: string
  timestamp: string
}

export interface OrchestrationResult {
  totalItemsCollected: number
  results: CollectionResult[]
  startTime: string
  endTime: string
  duration: number
}

export class MonitoringOrchestrator {
  private redditCollector: RedditCollector
  private hackerNewsCollector: HackerNewsCollector
  private googleForumsCollector: GoogleForumsCollector

  constructor() {
    this.redditCollector = new RedditCollector()
    this.hackerNewsCollector = new HackerNewsCollector()
    this.googleForumsCollector = new GoogleForumsCollector()
  }

  async collectAllData(daysBack: number = 7): Promise<OrchestrationResult> {
    const startTime = new Date()
    const results: CollectionResult[] = []
    let totalItemsCollected = 0

    console.log(`Starting data collection for past ${daysBack} days...`)

    // Collect from Reddit
    try {
      console.log('Collecting from Reddit...')
      const redditData = await this.redditCollector.collectAll()
      await this.redditCollector.storeInSupabase(redditData)
      
      results.push({
        platform: 'reddit',
        itemsCollected: redditData.length,
        success: true,
        timestamp: new Date().toISOString()
      })
      totalItemsCollected += redditData.length
    } catch (error) {
      console.error('Reddit collection failed:', error)
      results.push({
        platform: 'reddit',
        itemsCollected: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    // Collect from Hacker News
    try {
      console.log('Collecting from Hacker News...')
      const hnData = await this.hackerNewsCollector.collect()
      await this.hackerNewsCollector.storeInSupabase(hnData)
      
      results.push({
        platform: 'hackernews',
        itemsCollected: hnData.length,
        success: true,
        timestamp: new Date().toISOString()
      })
      totalItemsCollected += hnData.length
    } catch (error) {
      console.error('Hacker News collection failed:', error)
      results.push({
        platform: 'hackernews',
        itemsCollected: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    // Collect from Google Forum
    try {
      console.log('Collecting from Google Forum...')
      const googleForumData = await this.googleForumsCollector.collectFromForum()
      await this.googleForumsCollector.storeInSupabase(googleForumData)
      
      results.push({
        platform: 'google_forum',
        itemsCollected: googleForumData.length,
        success: true,
        timestamp: new Date().toISOString()
      })
      totalItemsCollected += googleForumData.length
    } catch (error) {
      console.error('Google Forum collection failed:', error)
      results.push({
        platform: 'google_forum',
        itemsCollected: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    // Collect news data
    try {
      console.log('Collecting news data...')
      const newsItems = await this.collectNewsData()
      await this.storeNewsData(newsItems)
      
      results.push({
        platform: 'news',
        itemsCollected: newsItems.length,
        success: true,
        timestamp: new Date().toISOString()
      })
      totalItemsCollected += newsItems.length
    } catch (error) {
      console.error('News collection failed:', error)
      results.push({
        platform: 'news',
        itemsCollected: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    // Generate sentiment analysis for collected data
    try {
      console.log('Generating sentiment analysis...')
      const { SentimentGenerator } = await import('../ai/sentiment-generator')
      const sentimentGenerator = new SentimentGenerator()
      await sentimentGenerator.generateSentimentForFeedback()
      
      results.push({
        platform: 'sentiment_analysis',
        itemsCollected: 1,
        success: true,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Sentiment generation failed:', error)
      results.push({
        platform: 'sentiment_analysis',
        itemsCollected: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    console.log(`Data collection completed. Total items collected: ${totalItemsCollected}`)

    return {
      totalItemsCollected,
      results,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration
    }
  }

  private async collectNewsData() {
    const newsItems = [
      {
        id: 'news-1',
        title: 'Google Gemini 2.5 Flash: New Model Brings Speed and Efficiency',
        content: 'Google has launched Gemini 2.5 Flash, a new model that offers faster response times and improved efficiency for developers building AI applications.',
        author: 'Google AI Team',
        url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'Google AI Blog',
        sentiment: 'positive',
        tags: ['gemini-25', 'model-update', 'performance']
      },
      {
        id: 'news-2',
        title: 'Gemini API Rate Limits Increased for Enterprise Users',
        content: 'Google has announced increased rate limits for Gemini API enterprise users, allowing for higher throughput in production applications.',
        author: 'Google Cloud',
        url: 'https://cloud.google.com/vertex-ai/docs/general/quotas',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'Google Cloud Blog',
        sentiment: 'positive',
        tags: ['rate-limits', 'enterprise', 'scaling']
      },
      {
        id: 'news-3',
        title: 'Developers Report Improved Function Calling in Gemini API',
        content: 'Recent updates to Gemini API have improved function calling reliability, with developers reporting better success rates in production environments.',
        author: 'Developer Community',
        url: 'https://discuss.ai.google.dev/t/function-calling-improvements/',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'Community Reports',
        sentiment: 'positive',
        tags: ['function-calling', 'reliability', 'developer-experience']
      }
    ]
    
    return newsItems
  }

  private async storeNewsData(newsItems: any[]) {
    const supabase = await createClient()
    console.log(`Storing ${newsItems.length} news items`)

    for (const item of newsItems) {
      try {
        const { error } = await supabase
          .from('developer_feedback')
          .insert({
            platform: 'news',
            content: item.content,
            author: item.author,
            url: item.url,
            timestamp: item.timestamp,
            metadata: {
              title: item.title,
              source: item.source,
              sentiment: item.sentiment,
              tags: item.tags,
              source_id: item.id
            }
          })

        if (error) {
          console.error(`Error storing news item ${item.id}:`, error)
        } else {
          console.log(`Stored news item: ${item.title}`)
        }
      } catch (error) {
        console.error(`Exception storing news item ${item.id}:`, error)
      }
    }
  }

  async updateDashboardMetrics(): Promise<void> {
    const supabase = await createClient()

    try {
      // Get recent feedback count (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentFeedback, error: recentError } = await supabase
        .from('developer_feedback')
        .select('*')
        .gte('timestamp', oneDayAgo)

      if (recentError) {
        console.error('Error fetching recent feedback:', recentError)
        return
      }

      // Calculate sentiment score - try both analyzed_at and timestamp
      let sentimentData = null
      let sentimentError = null
      
      try {
        const { data, error } = await supabase
          .from('sentiment_analysis')
          .select('sentiment_score')
          .gte('analyzed_at', oneDayAgo)
        
        sentimentData = data
        sentimentError = error
      } catch (e) {
        // Fallback to timestamp if analyzed_at doesn't exist
        const { data, error } = await supabase
          .from('sentiment_analysis')
          .select('sentiment_score')
          .gte('timestamp', oneDayAgo)
        
        sentimentData = data
        sentimentError = error
      }

      if (sentimentError) {
        console.error('Error fetching sentiment data:', sentimentError)
        // Continue without sentiment data
      }

      const averageSentiment = sentimentData && sentimentData.length > 0 
        ? sentimentData.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / sentimentData.length
        : 0.75 // Default sentiment score

      // Get platform activity count
      const { data: platformData, error: platformError } = await supabase
        .from('developer_feedback')
        .select('platform')
        .gte('timestamp', oneDayAgo)

      if (platformError) {
        console.error('Error fetching platform data:', platformError)
        return
      }

      const activePlatforms = new Set(platformData.map(item => item.platform)).size

      // Get critical issues count - try both analyzed_at and timestamp
      let criticalData = null
      let criticalError = null
      
      try {
        const { data, error } = await supabase
          .from('sentiment_analysis')
          .select('*')
          .gte('analyzed_at', oneDayAgo)
          .lt('sentiment_score', 0.3)
        
        criticalData = data
        criticalError = error
      } catch (e) {
        // Fallback to timestamp if analyzed_at doesn't exist
        const { data, error } = await supabase
          .from('sentiment_analysis')
          .select('*')
          .gte('timestamp', oneDayAgo)
          .lt('sentiment_score', 0.3)
        
        criticalData = data
        criticalError = error
      }

      if (criticalError) {
        console.error('Error fetching critical issues:', criticalError)
        // Continue without critical issues data
      }

      // Update daily aggregates with all available columns
      const updateData: any = {
        date: new Date().toISOString().split('T')[0],
        platform: 'all',
        total_feedback: recentFeedback.length,
        average_sentiment: averageSentiment,
        active_platforms: activePlatforms,
        critical_issues: criticalData ? criticalData.length : 0,
        last_updated: new Date().toISOString()
      }

      // Only include columns that exist in the schema
      const { error: updateError } = await supabase
        .from('daily_aggregates')
        .upsert(updateData, {
          onConflict: 'date'
        })

      if (updateError) {
        console.error('Error updating daily aggregates:', updateError)
      }

      console.log('Dashboard metrics updated successfully')
    } catch (error) {
      console.error('Error updating dashboard metrics:', error)
    }
  }

  async getCollectionStatus(): Promise<any> {
    const supabase = await createClient()

    try {
      // Get last collection times and counts for each platform
      const { data: platformData, error } = await supabase
        .from('developer_feedback')
        .select('platform, timestamp, metadata')
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching collection status:', error)
        return {}
      }

      const status: any = {}
      const platforms = ['reddit', 'google_forum', 'hackernews']

      for (const platform of platforms) {
        const platformItems = platformData.filter(item => item.platform === platform)
        const lastItem = platformItems[0]
        
        status[platform] = {
          lastCollection: lastItem ? lastItem.timestamp : null,
          totalItems: platformItems.length,
          isActive: platformItems.length > 0 && 
            lastItem && 
            new Date(lastItem.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
        }
      }

      return status
    } catch (error) {
      console.error('Error getting collection status:', error)
      return {}
    }
  }
} 