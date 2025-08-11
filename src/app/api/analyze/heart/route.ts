import { NextRequest, NextResponse } from 'next/server';
import { SimpleHEARTAnalyzer } from '@/lib/ai/heart-analyzer';
import { createEdgeClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { feedback_id, content, platform, batch_mode = false } = await request.json();
    
    if (!content && !batch_mode) {
      return NextResponse.json(
        { error: 'Content is required for single analysis' },
        { status: 400 }
      );
    }

    console.log('Starting HEART analysis...');
    const heartAnalyzer = new SimpleHEARTAnalyzer();

    if (batch_mode) {
      // Batch analysis
      const supabase = createEdgeClient();
      
      // Get recent feedback for batch analysis - focus on relevant platforms
      const { data: recentFeedback, error: fetchError } = await supabase
        .from('developer_feedback')
        .select('*')
        .in('platform', ['google_forum', 'reddit', 'hackernews']) // Only relevant platforms
        .order('timestamp', { ascending: false })
        .limit(15); // Reduced limit for faster processing

      if (fetchError) {
        console.error('Error fetching feedback:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch feedback data' }, { status: 500 });
      }

      if (!recentFeedback || recentFeedback.length === 0) {
        return NextResponse.json({ error: 'No feedback found' }, { status: 404 });
      }

      console.log(`Found ${recentFeedback.length} feedback items to analyze`);
      
      const heartResults = await heartAnalyzer.batchAnalyzeHEART(recentFeedback);
      
      console.log(`Generated ${heartResults.length} HEART analysis results`);
      
      // Store HEART results in database
      let storedCount = 0;
      for (const result of heartResults) {
        try {
          const { error: insertError } = await supabase
            .from('heart_analysis')
            .upsert({
              feedback_id: result.feedback_id,
              happiness_csat: result.happiness_csat,
              engagement: result.engagement,
              adoption: result.adoption,
              retention: result.retention,
              task_success: result.task_success,
              overall_score: result.overall_score,
              main_point: result.main_point,
              actionable: result.actionable,
              priority: result.priority,
              category: result.category,
              analyzed_at: result.analyzed_at
            });

          if (insertError) {
            console.error('Error inserting HEART result:', insertError);
          } else {
            storedCount++;
          }
        } catch (error) {
          console.error('Error storing HEART result:', error);
        }
      }

      // Generate insights
      const insights = await heartAnalyzer.generateHEARTInsights(heartResults);

      return NextResponse.json({
        success: true,
        message: `HEART analysis completed for ${heartResults.length} relevant items`,
        results: heartResults,
        insights: insights,
        analyzed_count: heartResults.length,
        stored_count: storedCount,
        total_processed: recentFeedback.length
      });

    } else {
      // Single analysis
      const heartResult = await heartAnalyzer.analyzeWithHEART(content, platform || 'unknown');
      
      if (!heartResult) {
        return NextResponse.json({
          success: false,
          message: 'Content not relevant for HEART analysis (not Gemini/Google related)',
          data: null
        });
      }
      
      // Store result if feedback_id provided
      if (feedback_id) {
        const supabase = createEdgeClient();
        try {
          const { error: insertError } = await supabase
            .from('heart_analysis')
            .upsert({
              feedback_id: feedback_id,
              happiness_csat: heartResult.happiness_csat,
              engagement: heartResult.engagement,
              adoption: heartResult.adoption,
              retention: heartResult.retention,
              task_success: heartResult.task_success,
              overall_score: heartResult.overall_score,
              main_point: heartResult.main_point,
              actionable: heartResult.actionable,
              priority: heartResult.priority,
              category: heartResult.category,
              analyzed_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error inserting HEART result:', insertError);
          }
        } catch (error) {
          console.error('Error storing HEART result:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'HEART analysis completed',
        data: heartResult
      });
    }

  } catch (error) {
    console.error('Error in HEART analysis API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to analyze with HEART',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createEdgeClient();
    
    // Get HEART analysis summary
    const { data: heartData, error: fetchError } = await supabase
      .from('heart_analysis')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching HEART data:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch HEART data' },
        { status: 500 }
      );
    }

    if (!heartData || heartData.length === 0) {
      return NextResponse.json({
        overall_heart_score: 0,
        happiness_csat: 0,
        engagement: 0,
        adoption: 0,
        retention: 0,
        task_success: 0,
        total_analyzed: 0,
        recent_analysis: [],
        message: 'No HEART analysis data available for Gemini API feedback. Run analysis first.'
      });
    }

    // Calculate averages with proper typing
    const averages = heartData.reduce((acc, item) => {
      acc.happiness_csat += item.happiness_csat;
      acc.engagement += item.engagement;
      acc.adoption += item.adoption;
      acc.retention += item.retention;
      acc.task_success += item.task_success;
      return acc;
    }, { happiness_csat: 0, engagement: 0, adoption: 0, retention: 0, task_success: 0 });

    const count = heartData.length;
    const totalSum = averages.happiness_csat + averages.engagement + averages.adoption + averages.retention + averages.task_success;
    const overall_heart_score = totalSum / (count * 5);

    return NextResponse.json({
      overall_heart_score: parseFloat(overall_heart_score.toFixed(2)),
      happiness_csat: parseFloat((averages.happiness_csat / count).toFixed(2)),
      engagement: parseFloat((averages.engagement / count).toFixed(2)),
      adoption: parseFloat((averages.adoption / count).toFixed(2)),
      retention: parseFloat((averages.retention / count).toFixed(2)),
      task_success: parseFloat((averages.task_success / count).toFixed(2)),
      total_analyzed: count,
      recent_analysis: heartData.slice(0, 10),
      message: `Gemini API HEART analysis based on ${count} relevant feedback items`
    });

  } catch (error) {
    console.error('Error fetching HEART data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HEART data' },
      { status: 500 }
    );
  }
} 