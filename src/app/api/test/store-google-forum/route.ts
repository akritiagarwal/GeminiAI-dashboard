import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST() {
  try {
    const supabase = await createClient()

    const testPost = {
      platform: 'google_forum',
      content: 'Test Google Forum post content',
      title: 'Test Google Forum Post',
      author: 'testuser',
      url: 'https://discuss.ai.google.dev/t/test-post/12345',
      timestamp: new Date().toISOString(),
      metadata: {
        replies: 5,
        views: 100,
        tags: ['api', 'test'],
        category: 'test',
        source_id: '12345'
      }
    }

    console.log('Attempting to store test Google Forum post...')
    
    const { data, error } = await supabase
      .from('developer_feedback')
      .insert(testPost)
      .select()

    if (error) {
      console.error('Error storing test post:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      })
    }

    console.log('Successfully stored test post:', data)

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Exception in test store:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 