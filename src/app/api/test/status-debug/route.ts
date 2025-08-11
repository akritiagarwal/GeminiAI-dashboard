import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all feedback data
    const { data: platformData, error } = await supabase
      .from('developer_feedback')
      .select('platform, created_at, metadata')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count by platform
    const platformCounts: { [key: string]: number } = {}
    const googleForumItems: any[] = []
    
    platformData?.forEach(item => {
      platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1
      
      if (item.metadata?.source === 'google_forum') {
        googleForumItems.push(item)
      }
    })

    return NextResponse.json({
      totalItems: platformData?.length || 0,
      platformCounts,
      googleForumItems: googleForumItems.length,
      sampleGoogleForum: googleForumItems.slice(0, 2),
      allPlatforms: Object.keys(platformCounts)
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 