import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Fixing platform constraint...')

    // Drop the existing constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE developer_feedback DROP CONSTRAINT IF EXISTS developer_feedback_platform_check;'
    })

    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError)
    }

    // Add the new constraint with google_forum and news
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE developer_feedback ADD CONSTRAINT developer_feedback_platform_check 
            CHECK (platform IN ('reddit', 'hackernews', 'google_forum', 'twitter', 'news'));`
    })

    if (addError) {
      console.error('❌ Error adding constraint:', addError)
      return NextResponse.json({
        success: false,
        error: addError.message
      }, { status: 500 })
    }

    console.log('✅ Platform constraint fixed!')

    // Test inserting google_forum data
    const { data: testData, error: testError } = await supabase
      .from('developer_feedback')
      .insert({
        platform: 'google_forum',
        content: 'Test post from Google Forum',
        author: 'test_user',
        title: 'Test Title',
        url: 'https://test.com'
      })
      .select()

    if (testError) {
      console.error('❌ Test insert failed:', testError)
      return NextResponse.json({
        success: false,
        error: testError.message,
        constraint_fixed: true
      }, { status: 500 })
    }

    console.log('✅ Test insert successful!')

    // Clean up test data
    await supabase
      .from('developer_feedback')
      .delete()
      .eq('content', 'Test post from Google Forum')

    return NextResponse.json({
      success: true,
      message: 'Platform constraint fixed and tested successfully',
      test_data: testData
    })

  } catch (error) {
    console.error('❌ Error fixing constraint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 