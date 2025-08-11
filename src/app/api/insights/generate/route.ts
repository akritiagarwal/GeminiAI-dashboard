import { NextRequest, NextResponse } from 'next/server'
import { pmInsightsGenerator, type PMInsight } from '@/lib/ai/pm-insights'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { 
      feedback_data, 
      competitor_updates, 
      switching_patterns,
      insight_type = 'daily',
      specific_insight_id
    } = await request.json()

    console.log('Starting PM insights generation...')

    if (!feedback_data || !Array.isArray(feedback_data)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Feedback data array is required'
        },
        { status: 400 }
      )
    }

    let result: Record<string, unknown> = {}

    if (insight_type === 'daily') {
      // Generate daily insights
      const dailyInsights = await pmInsightsGenerator.generateDailyInsights(
        feedback_data,
        competitor_updates || [],
        switching_patterns || []
      )

      result = {
        insight_type: 'daily',
        insights: dailyInsights,
        prioritization_matrix: pmInsightsGenerator.createPrioritizationMatrix([
          ...dailyInsights.topPriorities,
          ...dailyInsights.quickWins
        ]),
        summary: {
          total_insights: dailyInsights.summary.totalInsights,
          high_priority_count: dailyInsights.summary.highPriorityCount,
          quick_wins_count: dailyInsights.summary.quickWinsCount,
          threats_count: dailyInsights.summary.threatsCount,
          overall_sentiment: dailyInsights.summary.overallSentiment
        }
      }
    } else if (insight_type === 'artifacts' && specific_insight_id) {
      // Generate PM artifacts for a specific insight
      const insight = feedback_data.find((item: Record<string, unknown>) => item.id === specific_insight_id)
      
      if (!insight) {
        return NextResponse.json(
          {
            success: false,
            message: 'Specific insight not found'
          },
          { status: 404 }
        )
      }

      const artifacts = await pmInsightsGenerator.generatePMArtifacts(insight as PMInsight)

      result = {
        insight_type: 'artifacts',
        insight_id: specific_insight_id,
        artifacts,
        summary: {
          total_artifacts: artifacts.length,
          artifact_types: artifacts.map(a => a.type)
        }
      }
    } else if (insight_type === 'effectiveness') {
      // Track insight effectiveness
      const { insight_id, implemented, outcome, metrics } = await request.json()
      
      if (!insight_id) {
        return NextResponse.json(
          {
            success: false,
            message: 'Insight ID is required for effectiveness tracking'
          },
          { status: 400 }
        )
      }

      const effectiveness = await pmInsightsGenerator.trackInsightEffectiveness(
        insight_id,
        implemented || false,
        outcome,
        metrics
      )

      result = {
        insight_type: 'effectiveness',
        effectiveness,
        summary: {
          implemented: effectiveness.implemented,
          outcome: effectiveness.outcome,
          learnings_count: effectiveness.learnings.length,
          recommendations_count: effectiveness.recommendations.length
        }
      }
    }

    // Store results in database
    const supabase = await createClient()
    
    await supabase
      .from('pm_action_items')
      .insert({
        title: result.insight_type === 'daily' ? 'Daily PM Insights' : 
               result.insight_type === 'artifacts' ? `PM Artifacts for ${result.insight_id}` :
               `Effectiveness Tracking for ${result.insight_id}`,
        description: JSON.stringify(result),
        category: result.insight_type === 'daily' ? 'feature' : 'general',
        priority: result.insight_type === 'daily' ? 'high' : 'medium',
        status: 'new',
        evidence_ids: result.insight_type === 'daily' ? 
          ((result.insights as Record<string, unknown>)?.topPriorities as Record<string, unknown>[])?.map((p: Record<string, unknown>) => p.title) || [] : []
      })

    return NextResponse.json({
      success: true,
      message: 'PM insights generated successfully',
      data: result
    })
  } catch (error) {
    console.error('Error in PM insights generation:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate PM insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent PM insights
    const { data: recentInsights, error } = await supabase
      .from('pm_action_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    // Parse and aggregate insights
    const insightsBreakdown = {
      by_category: {} as Record<string, { count: number; priority: string }>,
      by_priority: { critical: 0, high: 0, medium: 0, low: 0 },
      by_status: { new: 0, investigating: 0, planned: 0, in_progress: 0, resolved: 0 },
      recent_insights: [] as Array<{
        title: string
        category: string
        priority: string
        status: string
        created_at: string
      }>
    }

    recentInsights?.forEach(insight => {
      // Category breakdown
      if (!insightsBreakdown.by_category[insight.category]) {
        insightsBreakdown.by_category[insight.category] = { count: 0, priority: 'medium' }
      }
      insightsBreakdown.by_category[insight.category].count++
      
      // Priority breakdown
      insightsBreakdown.by_priority[insight.priority as keyof typeof insightsBreakdown.by_priority]++
      
      // Status breakdown
      insightsBreakdown.by_status[insight.status as keyof typeof insightsBreakdown.by_status]++
      
      // Recent insights
      insightsBreakdown.recent_insights.push({
        title: insight.title,
        category: insight.category,
        priority: insight.priority,
        status: insight.status,
        created_at: insight.created_at
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Recent PM insights retrieved',
      data: {
        recent_insights: recentInsights,
        total_insights: recentInsights?.length || 0,
        insights_breakdown: insightsBreakdown,
        summary: {
          total_action_items: recentInsights?.length || 0,
          high_priority_items: insightsBreakdown.by_priority.high + insightsBreakdown.by_priority.critical,
          resolved_items: insightsBreakdown.by_status.resolved,
          pending_items: insightsBreakdown.by_status.new + insightsBreakdown.by_status.investigating
        }
      }
    })
  } catch (error) {
    console.error('Error getting recent PM insights:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get recent PM insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 