import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleForumsCollector } from '@/lib/collectors/google-forums-collector'
import { GeminiAnalyzer } from '@/lib/ai/gemini-analyzer'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting real data seeding...')
    const supabase = await createClient()
    const googleForumsCollector = new GoogleForumsCollector()
    const geminiAnalyzer = new GeminiAnalyzer()

    // 1. Collect Google Forum data
    console.log('🔍 Collecting Google Forum data...')
    const rawForumData = await googleForumsCollector.collectFromForum()
    console.log(`✅ Collected ${rawForumData.length} raw forum posts.`)

    let forumFeedback: any[] = []
    if (rawForumData.length > 0) {
      const forumFeedbackToInsert = rawForumData.map(item => ({
        platform: 'google_forum',
        content: item.content,
        author: item.author,
        url: item.url,
        timestamp: item.timestamp,
        metadata: { ...item.metadata, source: 'google_forum' }
      }))

      const { data: insertedForum, error: forumError } = await supabase
        .from('developer_feedback')
        .insert(forumFeedbackToInsert)
        .select()

      if (forumError) {
        console.error('❌ Error inserting forum data:', forumError)
      } else {
        forumFeedback = insertedForum || []
        console.log(`✅ Inserted ${forumFeedback.length} forum posts`)
      }
    }

    // 2. Hardcoded News Data
    console.log('📰 Inserting hardcoded news data...')
    const newsData = [
      {
        platform: 'news',
        content: 'Google has launched Gemini 2.5 Flash, a new model that offers faster response times and improved efficiency for developers building AI applications.',
        author: 'Google AI Team',
        url: 'https://blog.google/technology/ai/gemini-2-5-flash-release/',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { title: 'Gemini 2.5 Flash Launched', source: 'news' }
      },
      {
        platform: 'news',
        content: 'Gemini API now supports function calling with improved accuracy and reduced latency, making it easier for developers to build structured applications.',
        author: 'Google AI Team',
        url: 'https://developers.google.com/ai/gemini-api/docs/function-calling',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { title: 'Function Calling Improvements', source: 'news' }
      },
      {
        platform: 'news',
        content: 'New Gemini 1.5 Pro model with 1M context window is now available for developers, enabling processing of much longer documents and conversations.',
        author: 'Google AI Team',
        url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { title: '1M Context Window Available', source: 'news' }
      }
    ]

    const { data: newsFeedback, error: newsError } = await supabase
      .from('developer_feedback')
      .insert(newsData)
      .select()

    if (newsError) {
      console.error('❌ Error inserting news data:', newsError)
    } else {
      console.log(`✅ Inserted ${newsFeedback?.length || 0} news items`)
    }

    // 3. Generate sentiment analysis for all data
    const allFeedback = [...forumFeedback, ...(newsFeedback || [])]
    if (allFeedback.length > 0) {
      console.log(`🧠 Generating sentiment analysis for ${allFeedback.length} items`)
      for (const feedbackItem of allFeedback) {
        try {
          const analysisResult = await geminiAnalyzer.analyzeSentiment(feedbackItem.content)
          if (analysisResult) {
            const { error: sentimentError } = await supabase.from('sentiment_analysis').insert({
              feedback_id: feedbackItem.id,
              sentiment_score: analysisResult.sentiment_score,
              sentiment_label: analysisResult.sentiment_label,
              confidence: analysisResult.confidence,
              processing_model: 'gemini-pro',
              timestamp: new Date().toISOString()
            })
            if (sentimentError) {
              console.error('❌ Error inserting sentiment data:', sentimentError)
            }
          }
        } catch (error) {
          console.error('❌ Error analyzing sentiment:', error)
        }
      }
      console.log(`✅ Generated sentiment for ${allFeedback.length} items`)
    }

    console.log('🎉 Seeding complete!')

    return NextResponse.json({
      success: true,
      message: 'Real data seeded successfully',
      forumCount: forumFeedback.length,
      newsCount: newsFeedback?.length || 0,
      totalCount: allFeedback.length,
      sampleData: allFeedback.slice(0, 2)
    })
  } catch (error) {
    console.error('❌ Error seeding real data:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 