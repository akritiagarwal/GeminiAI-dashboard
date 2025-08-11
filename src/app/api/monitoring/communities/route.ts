import { NextRequest, NextResponse } from 'next/server'
import { MonitoringConfigManager } from '@/lib/monitoring/config'

export const runtime = 'edge'

const configManager = new MonitoringConfigManager()

export async function GET(request: NextRequest) {
  try {
    const communities = await configManager.getActiveCommunities()
    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, platform, type, monitoring_frequency } = body

    await configManager.addCommunity({
      name,
      url,
      platform,
      type,
      monitoring_frequency
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding community:', error)
    return NextResponse.json({ error: 'Failed to add community' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, enabled } = body

    await configManager.toggleCommunity(id, enabled)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json({ error: 'Failed to update community' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      await configManager.removeCommunity(id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing community:', error)
    return NextResponse.json({ error: 'Failed to remove community' }, { status: 500 })
  }
} 