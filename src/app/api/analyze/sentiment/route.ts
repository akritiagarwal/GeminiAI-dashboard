import { NextRequest, NextResponse } from 'next/server'
import { GeminiAnalyzer } from '@/lib/ai/gemini-analyzer'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// Create an instance of GeminiAnalyzer
const geminiAnalyzer = new GeminiAnalyzer()

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

      // Use the analyzeFeedback method for batch processing
      const results = await Promise.all(
        texts.map(text => geminiAnalyzer.analyzeFeedback(text))
      )
      
      // Store results in database if feedback_ids provided
      if (feedback_ids && Array.isArray(feedback_ids)) {
        const supabase = await createClient()
        
        for (let i = 0; i < feedback_ids.length; i++) {
          const feedbackId = feedback_ids[i]
          const analysis = results[i]

          // Store sentiment analysis
          await supabase
            .from('sentiment_analysis')
            .insert({
              feedback_id: feedbackId,
              sentiment_score: analysis.sentiment_score,
              sentiment_label: analysis.sentiment_label,
              confidence: 0.8, // Default confidence
              processing_model: 'gemini-pro',
              metadata: {
                is_about_gemini: analysis.is_about_gemini,
                apis_mentioned: analysis.apis_mentioned,
                key_topics: analysis.key_topics,
                is_comparison: analysis.is_comparison,
                comparison_winner: analysis.comparison_winner,
                actionable: analysis.actionable,
                priority: analysis.priority
              }
            })

          // Store extracted insights if there are feature requests or bug reports
          if (analysis.feature_request || analysis.bug_report) {
            await supabase
              .from('extracted_insights')
              .insert({
                feedback_id: feedbackId,
                insight_type: analysis.feature_request ? 'feature_request' : 'bug_report',
                apis_mentioned: analysis.apis_mentioned,
                features_mentioned: analysis.feature_request ? [analysis.feature_request] : [],
                technical_details: {
                  feature_request: analysis.feature_request,
                  bug_report: analysis.bug_report,
                  praise_point: analysis.praise_point,
                  pain_point: analysis.pain_point
                },
                priority_score: analysis.priority === 'high' ? 10 : analysis.priority === 'medium' ? 5 : 3
              })
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Batch sentiment analysis completed',
        data: {
          total_analyzed: texts.length,
          results: results
        }
      })
    } else {
      // Single text analysis
      const analysis = await geminiAnalyzer.analyzeFeedback(text)

      // Store results in database if feedback_id provided
      if (feedback_id) {
        const supabase = await createClient()
        
        // Store sentiment analysis
        await supabase
          .from('sentiment_analysis')
          .insert({
            feedback_id: feedback_id,
            sentiment_score: analysis.sentiment_score,
            sentiment_label: analysis.sentiment_label,
            confidence: 0.8, // Default confidence
            processing_model: 'gemini-pro',
            metadata: {
              is_about_gemini: analysis.is_about_gemini,
              apis_mentioned: analysis.apis_mentioned,
              key_topics: analysis.key_topics,
              is_comparison: analysis.is_comparison,
              comparison_winner: analysis.comparison_winner,
              actionable: analysis.actionable,
              priority: analysis.priority
            }
          })

        // Store extracted insights if there are feature requests or bug reports
        if (analysis.feature_request || analysis.bug_report) {
          await supabase
            .from('extracted_insights')
            .insert({
              feedback_id: feedback_id,
              insight_type: analysis.feature_request ? 'feature_request' : 'bug_report',
              apis_mentioned: analysis.apis_mentioned,
              features_mentioned: analysis.feature_request ? [analysis.feature_request] : [],
              technical_details: {
                feature_request: analysis.feature_request,
                bug_report: analysis.bug_report,
                praise_point: analysis.praise_point,
                pain_point: analysis.pain_point
              },
              priority_score: analysis.priority === 'high' ? 10 : analysis.priority === 'medium' ? 5 : 3
            })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Sentiment analysis completed',
        data: {
          analysis,
          summary: {
            sentiment: analysis.sentiment_label,
            score: analysis.sentiment_score,
            is_about_gemini: analysis.is_about_gemini,
            actionable: analysis.actionable,
            priority: analysis.priority
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