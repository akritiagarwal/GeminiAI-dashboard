import { NextRequest, NextResponse } from 'next/server'
import { geminiAnalyzer } from '@/lib/ai/gemini-analyzer'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { text, feedback_id, batch_mode = false } = await request.json()

    if (!text && !batch_mode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Text content is required for analysis'
        },
        { status: 400 }
      )
    }

    console.log('Starting Gemini sentiment analysis...')

    if (batch_mode) {
      // Batch analysis for multiple texts
      const { texts, feedback_ids } = await request.json()
      
      if (!texts || !Array.isArray(texts)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Texts array is required for batch analysis'
          },
          { status: 400 }
        )
      }

      const results = await geminiAnalyzer.batchAnalyze(texts)
      
      // Store results in database if feedback_ids provided
      if (feedback_ids && Array.isArray(feedback_ids)) {
        const supabase = await createClient()
        
        for (let i = 0; i < feedback_ids.length; i++) {
          const feedbackId = feedback_ids[i]
          const sentiment = results.sentiment[i]
          const intent = results.intents[i]
          const painPoints = results.painPoints[i] || []
          const featureRequests = results.featureRequests[i] || []
          const competitorMentions = results.competitorMentions[i] || []

          // Store sentiment analysis
          await supabase
            .from('sentiment_analysis')
            .insert({
              feedback_id: feedbackId,
              sentiment_score: sentiment.overall_sentiment.score,
              sentiment_label: sentiment.overall_sentiment.label,
              confidence: sentiment.overall_sentiment.confidence,
              processing_model: 'gemini-pro',
              metadata: {
                technical_sentiment: sentiment.technical_sentiment,
                business_sentiment: sentiment.business_sentiment,
                emotional_tone: sentiment.emotional_tone,
                comparison_context: sentiment.comparison_context,
                actionability: sentiment.actionability,
                developer_intent: intent,
                pain_points: painPoints,
                feature_requests: featureRequests,
                competitor_mentions: competitorMentions
              }
            })

          // Store extracted insights
          if (painPoints.length > 0 || featureRequests.length > 0) {
            await supabase
              .from('extracted_insights')
              .insert({
                feedback_id: feedbackId,
                insight_type: intent.primary_intent === 'feature_request' ? 'feature_request' : 'general',
                apis_mentioned: competitorMentions.map(m => m.competitor),
                features_mentioned: featureRequests.map(f => f.feature_name),
                competitor_comparison: {
                  mentions: competitorMentions,
                  comparison_type: sentiment.comparison_context.comparison_type
                },
                technical_details: {
                  pain_points: painPoints,
                  feature_requests: featureRequests,
                  intent: intent
                },
                priority_score: Math.max(
                  ...painPoints.map(p => p.severity === 'critical' ? 10 : p.severity === 'high' ? 8 : p.severity === 'medium' ? 5 : 3),
                  ...featureRequests.map(f => f.priority === 'critical' ? 10 : f.priority === 'high' ? 8 : f.priority === 'medium' ? 5 : 3),
                  5
                )
              })
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Batch sentiment analysis completed',
        data: {
          total_analyzed: texts.length,
          results: {
            sentiment: results.sentiment,
            intents: results.intents,
            painPoints: results.painPoints,
            featureRequests: results.featureRequests,
            competitorMentions: results.competitorMentions
          }
        }
      })
    } else {
      // Single text analysis
      const [sentiment, intent, painPoints, featureRequests, competitorMentions] = await Promise.all([
        geminiAnalyzer.analyzeSentiment(text),
        geminiAnalyzer.extractDeveloperIntent(text),
        geminiAnalyzer.identifyPainPoints(text),
        geminiAnalyzer.extractFeatureRequests(text),
        geminiAnalyzer.detectCompetitorMentions(text)
      ])

      // Store results in database if feedback_id provided
      if (feedback_id) {
        const supabase = await createClient()
        
        // Store sentiment analysis
        await supabase
          .from('sentiment_analysis')
          .insert({
            feedback_id: feedback_id,
            sentiment_score: sentiment.overall_sentiment.score,
            sentiment_label: sentiment.overall_sentiment.label,
            confidence: sentiment.overall_sentiment.confidence,
            processing_model: 'gemini-pro',
            metadata: {
              technical_sentiment: sentiment.technical_sentiment,
              business_sentiment: sentiment.business_sentiment,
              emotional_tone: sentiment.emotional_tone,
              comparison_context: sentiment.comparison_context,
              actionability: sentiment.actionability,
              developer_intent: intent,
              pain_points: painPoints,
              feature_requests: featureRequests,
              competitor_mentions: competitorMentions
            }
          })

        // Store extracted insights
        if (painPoints.length > 0 || featureRequests.length > 0) {
          await supabase
            .from('extracted_insights')
            .insert({
              feedback_id: feedback_id,
              insight_type: intent.primary_intent === 'feature_request' ? 'feature_request' : 'general',
              apis_mentioned: competitorMentions.map(m => m.competitor),
              features_mentioned: featureRequests.map(f => f.feature_name),
              competitor_comparison: {
                mentions: competitorMentions,
                comparison_type: sentiment.comparison_context.comparison_type
              },
              technical_details: {
                pain_points: painPoints,
                feature_requests: featureRequests,
                intent: intent
              },
              priority_score: Math.max(
                ...painPoints.map(p => p.severity === 'critical' ? 10 : p.severity === 'high' ? 8 : p.severity === 'medium' ? 5 : 3),
                ...featureRequests.map(f => f.priority === 'critical' ? 10 : f.priority === 'high' ? 8 : f.priority === 'medium' ? 5 : 3),
                5
              )
            })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Sentiment analysis completed',
        data: {
          sentiment,
          intent,
          painPoints,
          featureRequests,
          competitorMentions,
          summary: {
            overall_sentiment: sentiment.overall_sentiment.label,
            confidence: sentiment.overall_sentiment.confidence,
            primary_intent: intent.primary_intent,
            pain_points_count: painPoints.length,
            feature_requests_count: featureRequests.length,
            competitors_mentioned: competitorMentions.length
          }
        }
      })
    }
  } catch (error) {
    console.error('Error in sentiment analysis API:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to analyze sentiment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent sentiment analysis results
    const { data: recentAnalysis, error } = await supabase
      .from('sentiment_analysis')
      .select(`
        *,
        developer_feedback (
          content,
          platform,
          author,
          timestamp
        )
      `)
      .order('analyzed_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Recent sentiment analysis results retrieved',
      data: {
        recent_analysis: recentAnalysis,
        total_count: recentAnalysis?.length || 0
      }
    })
  } catch (error) {
    console.error('Error getting recent analysis:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get recent analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 