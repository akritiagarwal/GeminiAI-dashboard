import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Single test item
    const testItem = {
      platform: 'google_forum',
      content: 'Test Google Forum post',
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

    console.log('Testing single insert with:', testItem)
    
    const { data, error } = await supabase
      .from('developer_feedback')
      .insert(testItem)
      .select()

    if (error) {
      console.error('Single insert error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      })
    }

    console.log('Single insert successful:', data)
    
    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Single insert test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 