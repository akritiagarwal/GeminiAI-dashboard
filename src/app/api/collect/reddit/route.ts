import { NextResponse } from 'next/server'
import { redditCollector } from '@/lib/collectors/reddit'

export const runtime = 'edge'

export async function POST() {
  try {
    console.log('Reddit collection API endpoint triggered')
    
    const result = await redditCollector.collectData()
    
    return NextResponse.json({
      success: true,
      message: 'Reddit data collection completed',
      data: result
    })
  } catch (error) {
    console.error('Error in Reddit collection API:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to collect Reddit data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const lastCollectionTime = await redditCollector.getLastCollectionTime()
    
    return NextResponse.json({
      success: true,
      lastCollectionTime: lastCollectionTime?.toISOString() || null,
      message: lastCollectionTime 
        ? `Last collection: ${lastCollectionTime.toLocaleString()}`
        : 'No previous collections found'
    })
  } catch (error) {
    console.error('Error getting last collection time:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get last collection time',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 