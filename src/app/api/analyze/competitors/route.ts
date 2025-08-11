import { NextRequest, NextResponse } from 'next/server'
import { competitorIntelligence } from '@/lib/ai/competitor-intel'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { 
      competitor_update, 
      developer_feedback, 
      competitor_name,
      analysis_type = 'update' 
    } = await request.json()

    console.log('Starting competitor intelligence analysis...')

    if (analysis_type === 'update' && (!competitor_update || !competitor_name)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Competitor update content and competitor name are required'
        },
        { status: 400 }
      )
    }

    if (analysis_type === 'switching' && !developer_feedback) {
      return NextResponse.json(
        {
          success: false,
          message: 'Developer feedback is required for switching pattern analysis'
        },
        { status: 400 }
      )
    }

    let result: Record<string, unknown> = {}

    if (analysis_type === 'update') {
      // Analyze competitor update
      const analysis = await competitorIntelligence.analyzeCompetitorUpdate(
        competitor_name,
        competitor_update,
        developer_feedback
      )

      result = {
        analysis_type: 'competitor_update',
        competitor: competitor_name,
        analysis,
        summary: {
          threat_level: analysis.threatLevel,
          developer_sentiment: analysis.developerSentiment,
          advantages_count: analysis.geminiAdvantages.length,
          disadvantages_count: analysis.geminiDisadvantages.length,
          feature_comparisons: analysis.featureComparison.length
        }
      }
    } else if (analysis_type === 'switching') {
      // Detect switching patterns
      const patterns = await competitorIntelligence.detectSwitchingPatterns(developer_feedback)

      result = {
        analysis_type: 'switching_patterns',
        patterns,
        summary: {
          total_patterns: patterns.length,
          to_gemini: patterns.filter(p => p.direction === 'to_gemini').length,
          from_gemini: patterns.filter(p => p.direction === 'from_gemini').length,
          considering: patterns.filter(p => p.direction === 'considering').length
        }
      }
    } else if (analysis_type === 'report') {
      // Generate comprehensive competitive report
      const mockUpdates = [
        {
          competitor: 'OpenAI',
          updateType: 'model_update' as const,
          title: 'GPT-4 Turbo with Vision',
          description: 'Enhanced vision capabilities and improved performance',
          date: new Date(),
          source: 'OpenAI Blog',
          impact: 'major' as const
        }
      ]

      const report = await competitorIntelligence.generateCompetitiveReport(
        mockUpdates,
        [], // switching patterns
        developer_feedback || []
      )

      result = {
        analysis_type: 'competitive_report',
        report,
        summary: {
          total_updates: report.dailySummary.totalUpdates,
          threat_level: report.dailySummary.threatLevel,
          wins_count: report.winLossAnalysis.wins.count,
          losses_count: report.winLossAnalysis.losses.count,
          opportunities_count: report.winLossAnalysis.opportunities.count
        }
      }
    }

    // Store results in database
    const supabase = await createClient()
    
    const resultAnalysis = (result as Record<string, unknown>).analysis as Record<string, unknown>
    const latestUpdate = resultAnalysis?.latestUpdate as Record<string, unknown>
    
    await supabase
      .from('competitor_updates')
      .insert({
        competitor: (result as Record<string, unknown>).competitor as string || 'multiple',
        update_type: (result as Record<string, unknown>).analysis_type === 'competitor_update' ? 'analysis' : 'report',
        title: (result as Record<string, unknown>).analysis_type === 'competitor_update' ? 
          latestUpdate?.title as string || 'Unknown Update' : 'Competitive Intelligence Report',
        description: (result as Record<string, unknown>).analysis_type === 'competitor_update' ? 
          latestUpdate?.description as string || 'No description available' : 'Comprehensive competitive analysis',
        source_url: null,
        impact_analysis: JSON.stringify(result)
      })

    return NextResponse.json({
      success: true,
      message: 'Competitor intelligence analysis completed',
      data: result
    })
  } catch (error) {
    console.error('Error in competitor intelligence API:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to analyze competitor intelligence',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent competitor intelligence results
    const { data: recentUpdates, error } = await supabase
      .from('competitor_updates')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    // Aggregate competitor intelligence
    const competitorBreakdown = {
      by_competitor: {} as Record<string, { count: number; threat_level: string; last_update: string }>,
      by_type: {} as Record<string, { count: number; impact: string }>,
      threat_levels: { high: 0, medium: 0, low: 0 }
    }

    recentUpdates?.forEach(update => {
      // Competitor breakdown
      if (!competitorBreakdown.by_competitor[update.competitor]) {
        competitorBreakdown.by_competitor[update.competitor] = { 
          count: 0, 
          threat_level: 'medium',
          last_update: update.detected_at
        }
      }
      competitorBreakdown.by_competitor[update.competitor].count++
      competitorBreakdown.by_competitor[update.competitor].last_update = update.detected_at

      // Type breakdown
      if (!competitorBreakdown.by_type[update.update_type]) {
        competitorBreakdown.by_type[update.update_type] = { count: 0, impact: 'neutral' }
      }
      competitorBreakdown.by_type[update.update_type].count++

      // Threat level breakdown
      try {
        const impactData = JSON.parse(update.impact_analysis || '{}')
        const threatLevel = impactData.summary?.threat_level || 'medium'
        competitorBreakdown.threat_levels[threatLevel as keyof typeof competitorBreakdown.threat_levels]++
      } catch {
        competitorBreakdown.threat_levels.medium++
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Recent competitor intelligence results retrieved',
      data: {
        recent_updates: recentUpdates,
        total_updates: recentUpdates?.length || 0,
        competitor_breakdown: competitorBreakdown,
        summary: {
          total_competitors: Object.keys(competitorBreakdown.by_competitor).length,
          high_threat_updates: competitorBreakdown.threat_levels.high,
          most_active_competitor: Object.entries(competitorBreakdown.by_competitor)
            .sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || 'None'
        }
      }
    })
  } catch (error) {
    console.error('Error getting recent competitor intelligence:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get recent competitor intelligence',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 