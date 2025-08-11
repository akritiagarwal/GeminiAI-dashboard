import { createClient } from '@/lib/supabase/server'
import type { Platform } from '@/types'

interface RedditPost {
  id: string
  title: string
  selftext: string
  author: string
  score: number
  created_utc: number
  url: string
  permalink: string
  subreddit: string
  num_comments: number
  upvote_ratio: number
}

interface RedditComment {
  id: string
  body: string
  author: string
  score: number
  created_utc: number
  permalink: string
  parent_id: string
  link_id: string
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost | RedditComment
    }>
    after?: string
    before?: string
  }
}

const SUBREDDITS = [
  'GeminiAI',  // Dedicated Gemini AI subreddit
  'MachineLearning',
  'LocalLLaMA',
  'OpenAI',
  'singularity',
  'ArtificialIntelligence',
  'learnmachinelearning'
]

const SEARCH_TERMS = [
  'Gemini API',
  'Gemini Pro',
  'Gemini Ultra',
  'vs OpenAI',
  'vs GPT',
  'vs Claude',
  'Google AI',
  'Vertex AI',
  'function calling',
  'streaming',
  'context window',
  'multimodal'
]

// Use environment variable for user agent, fallback to default
const USER_AGENT = process.env.REDDIT_USER_AGENT || 'GeminiPMDashboard/1.0 (by /u/your_username)'

class RedditCollector {
  private lastRequestTime = 0
  private readonly rateLimitDelay = 1000 // 1 second

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
        const response = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT
          }
        })
        
        if (response.ok) {
          return response
        }
        
        if (response.status === 429) {
          // Rate limited, wait longer
          await new Promise(resolve => setTimeout(resolve, 5000))
          continue
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
      }
    }
    throw new Error('Max retries exceeded')
  }

  private async searchSubreddit(subreddit: string, query: string, limit = 100): Promise<RedditPost[]> {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodedQuery}&sort=new&limit=${limit}&t=week`
    
    const response = await this.fetchWithRetry(url)
    const data: RedditResponse = await response.json()
    
    return data.data.children
      .map(child => child.data as RedditPost)
      .filter(post => post.selftext && post.selftext.length > 10)
  }

  private async getNewPosts(subreddit: string, limit = 100): Promise<RedditPost[]> {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`
    
    const response = await this.fetchWithRetry(url)
    const data: RedditResponse = await response.json()
    
    return data.data.children
      .map(child => child.data as RedditPost)
      .filter(post => {
        const content = `${post.title} ${post.selftext}`.toLowerCase()
        return SEARCH_TERMS.some(term => 
          content.includes(term.toLowerCase())
        )
      })
  }

  private async getComments(postId: string, limit = 100): Promise<RedditComment[]> {
    const url = `https://www.reddit.com/comments/${postId}.json?limit=${limit}`
    
    const response = await this.fetchWithRetry(url)
    const data: RedditResponse[] = await response.json()
    
    if (data.length < 2) return []
    
    const comments = data[1].data.children
      .map(child => child.data as RedditComment)
      .filter(comment => comment.body && comment.body.length > 10)
    
    return comments
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g
    return text.match(urlRegex) || []
  }

  private async storeFeedback(
    content: string,
    author: string,
    authorReputation: number,
    url: string,
    threadTitle: string,
    timestamp: number,
    parentId?: string
  ) {
    const supabase = await createClient()
    
    const feedbackData = {
      platform: 'reddit' as Platform,
      content: content.substring(0, 10000), // Limit content length
      author,
      author_reputation: authorReputation,
      url,
      thread_title: threadTitle,
      timestamp: new Date(timestamp * 1000).toISOString(),
      collected_at: new Date().toISOString(),
      parent_id: parentId
    }

    const { error } = await supabase
      .from('developer_feedback')
      .insert(feedbackData)

    if (error) {
      console.error('Error storing feedback:', error)
      throw error
    }
  }

  async collectData(): Promise<{ posts: number; comments: number; errors: number }> {
    let totalPosts = 0
    let totalComments = 0
    let totalErrors = 0

    console.log('Starting Reddit data collection...')
    console.log('Using User-Agent:', USER_AGENT)

    for (const subreddit of SUBREDDITS) {
      try {
        console.log(`Collecting from r/${subreddit}...`)

        // Search for specific terms
        for (const term of SEARCH_TERMS) {
          try {
            const posts = await this.searchSubreddit(subreddit, term, 50)
            
            for (const post of posts) {
              try {
                await this.storeFeedback(
                  post.selftext,
                  post.author,
                  post.score,
                  `https://reddit.com${post.permalink}`,
                  post.title,
                  post.created_utc
                )
                totalPosts++

                // Get comments for this post
                const comments = await this.getComments(post.id, 50)
                for (const comment of comments) {
                  try {
                    await this.storeFeedback(
                      comment.body,
                      comment.author,
                      comment.score,
                      `https://reddit.com${comment.permalink}`,
                      post.title,
                      comment.created_utc,
                      post.id
                    )
                    totalComments++
                  } catch (error) {
                    console.error('Error storing comment:', error)
                    totalErrors++
                  }
                }
              } catch (error) {
                console.error('Error storing post:', error)
                totalErrors++
              }
            }
          } catch (error) {
            console.error(`Error searching for term "${term}" in r/${subreddit}:`, error)
            totalErrors++
          }
        }

        // Get new posts and filter for relevant content
        try {
          const newPosts = await this.getNewPosts(subreddit, 100)
          
          for (const post of newPosts) {
            try {
              await this.storeFeedback(
                post.selftext,
                post.author,
                post.score,
                `https://reddit.com${post.permalink}`,
                post.title,
                post.created_utc
              )
              totalPosts++
            } catch (error) {
              console.error('Error storing new post:', error)
              totalErrors++
            }
          }
        } catch (error) {
          console.error(`Error getting new posts from r/${subreddit}:`, error)
          totalErrors++
        }

      } catch (error) {
        console.error(`Error processing subreddit r/${subreddit}:`, error)
        totalErrors++
      }
    }

    console.log(`Reddit collection complete: ${totalPosts} posts, ${totalComments} comments, ${totalErrors} errors`)
    return { posts: totalPosts, comments: totalComments, errors: totalErrors }
  }

  async getLastCollectionTime(): Promise<Date | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('developer_feedback')
      .select('collected_at')
      .eq('platform', 'reddit')
      .order('collected_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return new Date(data.collected_at)
  }
}

export const redditCollector = new RedditCollector() 