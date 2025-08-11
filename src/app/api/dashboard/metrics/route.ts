import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get data from last 48 hours
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    
    // Get all feedback with sentiment analysis
    const { data: sentimentData, error: sentimentError } = await supabase
      .from('sentiment_analysis')
      .select(`
        sentiment_score,
        sentiment_label,
        feedback_id,
        analyzed_at
      `)
      .gte('analyzed_at', twoDaysAgo)

    if (sentimentError) {
      console.error('Error fetching sentiment data:', sentimentError)
      return NextResponse.json({ error: 'Failed to fetch sentiment data' }, { status: 500 })
    }

    // Get recent feedback for activity metrics
    const { data: recentFeedback, error: feedbackError } = await supabase
      .from('developer_feedback')
      .select('platform, timestamp')
      .gte('timestamp', twoDaysAgo)

    if (feedbackError) {
      console.error('Error fetching feedback data:', feedbackError)
      return NextResponse.json({ error: 'Failed to fetch feedback data' }, { status: 500 })
    }

    // Calculate real metrics
    const metrics = calculateRealMetrics(sentimentData || [], recentFeedback || [])
    
    return NextResponse.json(metrics)
    
  } catch (error) {
    console.error('Error calculating metrics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate metrics' },
      { status: 500 }
    )
  }
}

function calculateRealMetrics(sentimentData: any[], recentFeedback: any[]) {
  // Developer Sentiment Score (weighted average)
  const validScores = sentimentData
    .filter(item => item.sentiment_score !== null && !isNaN(item.sentiment_score))
    .map(item => item.sentiment_score)
  
  const developerSentiment = validScores.length > 0 
    ? (validScores.reduce((sum, score) => sum + score, 0) / validScores.length * 10).toFixed(1)
    : 0

  // Active Discussions (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const activeDiscussions = recentFeedback.filter(item => 
    new Date(item.timestamp) > oneDayAgo
  ).length

  // Critical Issues (negative sentiment)
  const criticalIssues = sentimentData.filter(item => 
    item.sentiment_label === 'negative'
  ).length

  // Platform Activity (unique platforms with recent data)
  const activePlatforms = new Set(
    recentFeedback
      .filter(item => new Date(item.timestamp) > oneDayAgo)
      .map(item => item.platform)
  ).size

  // Data Freshness
  const lastUpdate = recentFeedback.length > 0 
    ? recentFeedback.reduce((latest, item) => 
        new Date(item.timestamp) > new Date(latest.timestamp) ? item : latest
      ).timestamp
    : null

  const dataFreshness = lastUpdate 
    ? `Last updated ${Math.floor((Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60))} hours ago`
    : 'No data collected yet'

  return {
    developerSentiment: parseFloat(String(developerSentiment)),
    activeDiscussions,
    criticalIssues,
    platformActivity: activePlatforms,
    dataFreshness,
    totalAnalyzed: sentimentData.length
  }
} 