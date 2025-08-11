import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🧹 Starting Discord data cleanup...')
    
    // Delete all feedback with platform = 'discord'
    const { data: deletedFeedback, error: feedbackError } = await supabase
      .from('developer_feedback')
      .delete()
      .eq('platform', 'discord')
      .select()

    if (feedbackError) {
      console.error('Error deleting Discord feedback:', feedbackError)
      return NextResponse.json({ error: 'Failed to delete Discord feedback' }, { status: 500 })
    }

    console.log(`✅ Deleted ${deletedFeedback?.length || 0} Discord feedback items`)

    // Delete associated sentiment analysis
    if (deletedFeedback && deletedFeedback.length > 0) {
      const feedbackIds = deletedFeedback.map(item => item.id)
      
      const { data: deletedSentiment, error: sentimentError } = await supabase
        .from('sentiment_analysis')
        .delete()
        .in('feedback_id', feedbackIds)
        .select()

      if (sentimentError) {
        console.error('Error deleting Discord sentiment analysis:', sentimentError)
      } else {
        console.log(`✅ Deleted ${deletedSentiment?.length || 0} Discord sentiment analysis items`)
      }
    }

    // Update Google Forum data to use correct platform
    const { data: googleForumData, error: googleForumError } = await supabase
      .from('developer_feedback')
      .select('*')
      .eq('metadata->>source', 'google_forum')

    if (googleForumError) {
      console.error('Error fetching Google Forum data:', googleForumError)
    } else if (googleForumData && googleForumData.length > 0) {
      // Update platform from 'discord' to 'google_forum'
      const { error: updateError } = await supabase
        .from('developer_feedback')
        .update({ platform: 'google_forum' })
        .eq('metadata->>source', 'google_forum')
        .eq('platform', 'discord')

      if (updateError) {
        console.error('Error updating Google Forum platform:', updateError)
      } else {
        console.log(`✅ Updated ${googleForumData.length} Google Forum items to correct platform`)
      }
    }

    console.log('🎉 Discord cleanup complete!')

    return NextResponse.json({
      success: true,
      message: 'Discord data cleaned up successfully',
      deletedFeedback: deletedFeedback?.length || 0,
      updatedGoogleForum: googleForumData?.length || 0
    })
    
  } catch (error) {
    console.error('Error during Discord cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup Discord data' },
      { status: 500 }
    )
  }
} 