import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get recent feedback data
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('developer_feedback')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (feedbackError) {
      console.error('Error fetching feedback data:', feedbackError)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Generate mock sentiment data based on content analysis
    const sentimentData = feedbackData?.map(item => {
      const content = item.content?.toLowerCase() || ''
      let sentiment = 0.5 // neutral default
      
      // Simple sentiment analysis based on keywords
      const positiveWords = ['great', 'awesome', 'excellent', 'good', 'love', 'amazing', 'perfect', 'working', 'solved']
      const negativeWords = ['bug', 'error', 'issue', 'problem', 'broken', 'fail', 'crash', 'wrong', 'bad', 'terrible']
      
      const positiveCount = positiveWords.filter(word => content.includes(word)).length
      const negativeCount = negativeWords.filter(word => content.includes(word)).length
      
      if (positiveCount > negativeCount) {
        sentiment = 0.7 + (positiveCount - negativeCount) * 0.1
      } else if (negativeCount > positiveCount) {
        sentiment = 0.3 - (negativeCount - positiveCount) * 0.1
      }
      
      return {
        id: item.id,
        platform: item.platform,
        content: item.content,
        author: item.author,
        sentiment: Math.max(0, Math.min(1, sentiment)),
        timestamp: item.timestamp,
        metadata: item.metadata
      }
    }) || []

    // Calculate platform sentiment
    const platformSentiment = sentimentData.reduce((acc, item) => {
      if (!acc[item.platform]) {
        acc[item.platform] = { total: 0, count: 0 }
      }
      acc[item.platform].total += item.sentiment
      acc[item.platform].count += 1
      return acc
    }, {} as Record<string, { total: number, count: number }>)

    const platformAverages = Object.entries(platformSentiment).map(([platform, data]) => ({
      platform,
      averageSentiment: data.count > 0 ? data.total / data.count : 0.5,
      count: data.count
    }))

    // Calculate overall sentiment
    const overallSentiment = sentimentData.length > 0 
      ? sentimentData.reduce((sum, item) => sum + item.sentiment, 0) / sentimentData.length 
      : 0.5

    return NextResponse.json({
      overallSentiment,
      platformSentiment: platformAverages,
      recentSentiment: sentimentData.slice(0, 10),
      totalAnalyzed: sentimentData.length
    })

  } catch (error) {
    console.error('Error in sentiment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 