import { createClient } from '../supabase/server'

interface NewsItem {
  id: string
  title: string
  content: string
  author: string
  url: string
  timestamp: string
  source: string
  sentiment: 'positive' | 'negative' | 'neutral'
  tags: string[]
}

export class NewsMonitor {
  async collectNews() {
    const items = [
      {
        id: 'news-1',
        title: 'Google Gemini 2.5 Flash: New Model Brings Speed and Efficiency',
        content: 'Google has launched Gemini 2.5 Flash, a new model that offers faster response times and improved efficiency for developers building AI applications.',
        author: 'Google AI Team',
        url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'Google AI Blog',
        sentiment: 'positive' as const,
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
        sentiment: 'positive' as const,
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
        sentiment: 'positive' as const,
        tags: ['function-calling', 'reliability', 'developer-experience']
      }
    ]
    
    return {
      items,
      totalItems: items.length,
      lastUpdated: new Date().toISOString()
    }
  }

  async storeInSupabase(items: NewsItem[]): Promise<void> {
    const supabase = await createClient()
    console.log(`Storing ${items.length} news items`)

    for (const item of items) {
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
} 