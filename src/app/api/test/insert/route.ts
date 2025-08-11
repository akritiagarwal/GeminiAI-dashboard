import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test data
    const testData = {
      platform: 'google_forum',
      content: 'Test post from Google Forum',
      author: 'testuser',
      url: 'https://discuss.ai.google.dev/t/test/123',
      timestamp: new Date().toISOString(),
      metadata: {
        title: 'Test Post',
        replies: 0,
        views: 1,
        tags: ['test'],
        category: 'test',
        source_id: '123'
      }
    }

    console.log('Attempting to insert test data...')
    
    const { data, error } = await supabase
      .from('developer_feedback')
      .insert(testData)
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      })
    }

    console.log('Insert successful:', data)
    
    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Test insert error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 