import { createClient } from '../supabase/server'

interface GoogleForumPost {
  id: string
  title: string
  content: string
  author: string
  timestamp: string
  replies: number
  views: number
  tags: string[]
  url: string
  category: string
}

interface GoogleForumResponse {
  posts: GoogleForumPost[]
  totalPosts: number
  lastUpdated: string
}

interface DiscourseTopic {
  id: number
  title: string
  fancy_title: string
  slug: string
  posts_count: number
  reply_count: number
  created_at: string
  last_posted_at: string
  views: number
  like_count: number
  tags: string[]
  last_poster_username: string
  category_id: number
  ai_topic_gist?: string
}

interface DiscourseResponse {
  topic_list: {
    topics: DiscourseTopic[]
  }
}

export class GoogleForumMonitor {
  private baseUrl = 'https://discuss.ai.google.dev'
  private tags = ['api', 'gemini-api', 'models', 'bug', 'documentation', 'gemini-15', 'gemini-25']

  async fetchTaggedPosts(tag: string, daysBack: number = 7): Promise<GoogleForumPost[]> {
    try {
      console.log(`Fetching Google Forum tag: ${tag}...`)
      
      // Use the JSON API instead of HTML scraping
      const response = await fetch(`${this.baseUrl}/tag/${tag}.json`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tag ${tag}: ${response.status}`)
      }

      const data: DiscourseResponse = await response.json()
      console.log(`Fetched ${data.topic_list.topics.length} topics for tag ${tag}`)
      
      const posts: GoogleForumPost[] = []
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

      for (const topic of data.topic_list.topics) {
        // Filter by date
        const topicDate = new Date(topic.created_at)
        if (topicDate < cutoffDate) {
          continue
        }

        // Create a post object
        const post: GoogleForumPost = {
          id: topic.id.toString(),
          title: topic.title,
          content: topic.ai_topic_gist || `Topic: ${topic.title}`,
          author: topic.last_poster_username,
          timestamp: topic.created_at,
          replies: topic.reply_count,
          views: topic.views,
          tags: [tag, ...topic.tags],
          url: `${this.baseUrl}/t/${topic.slug}/${topic.id}`,
          category: 'tagged'
        }

        posts.push(post)
      }

      console.log(`Found ${posts.length} recent posts for tag ${tag}`)
      
      // Log first few posts for debugging
      if (posts.length > 0) {
        console.log(`Sample posts for tag ${tag}:`)
        posts.slice(0, 3).forEach(post => {
          console.log(`- ${post.title} (ID: ${post.id}, Replies: ${post.replies}, Views: ${post.views})`)
        })
      }

      return posts
    } catch (error) {
      console.error(`Error fetching Google Forum tag ${tag}:`, error)
      return []
    }
  }

  private extractTagsFromTitle(title: string): string[] {
    const tags: string[] = []
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('gemini')) tags.push('gemini')
    if (lowerTitle.includes('api')) tags.push('api')
    if (lowerTitle.includes('bug') || lowerTitle.includes('error')) tags.push('bug')
    if (lowerTitle.includes('documentation') || lowerTitle.includes('docs')) tags.push('documentation')
    if (lowerTitle.includes('model')) tags.push('models')
    if (lowerTitle.includes('ai studio')) tags.push('ai-studio')
    if (lowerTitle.includes('gemini-15')) tags.push('gemini-15')
    if (lowerTitle.includes('gemini-25')) tags.push('gemini-25')
    
    return tags
  }

  async collectAllData(daysBack: number = 7): Promise<GoogleForumResponse> {
    const allPosts: GoogleForumPost[] = []

    // Fetch from tags
    for (const tag of this.tags) {
      console.log(`Fetching Google Forum tag: ${tag}`)
      const tagPosts = await this.fetchTaggedPosts(tag, daysBack)
      allPosts.push(...tagPosts)
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Remove duplicates based on post ID
    const uniquePosts = allPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    )

    console.log(`Total unique Google Forum posts collected: ${uniquePosts.length}`)

    return {
      posts: uniquePosts,
      totalPosts: uniquePosts.length,
      lastUpdated: new Date().toISOString()
    }
  }

  async storeInSupabase(posts: GoogleForumPost[]): Promise<void> {
    const supabase = await createClient()
    console.log(`Attempting to store ${posts.length} Google Forum posts`)

    let storedCount = 0
    for (const post of posts) {
      try {
        console.log(`Storing post: ${post.title} (ID: ${post.id})`)
        
        // Use a simpler insert without unique constraints
        const { error } = await supabase
          .from('developer_feedback')
          .insert({
            platform: 'google_forum',
            content: post.content,
            author: post.author,
            url: post.url,
            timestamp: post.timestamp,
            metadata: {
              title: post.title,
              replies: post.replies,
              views: post.views,
              tags: post.tags,
              category: post.category,
              source_id: post.id
            }
          })

        if (error) {
          console.error(`Error storing Google Forum post ${post.id}:`, error)
          // Continue with next post instead of failing completely
        } else {
          console.log(`Successfully stored Google Forum post: ${post.title}`)
          storedCount++
        }
      } catch (error) {
        console.error(`Exception storing Google Forum post ${post.id}:`, error)
        // Continue with next post
      }
    }
    
    console.log(`Finished storing Google Forum posts. Stored: ${storedCount}/${posts.length}`)
  }
} 