import { createClient } from '@/lib/supabase/server'

interface TwitterTweet {
  id: string
  text: string
  author_id: string
  author_username: string
  author_name: string
  created_at: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  entities?: {
    hashtags?: Array<{ tag: string }>
    mentions?: Array<{ username: string }>
    urls?: Array<{ url: string, expanded_url: string }>
  }
  referenced_tweets?: Array<{
    type: 'retweeted' | 'replied_to' | 'quoted'
    id: string
  }>
}

export class TwitterMonitor {
  private supabase: any
  private defaultKeywords = [
    'geminiAPI',
    'googleai',
    'gemini',
    'vertexai',
    'generativeai',
    'ai',
    'machinelearning',
    'llm',
    'apidevelopment'
  ]

  constructor() {
    this.supabase = createClient()
  }

  async searchTweets(keywords: string[] = this.defaultKeywords): Promise<void> {
    try {
      // This would integrate with Twitter API v2
      // For now, we'll simulate the search
      console.log(`Searching Twitter for keywords: ${keywords.join(', ')}`)
      
      // In a real implementation, you would:
      // 1. Use Twitter API v2 search endpoint
      // 2. Filter by recent tweets (last 24 hours)
      // 3. Process each tweet through sentiment analysis
      // 4. Store relevant tweets in database
      
    } catch (error) {
      console.error('Error searching Twitter:', error)
    }
  }

  async processTweet(tweet: TwitterTweet): Promise<void> {
    try {
      // Check if tweet is relevant to Gemini API
      const isRelevant = this.isRelevantToGemini(tweet.text)
      
      if (!isRelevant) {
        return
      }

      const tweetData = {
        id: tweet.id,
        content: tweet.text,
        author: tweet.author_username,
        author_id: tweet.author_id,
        author_name: tweet.author_name,
        timestamp: new Date(tweet.created_at).toISOString(),
        platform: 'twitter',
        source_url: `https://twitter.com/${tweet.author_username}/status/${tweet.id}`,
        metadata: {
          retweets: tweet.public_metrics.retweet_count,
          replies: tweet.public_metrics.reply_count,
          likes: tweet.public_metrics.like_count,
          quotes: tweet.public_metrics.quote_count,
          hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
          mentions: tweet.entities?.mentions?.map(m => m.username) || [],
          urls: tweet.entities?.urls?.map(u => u.expanded_url) || []
        }
      }

      // Store in database
      const { error } = await this.supabase
        .from('developer_feedback')
        .insert([tweetData])

      if (error) {
        console.error('Error storing Twitter tweet:', error)
      } else {
        console.log(`Stored Twitter tweet from @${tweet.author_username}`)
      }
    } catch (error) {
      console.error('Error processing Twitter tweet:', error)
    }
  }

  private isRelevantToGemini(text: string): boolean {
    const geminiKeywords = [
      'gemini',
      'google ai',
      'vertex ai',
      'generative ai',
      'ai studio',
      'gemini api',
      'gemini pro',
      'gemini ultra'
    ]

    const lowerText = text.toLowerCase()
    return geminiKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
  }

  async extractHashtags(text: string): Promise<string[]> {
    const hashtagRegex = /#(\w+)/g
    const matches = text.match(hashtagRegex) || []
    return matches.map(tag => tag.substring(1))
  }

  async extractMentions(text: string): Promise<string[]> {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex) || []
    return matches.map(mention => mention.substring(1))
  }

  async extractURLs(text: string): Promise<string[]> {
    const urlRegex = /https?:\/\/[^\s]+/g
    const matches = text.match(urlRegex) || []
    return matches
  }
} 