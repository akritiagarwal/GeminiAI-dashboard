import { NextResponse } from 'next/server'
import { GoogleForumsCollector } from '@/lib/collectors/google-forums-collector'

export const runtime = 'edge'

export async function GET() {
  try {
    console.log('🔍 Testing Google Forums collector...')
    
    const collector = new GoogleForumsCollector()
    const data = await collector.collectFromForum()
    
    console.log(`✅ Collected ${data.length} items from Google Forums`)
    
    return NextResponse.json({
      success: true,
      count: data.length,
      sample: data.slice(0, 3),
      platforms: data.map(item => item.platform)
    })
    
  } catch (error) {
    console.error('❌ Google Forums test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 