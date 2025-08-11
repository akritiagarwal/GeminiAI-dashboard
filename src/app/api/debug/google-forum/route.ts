import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    console.log('Debugging Google Forum API tag page...')
    
    const response = await fetch('https://discuss.ai.google.dev/tag/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    
    // Look for any topic-related content
    const topicMatches = html.match(/<a[^>]*href="\/t\/[^"]*"[^>]*>[^<]+<\/a>/g) || []
    const geminiMatches = html.match(/gemini/gi) || []
    
    // Extract a sample of the HTML around topic areas
    const sampleHtml = html.substring(0, 5000) // First 5000 characters
    
    return NextResponse.json({
      success: true,
      htmlLength: html.length,
      topicMatches: topicMatches.length,
      geminiMatches: geminiMatches.length,
      sampleTopicMatches: topicMatches.slice(0, 10),
      sampleHtml: sampleHtml
    })
  } catch (error) {
    console.error('Debug failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 