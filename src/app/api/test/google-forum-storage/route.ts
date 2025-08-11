import { NextRequest, NextResponse } from 'next/server'
import { GoogleForumMonitor } from '@/lib/collectors/google-forum-monitor'

export const runtime = 'edge'

export async function GET() {
  try {
    console.log('Testing Google Forum storage...')
    
    const monitor = new GoogleForumMonitor()
    
    // Collect data
    const data = await monitor.collectAllData(7)
    console.log(`Collected ${data.posts.length} posts`)
    
    // Try to store data
    await monitor.storeInSupabase(data.posts)
    
    // Check if data was stored
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    const { data: storedData, error } = await supabase
      .from('developer_feedback')
      .select('*')
      .eq('platform', 'google_forum')
      .limit(5)
    
    if (error) {
      console.error('Error checking stored data:', error)
    }
    
    return NextResponse.json({
      success: true,
      collected: data.posts.length,
      stored: storedData?.length || 0,
      sampleStored: storedData?.slice(0, 2) || [],
      sampleCollected: data.posts.slice(0, 2).map(p => ({
        id: p.id,
        title: p.title,
        author: p.author,
        url: p.url
      }))
    })
  } catch (error) {
    console.error('Google Forum storage test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 