import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check developer_feedback table
    const { data: feedback, error: feedbackError } = await supabase
      .from('developer_feedback')
      .select('*')
      .limit(10)

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError)
    }

    // Check daily_aggregates table
    const { data: aggregates, error: aggregatesError } = await supabase
      .from('daily_aggregates')
      .select('*')
      .limit(5)

    if (aggregatesError) {
      console.error('Error fetching aggregates:', aggregatesError)
    }

    return NextResponse.json({
      success: true,
      feedback: {
        count: feedback?.length || 0,
        sample: feedback?.slice(0, 3) || [],
        error: feedbackError
      },
      aggregates: {
        count: aggregates?.length || 0,
        sample: aggregates?.slice(0, 3) || [],
        error: aggregatesError
      }
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 