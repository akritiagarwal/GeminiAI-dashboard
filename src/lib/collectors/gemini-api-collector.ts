import axios from 'axios'
import { createClient } from '@/lib/supabase/server'

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

export class GeminiAPICollector {
  private baseUrl = 'https://discuss.ai.google.dev'

  async collectFromGeminiAPICategory(): Promise<any[]> {
    console.log('🔍 Collecting from Gemini API category...')
    
    try {
      // Fetch the Gemini API category page
      const response = await axios.get(`${this.baseUrl}/c/gemini-api/4.json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Gemini API Sentiment Monitor)'
        },
        timeout: 10000
      })

      const data = response.data as DiscourseResponse
      const topics = data.topic_list?.topics || []
      
      console.log(`✅ Fetched ${topics.length} topics from Gemini API category`)
      
      // Filter for posts from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentTopics = topics.filter(topic => {
        const topicDate = new Date(topic.created_at)
        return topicDate > sevenDaysAgo
      })

      console.log(`✅ Found ${recentTopics.length} recent topics (last 7 days)`)
      
      if (recentTopics.length > 0) {
        console.log('📋 Sample recent topics:')
        recentTopics.slice(0, 5).forEach(topic => {
          console.log(`- ${topic.title} (ID: ${topic.id}, Replies: ${topic.reply_count}, Views: ${topic.views})`)
        })
      }

      // Transform to our format
      const transformedTopics = recentTopics.map(topic => ({
        id: topic.id.toString(),
        content: topic.excerpt || topic.title,
        author: topic.last_poster_username || 'unknown',
        url: `${this.baseUrl}/t/${topic.slug}/${topic.id}`,
        timestamp: topic.created_at,
        metadata: {
          title: topic.title,
          replies: topic.reply_count,
          views: topic.views,
          tags: topic.tags || [],
          category: 'gemini-api',
          source_id: topic.id.toString(),
          last_posted: topic.last_posted_at
        }
      }))

      return transformedTopics

    } catch (error) {
      console.error('❌ Error fetching Gemini API category:', error)
      return []
    }
  }

  async storeInSupabase(data: any[]) {
    const supabase = await createClient()
    
    if (data.length === 0) {
      console.log('No Gemini API data to store')
      return
    }

    const feedbackToInsert = data.map(item => ({
      platform: 'google_forum', // Now using the correct platform
      content: item.content,
      author: item.author,
      url: item.url,
      timestamp: item.timestamp,
      metadata: { ...item.metadata, source: 'gemini_api_category' }
    }))

    const { data: insertedData, error } = await supabase
      .from('developer_feedback')
      .insert(feedbackToInsert)
      .select()

    if (error) {
      console.error('❌ Error inserting Gemini API data:', error)
      throw error
    } else {
      console.log(`✅ Inserted ${insertedData?.length || 0} Gemini API posts`)
      return insertedData
    }
  }
}
