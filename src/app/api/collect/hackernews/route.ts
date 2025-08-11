import { NextResponse } from 'next/server'
import { hackerNewsCollector } from '@/lib/collectors/hackernews'

export const runtime = 'edge'

export async function POST() {
  try {
    console.log('Hacker News collection API endpoint triggered')
    
    const result = await hackerNewsCollector.collectData()
    
    return NextResponse.json({
      success: true,
      message: 'Hacker News data collection completed',
      data: result
    })
  } catch (error) {
    console.error('Error in Hacker News collection API:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to collect Hacker News data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const lastCollectionTime = await hackerNewsCollector.getLastCollectionTime()
    
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