import { NextRequest, NextResponse } from 'next/server'
import { GoogleForumMonitor } from '@/lib/collectors/google-forum-monitor'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Google Forum data collection (tag-based)...')
    
    const monitor = new GoogleForumMonitor()
    const data = await monitor.collectAllData(7)
    
    return NextResponse.json({
      success: true,
      message: 'Google Forum test completed (tag-based)',
      data: {
        totalPosts: data.totalPosts,
        posts: data.posts.slice(0, 5), // Show first 5 posts
        lastUpdated: data.lastUpdated
      }
    })
  } catch (error) {
    console.error('Google Forum test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 