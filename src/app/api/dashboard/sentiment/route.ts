import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get sentiment analysis data from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: sentimentAnalysis, error: sentimentError } = await supabase
      .from('sentiment_analysis')
      .select(`
        *,
        developer_feedback (
          id,
          content,
          platform,
          author,
          timestamp,
          metadata
        )
      `)
      .gte('analyzed_at', sevenDaysAgo)
      .order('analyzed_at', { ascending: false })

    if (sentimentError) {
      console.error('Error fetching sentiment analysis:', sentimentError)
      return NextResponse.json({ error: 'Failed to fetch sentiment data' }, { status: 500 })
    }

    // Transform the data for the frontend
    const sentimentData = sentimentAnalysis?.map(item => ({
      id: item.feedback_id,
      platform: item.developer_feedback?.platform || 'unknown',
      content: item.developer_feedback?.content || '',
      author: item.developer_feedback?.author || 'unknown',
      sentiment: item.sentiment_score || 0.5,
      sentiment_label: item.sentiment_label || 'neutral',
      timestamp: item.developer_feedback?.timestamp || item.analyzed_at,
      metadata: item.developer_feedback?.metadata || {},
      confidence: item.confidence || 0.8
    })) || []

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

    // Get sentiment trends over time (last 7 days)
    const dailySentiment = sentimentData.reduce((acc, item) => {
      const date = new Date(item.timestamp).toDateString()
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 }
      }
      acc[date].total += item.sentiment
      acc[date].count += 1
      return acc
    }, {} as Record<string, { total: number, count: number }>)

    const sentimentTrend = Object.entries(dailySentiment)
      .map(([date, data]) => ({
        date,
        averageSentiment: data.count > 0 ? data.total / data.count : 0.5,
        count: data.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({
      overallSentiment,
      platformSentiment: platformAverages,
      recentSentiment: sentimentData.slice(0, 10),
      sentimentTrend,
      totalAnalyzed: sentimentData.length,
      sentimentBreakdown: {
        positive: sentimentData.filter(item => item.sentiment >= 0.7).length,
        neutral: sentimentData.filter(item => item.sentiment >= 0.4 && item.sentiment < 0.7).length,
        negative: sentimentData.filter(item => item.sentiment < 0.4).length
      }
    })

  } catch (error) {
    console.error('Error in sentiment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 