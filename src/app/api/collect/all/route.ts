import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RedditCollector } from '@/lib/collectors/reddit-collector';
import { GoogleForumsCollector } from '@/lib/collectors/google-forums-collector';
import { HackerNewsCollector } from '@/lib/collectors/hackernews-collector';
import { DevToCollector } from '@/lib/collectors/devto-collector';
import { GeminiAnalyzer } from '@/lib/ai/gemini-analyzer';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const analyzer = new GeminiAnalyzer();
    
    console.log('Starting comprehensive data collection...');
    
    // Collect from all sources in parallel
    const [redditData, googleData, hnData, devtoData] = await Promise.all([
      new RedditCollector().collectAll(),
      new GoogleForumsCollector().collectFromForum(),
      new HackerNewsCollector().collect(),
      new DevToCollector().collect()
    ]);

    const allData = [...redditData, ...googleData, ...hnData, ...devtoData];
    
    console.log(`Collected ${allData.length} total items`);
    
    // Process in batches
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);
      
      // Save raw feedback
      const { data: savedFeedback } = await supabase
        .from('developer_feedback')
        .insert(batch)
        .select();

      // Analyze with Gemini
      if (savedFeedback) {
        for (const item of savedFeedback) {
          const analysis = await analyzer.analyzeFeedback(item.content);
          
          await supabase.from('sentiment_analysis').insert({
            feedback_id: item.id,
            sentiment_score: analysis.sentiment_score,
            sentiment_label: analysis.sentiment_label,
            confidence: 0.8,
            processing_model: 'gemini-pro',
            analyzed_at: new Date().toISOString(),
            metadata: {
              is_about_gemini: analysis.is_about_gemini,
              apis_mentioned: analysis.apis_mentioned,
              key_topics: analysis.key_topics,
              is_comparison: analysis.is_comparison,
              comparison_winner: analysis.comparison_winner,
              feature_request: analysis.feature_request,
              bug_report: analysis.bug_report,
              praise_point: analysis.praise_point,
              pain_point: analysis.pain_point,
              actionable: analysis.actionable,
              priority: analysis.priority,
              summary: analysis.summary
            }
          });
          
          results.push({
            platform: item.platform,
            sentiment: analysis.sentiment_label
          });
        }
      }

      // Add delay to respect Gemini rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update metrics
    await updateDailyMetrics(supabase, results);

    return NextResponse.json({
      success: true,
      collected: allData.length,
      analyzed: results.length,
      breakdown: {
        reddit: redditData.length,
        google_forums: googleData.length,
        hackernews: hnData.length,
        devto: devtoData.length
      }
    });

  } catch (error) {
    console.error('Collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect data' },
      { status: 500 }
    );
  }
}

async function updateDailyMetrics(supabase: any, results: any[]) {
  const today = new Date().toISOString().split('T')[0];
  
  const platformCounts = results.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1;
    return acc;
  }, {});

  await supabase
    .from('daily_aggregates')
    .upsert({
      date: today,
      platform: 'all',
      total_feedback: results.length,
      average_sentiment: 0.7,
      active_platforms: Object.keys(platformCounts).length,
      critical_issues: results.filter(r => r.sentiment === 'negative').length,
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'date'
    });
} 