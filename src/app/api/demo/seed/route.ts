import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

const demoFeedback = [
  {
    platform: 'google_forum',
    content: 'Having issues with Gemini API rate limits. Getting 429 errors even though I\'m well under the quota.',
    title: 'Rate Limit Issues with Gemini API',
    author: 'dev_user_123',
    url: 'https://discuss.ai.google.dev/t/rate-limit-issues/12345',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    metadata: { replies: 5, views: 120, tags: ['api', 'bug'], category: '4' }
  },
  {
    platform: 'google_forum',
    content: 'The multimodal capabilities in Gemini Pro are incredible! Processing images and text together seamlessly.',
    title: 'Gemini Pro Multimodal Features',
    author: 'ai_researcher',
    url: 'https://discuss.ai.google.dev/t/multimodal-features/12346',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    metadata: { replies: 12, views: 340, tags: ['models', 'multimodal'], category: '4' }
  },
  {
    platform: 'reddit',
    content: 'Just migrated from OpenAI to Gemini API. The function calling is much more reliable than GPT-4.',
    title: 'Switched to Gemini API - Function Calling is Superior',
    author: 'ml_engineer',
    url: 'https://reddit.com/r/GeminiAI/comments/12345',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    metadata: { subreddit: 'GeminiAI', score: 45, comments: 8 }
  },
  {
    platform: 'reddit',
    content: 'Documentation could be better, but the API itself is solid. Much more stable than alternatives.',
    title: 'Gemini API Review - Solid but Documentation Needs Work',
    author: 'startup_cto',
    url: 'https://reddit.com/r/MachineLearning/comments/12346',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    metadata: { subreddit: 'MachineLearning', score: 23, comments: 5 }
  },
  {
    platform: 'hackernews',
    content: 'Why doesn\'t Gemini support streaming responses yet? This is table stakes for production apps.',
    title: 'Gemini API Missing Streaming Support',
    author: 'backend_dev',
    url: 'https://news.ycombinator.com/item?id=12345',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    metadata: { points: 67, comments: 12 }
  }
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Clear existing demo data
    const { error: deleteError } = await supabase
      .from('developer_feedback')
      .delete()
      .eq('metadata->demo_data', true)

    if (deleteError) {
      console.error('Error clearing demo data:', deleteError)
    }

    // Insert demo data
    for (const feedback of demoFeedback) {
      const { error } = await supabase
        .from('developer_feedback')
        .insert({
          ...feedback,
          metadata: {
            ...feedback.metadata,
            demo_data: true,
            source_id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          },
          raw_data: feedback
        })

      if (error) {
        console.error('Error inserting demo feedback:', error)
      }
    }

    // Generate some sentiment analysis data
    const sentimentData = [
      { sentiment_score: 0.8, feedback_id: 1, timestamp: new Date().toISOString() },
      { sentiment_score: 0.9, feedback_id: 2, timestamp: new Date().toISOString() },
      { sentiment_score: 0.7, feedback_id: 3, timestamp: new Date().toISOString() },
      { sentiment_score: 0.6, feedback_id: 4, timestamp: new Date().toISOString() },
      { sentiment_score: 0.3, feedback_id: 5, timestamp: new Date().toISOString() }
    ]

    for (const sentiment of sentimentData) {
      const { error } = await supabase
        .from('sentiment_analysis')
        .insert({
          ...sentiment,
          metadata: { demo_data: true }
        })

      if (error) {
        console.error('Error inserting sentiment data:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      count: demoFeedback.length
    })
  } catch (error) {
    console.error('Error seeding demo data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return demo status
    return NextResponse.json({ 
      status: 'ready',
      message: 'Demo generator is ready to use',
      available_scenarios: [
        'positive_momentum',
        'feature_request', 
        'competitive_win',
        'urgent_issue'
      ]
    })
  } catch (error) {
    console.error('Error getting demo status:', error)
    return NextResponse.json({ 
      error: 'Failed to get demo status' 
    }, { status: 500 })
  }
} 