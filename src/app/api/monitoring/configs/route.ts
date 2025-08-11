import { NextRequest, NextResponse } from 'next/server'
import { MonitoringConfigManager } from '@/lib/monitoring/config'

export const runtime = 'edge'

const configManager = new MonitoringConfigManager()

export async function GET(request: NextRequest) {
  try {
    const configs = await configManager.getActiveConfigs()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Error fetching configs:', error)
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, value, platform, priority } = body

    if (type === 'keyword') {
      await configManager.addKeyword(value, platform, priority)
    } else if (type === 'tag') {
      await configManager.addTag(value, platform)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding config:', error)
    return NextResponse.json({ error: 'Failed to add config' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = body

    await configManager.updateConfig(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')
    const id = searchParams.get('id')

    if (keyword) {
      await configManager.removeKeyword(keyword)
    } else if (id) {
      // For now, we'll just disable the config
      await configManager.toggleConfig(id, false)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing config:', error)
    return NextResponse.json({ error: 'Failed to remove config' }, { status: 500 })
  }
} 