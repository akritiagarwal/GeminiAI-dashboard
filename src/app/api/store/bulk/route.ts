import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback } = body;

    if (!feedback || !Array.isArray(feedback)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected feedback array.' },
        { status: 400 }
      );
    }

    console.log(`Processing ${feedback.length} feedback items...`);

    // Transform the data to match our database schema
    const transformedData = feedback.map((item: any) => ({
      content: (item.title || '') + '\n\n' + (item.content || item.selftext || ''),
      author: item.author || 'unknown',
      platform: item.platform || 'unknown',
      url: item.url || '',
      timestamp: new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      metadata: {
        title: item.title || '',
        score: item.score || 0,
        comments_count: item.comments_count || item.num_comments || 0,
        subreddit: item.metadata?.subreddit || 'unknown',
        raw_data: item.raw_data || {}
      }
    }));

    // Insert data into the database
    const { data, error } = await supabase
      .from('developer_feedback')
      .insert(transformedData);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to store data in database', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log(`Successfully stored ${transformedData.length} feedback items`);

    return NextResponse.json({
      success: true,
      message: `Successfully stored ${transformedData.length} feedback items`,
      stored_count: transformedData.length
    });

  } catch (error) {
    console.error('Error processing bulk store request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 