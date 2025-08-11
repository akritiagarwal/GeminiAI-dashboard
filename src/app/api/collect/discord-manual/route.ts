import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { content, author, channelId, guildId } = await request.json()
    const supabase = await createClient()

    const { error } = await supabase
      .from('developer_feedback')
      .insert({
        platform: 'discord',
        content: content,
        author: author,
        url: `https://discord.com/channels/${guildId}/${channelId}/${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {
          channel_id: channelId,
          guild_id: guildId,
          source_id: Date.now().toString(),
          manual_entry: true
        },
        raw_data: {
          content,
          author,
          channel_id: channelId,
          guild_id: guildId,
          timestamp: new Date().toISOString()
        }
      })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Discord message added successfully'
    })
  } catch (error) {
    console.error('Error adding Discord message:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 