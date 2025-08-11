import { createClient } from '@/lib/supabase/server'
import type { Platform } from '@/types'

interface HNStory {
  id: number
  deleted?: boolean
  type: string
  by: string
  time: number
  text?: string
  dead?: boolean
  parent?: number
  poll?: number
  kids?: number[]
  url?: string
  score: number
  title: string
  parts?: number[]
  descendants?: number
}

interface HNComment {
  id: number
  deleted?: boolean
  type: string
  by: string
  time: number
  text?: string
  dead?: boolean
  parent: number
  kids?: number[]
  score?: number
}

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0'

class HackerNewsCollector {
  private lastRequestTime = 0
  private readonly rateLimitDelay = 100 // 100ms between requests
  private cache = new Map<number, HNStory | HNComment>()

  private async rateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      )
    }
    this.lastRequestTime = Date.now()
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.rateLimit()
        const response = await fetch(url)
        
        if (response.ok) {
          return response
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
      }
    }
    throw new Error('Max retries exceeded')
  }

  private async getItem<T>(id: number): Promise<T | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id) as T
    }

    const url = `${HN_API_BASE}/item/${id}.json`
    const response = await this.fetchWithRetry(url)
    const data: T = await response.json()
    
    // Cache the result
    this.cache.set(id, data as HNStory | HNComment)
    
    return data
  }

  private async getTopStories(): Promise<number[]> {
    const url = `${HN_API_BASE}/topstories.json`
    const response = await this.fetchWithRetry(url)
    return await response.json()
  }

  private async getNewStories(): Promise<number[]> {
    const url = `${HN_API_BASE}/newstories.json`
    const response = await this.fetchWithRetry(url)
    return await response.json()
  }

  private isRelevantContent(content: string): boolean {
    const searchTerms = [
      'gemini',
      'openai',
      'claude',
      'anthropic',
      'chatgpt',
      'gpt-4',
      'gpt-3',
      'vertex ai',
      'google ai',
      'ai api',
      'machine learning',
      'artificial intelligence'
    ]
    
    const lowerContent = content.toLowerCase()
    return searchTerms.some(term => lowerContent.includes(term))
  }

  private async getCommentsRecursive(commentIds: number[], depth = 0): Promise<HNComment[]> {
    if (depth > 3) return [] // Limit recursion depth
    
    const comments: HNComment[] = []
    
    // Fetch comments in parallel (with rate limiting)
    const commentPromises = commentIds.map(async (id) => {
      const comment = await this.getItem<HNComment>(id)
      return comment
    })
    
    const resolvedComments = await Promise.all(commentPromises)
    
    for (const comment of resolvedComments) {
      if (comment && !comment.deleted && !comment.dead && comment.text) {
        comments.push(comment)
        
        // Recursively get child comments
        if (comment.kids && comment.kids.length > 0) {
          const childComments = await this.getCommentsRecursive(comment.kids, depth + 1)
          comments.push(...childComments)
        }
      }
    }
    
    return comments
  }

  private async storeFeedback(
    content: string,
    author: string,
    authorReputation: number,
    url: string,
    threadTitle: string,
    timestamp: number,
    metadata: Record<string, unknown>
  ) {
    const supabase = await createClient()
    
    const feedbackData = {
      platform: 'hackernews' as Platform,
      content: content.substring(0, 10000), // Limit content length
      author,
      author_reputation: authorReputation,
      url,
      thread_title: threadTitle,
      timestamp: new Date(timestamp * 1000).toISOString(),
      collected_at: new Date().toISOString(),
      metadata
    }

    const { error } = await supabase
      .from('developer_feedback')
      .insert(feedbackData)

    if (error) {
      console.error('Error storing Hacker News feedback:', error)
      throw error
    }
  }

  async collectData(): Promise<{ stories: number; comments: number; errors: number }> {
    let totalStories = 0
    const totalComments = 0
    let totalErrors = 0

    console.log('Starting Hacker News data collection...')

    try {
      // Get top stories
      console.log('Fetching top stories...')
      const topStoryIds = await this.getTopStories()
      const topStories = await this.processStories(topStoryIds.slice(0, 50)) // Limit to top 50
      totalStories += topStories

      // Get new stories
      console.log('Fetching new stories...')
      const newStoryIds = await this.getNewStories()
      const newStories = await this.processStories(newStoryIds.slice(0, 50)) // Limit to top 50
      totalStories += newStories

    } catch (error) {
      console.error('Error in Hacker News collection:', error)
      totalErrors++
    }

    console.log(`Hacker News collection complete: ${totalStories} stories, ${totalComments} comments, ${totalErrors} errors`)
    return { stories: totalStories, comments: totalComments, errors: totalErrors }
  }

  private async processStories(storyIds: number[]): Promise<number> {
    let processedStories = 0

    for (const storyId of storyIds) {
      try {
        const story = await this.getItem<HNStory>(storyId)
        
        if (!story || story.deleted || story.dead || story.type !== 'story') {
          continue
        }

        // Check if story is relevant
        const content = `${story.title} ${story.text || ''}`
        if (!this.isRelevantContent(content)) {
          continue
        }

        // Store story
        await this.storeFeedback(
          story.text || story.title,
          story.by,
          story.score,
          story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          story.title,
          story.time,
          {
            story_id: story.id,
            score: story.score,
            descendants: story.descendants || 0,
            url: story.url,
            type: 'story'
          }
        )
        processedStories++

        // Get and store comments
        if (story.kids && story.kids.length > 0) {
          const comments = await this.getCommentsRecursive(story.kids)
          
          for (const comment of comments) {
            try {
              if (comment.text && this.isRelevantContent(comment.text)) {
                await this.storeFeedback(
                  comment.text,
                  comment.by,
                  comment.score || 1,
                  `https://news.ycombinator.com/item?id=${comment.id}`,
                  story.title,
                  comment.time,
                  {
                    comment_id: comment.id,
                    story_id: story.id,
                    parent_id: comment.parent,
                    score: comment.score || 1,
                    type: 'comment'
                  }
                )
              }
            } catch (error) {
              console.error('Error storing comment:', error)
            }
          }
        }

      } catch (error) {
        console.error(`Error processing story ${storyId}:`, error)
      }
    }

    return processedStories
  }

  async getLastCollectionTime(): Promise<Date | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('developer_feedback')
      .select('collected_at')
      .eq('platform', 'hackernews')
      .order('collected_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return new Date(data.collected_at)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const hackerNewsCollector = new HackerNewsCollector() 