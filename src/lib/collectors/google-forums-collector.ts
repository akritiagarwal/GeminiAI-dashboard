import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@/lib/supabase/client';

interface DiscourseResponse {
  topic_list?: {
    topics: {
      id: number;
      title: string;
      slug: string;
      created_at: string;
      last_posted_at: string;
      reply_count: number;
      views: number;
      last_poster_username: string;
      excerpt: string;
      category_id: number;
      tags: string[];
    }[];
  };
  // Add other potential properties if needed
}

export class GoogleForumsCollector {
  private baseUrl = 'https://discuss.ai.google.dev'
  private tags = [
    'gemini-api', 'api', 'gemini-15', 'gemini-25'
  ]
  private categories = [
    'gemini-api'
  ]

  async collectFromForum(): Promise<any[]> {
    console.log('🔍 Starting Google Forum collection...')
    const allPosts: any[] = []
    const seenIds = new Set<string>()

    // Collect from tags
    for (const tag of this.tags) {
      try {
        console.log(`Fetching Google Forum tag: ${tag}`)
        const tagPosts = await this.fetchTaggedPosts(tag)
        
        for (const post of tagPosts) {
          if (!seenIds.has(post.id)) {
            seenIds.add(post.id)
            allPosts.push(post)
          }
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error fetching tag ${tag}:`, error)
        continue
      }
    }

    console.log(`✅ Collected ${allPosts.length} unique posts from Google Forum`)
    
    // Filter for recent and relevant posts
    const recentPosts = allPosts.filter(post => {
      const postDate = new Date(post.timestamp)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return postDate > weekAgo
    })

    console.log(`✅ Found ${recentPosts.length} recent Google Forum posts`)
    return recentPosts
  }

  private async fetchTaggedPosts(tag: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/tag/${tag}.json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Gemini API Sentiment Monitor)'
        },
        timeout: 10000
      })

      const data = response.data as DiscourseResponse
      const topics = data.topic_list?.topics || []
      
      console.log(`Fetched ${topics.length} topics for tag ${tag}`)
      
      const recentTopics = topics.filter(topic => {
        const topicDate = new Date(topic.created_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return topicDate > weekAgo
      })

      console.log(`Found ${recentTopics.length} recent posts for tag ${tag}`)
      
      if (recentTopics.length > 0) {
        console.log(`Sample posts for tag ${tag}:`)
        recentTopics.slice(0, 3).forEach(topic => {
          console.log(`- ${topic.title} (ID: ${topic.id}, Replies: ${topic.reply_count}, Views: ${topic.views})`)
        })
      }

      return recentTopics.map(topic => ({
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
          category: topic.category_id,
          source_id: topic.id.toString()
        }
      }))

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`Tag ${tag} not found (404), skipping...`)
        return []
      }
      throw error
    }
  }

  async storeInSupabase(data: any[]) {
    const supabase = createClient()
    
    if (data.length === 0) {
      console.log('No Google Forum data to store')
      return
    }

    const feedbackToInsert = data.map(item => ({
      platform: 'google_forum',
      content: item.content,
      author: item.author,
      url: item.url,
      timestamp: item.timestamp,
      metadata: { ...item.metadata, source: 'google_forum' },
      raw_data: item
    }))

    const { data: insertedData, error } = await supabase
      .from('developer_feedback')
      .insert(feedbackToInsert)
      .select()

    if (error) {
      console.error('❌ Error inserting forum data:', error)
    } else {
      console.log(`✅ Inserted ${insertedData?.length || 0} forum posts`)
    }
  }
} 