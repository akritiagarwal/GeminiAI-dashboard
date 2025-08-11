import { NextRequest, NextResponse } from 'next/server'
import { featureExtractor } from '@/lib/ai/feature-extractor'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { texts, feedback_ids, single_text } = await request.json()

    if (!texts && !single_text) {
      return NextResponse.json(
        {
          success: false,
          message: 'Text content is required for feature analysis'
        },
        { status: 400 }
      )
    }

    console.log('Starting Gemini feature extraction analysis...')

    let analysisTexts: string[]
    let analysisFeedbackIds: string[] | undefined

    if (single_text) {
      analysisTexts = [single_text]
      analysisFeedbackIds = feedback_ids ? [feedback_ids] : undefined
    } else {
      analysisTexts = texts
      analysisFeedbackIds = feedback_ids
    }

    if (!Array.isArray(analysisTexts) || analysisTexts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid texts array is required'
        },
        { status: 400 }
      )
    }

    const result = await featureExtractor.analyzeFeatures(analysisTexts)
    
    // Store results in database if feedback_ids provided
    if (analysisFeedbackIds && Array.isArray(analysisFeedbackIds)) {
      const supabase = await createClient()
      
      for (let i = 0; i < analysisFeedbackIds.length; i++) {
        const feedbackId = analysisFeedbackIds[i]
        const features = result.features.filter(f => f.frequency > 0) // Only store features that were found
        
        if (features.length > 0) {
          // Store extracted insights
          await supabase
            .from('extracted_insights')
            .insert({
              feedback_id: feedbackId,
              insight_type: 'feature_request',
              apis_mentioned: features
                .filter(f => f.competitorComparison)
                .map(f => f.competitorComparison!.competitor),
              features_mentioned: features.map(f => f.name),
              competitor_comparison: {
                gaps: result.insights.competitiveGaps,
                comparisons: features
                  .filter(f => f.competitorComparison)
                  .map(f => f.competitorComparison)
              },
              technical_details: {
                features: features.map(f => ({
                  name: f.name,
                  category: f.category,
                  sentiment: f.sentiment,
                  businessImpact: f.businessImpact,
                  technicalDetails: f.technicalDetails,
                  useCases: f.useCases
                })),
                clusters: result.clusters,
                insights: result.insights
              },
              priority_score: Math.max(
                ...features.map(f => 
                  f.businessImpact === 'high' ? 10 : 
                  f.businessImpact === 'medium' ? 7 : 4
                ),
                5
              )
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feature extraction analysis completed',
      data: {
        ...result,
        processing_summary: {
          texts_analyzed: analysisTexts.length,
          features_found: result.features.length,
          clusters_created: result.clusters.length,
          competitive_gaps: result.insights.competitiveGaps.length,
          quick_wins: result.insights.quickWins.length,
          long_term_investments: result.insights.longTermInvestments.length
        }
      }
    })
  } catch (error) {
    console.error('Error in feature extraction API:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to analyze features',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent feature extraction results
    const { data: recentFeatures, error } = await supabase
      .from('extracted_insights')
      .select(`
        *,
        developer_feedback (
          content,
          platform,
          author,
          timestamp
        )
      `)
      .eq('insight_type', 'feature_request')
      .order('extracted_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    // Aggregate feature insights
    const featureBreakdown = {
      by_category: {} as Record<string, { count: number; sentiment: number }>,
      by_impact: { high: 0, medium: 0, low: 0 },
      competitive_gaps: [] as Array<{
        feature: string
        competitors: string[]
        gapDescription: string
        impact: 'high' | 'medium' | 'low'
      }>,
      trending_features: [] as Array<{
        name: string
        category: string
        sentiment: string
        businessImpact: string
      }>
    }

    recentFeatures?.forEach(insight => {
      const features = insight.technical_details?.features || []
      
      features.forEach((feature: {
        name: string
        category: string
        sentiment: string
        businessImpact: string
      }) => {
        // Category breakdown
        if (!featureBreakdown.by_category[feature.category]) {
          featureBreakdown.by_category[feature.category] = { count: 0, sentiment: 0 }
        }
        featureBreakdown.by_category[feature.category].count++
        featureBreakdown.by_category[feature.category].sentiment += 
          feature.sentiment === 'positive' ? 1 : feature.sentiment === 'negative' ? -1 : 0
        
        // Impact breakdown
        featureBreakdown.by_impact[feature.businessImpact as keyof typeof featureBreakdown.by_impact]++
      })

      // Competitive gaps
      if (insight.competitor_comparison?.gaps) {
        featureBreakdown.competitive_gaps.push(...insight.competitor_comparison.gaps)
      }
    })

    // Calculate average sentiment
    Object.keys(featureBreakdown.by_category).forEach(category => {
      if (featureBreakdown.by_category[category].count > 0) {
        featureBreakdown.by_category[category].sentiment /= featureBreakdown.by_category[category].count
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Recent feature analysis results retrieved',
      data: {
        recent_features: recentFeatures,
        total_insights: recentFeatures?.length || 0,
        feature_breakdown: featureBreakdown,
        summary: {
          total_features_analyzed: recentFeatures?.reduce((sum, insight) => 
            sum + (insight.technical_details?.features?.length || 0), 0) || 0,
          competitive_gaps_found: featureBreakdown.competitive_gaps.length,
          high_impact_features: featureBreakdown.by_impact.high
        }
      }
    })
  } catch (error) {
    console.error('Error getting recent feature analysis:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get recent feature analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 