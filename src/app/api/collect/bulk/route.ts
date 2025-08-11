import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { data } = await request.json()
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      )
    }

    console.log(`📦 Received ${data.length} items for bulk storage`)

    const supabase = await createClient()
    
    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No data to store',
        stored: 0
      })
    }

    // Remove duplicates based on platform, content, and author
    const uniqueData = data.filter((item, index, self) => 
      index === self.findIndex(t => 
        t.platform === item.platform && 
        t.content === item.content && 
        t.author === item.author
      )
    )

    console.log(`📦 Storing ${uniqueData.length} unique items (removed ${data.length - uniqueData.length} duplicates)`)

    const { data: insertedData, error } = await supabase
      .from('developer_feedback')
      .insert(uniqueData)
      .select()

    if (error) {
      console.error('❌ Error inserting bulk data:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully stored ${insertedData?.length || 0} items`)

    return NextResponse.json({
      success: true,
      message: 'Bulk data stored successfully',
      received: data.length,
      stored: insertedData?.length || 0,
      duplicates: data.length - (insertedData?.length || 0)
    })

  } catch (error) {
    console.error('❌ Error in bulk storage:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 