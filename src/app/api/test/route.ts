import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Running API tests...')
    
    // Test environment variables
    const envResults: Record<string, boolean> = {}
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'GOOGLE_GENERATIVE_AI_API_KEY',
      'REDDIT_USER_AGENT'
    ]
    
    for (const varName of requiredVars) {
      envResults[varName] = !!process.env[varName]
    }
    
    // Test Reddit API
    let redditTestResult = { success: false, message: '', data: null }
    try {
      const testUrl = 'https://www.reddit.com/r/MachineLearning/search.json?q=gemini+api&sort=new&limit=3'
      const response = await fetch(testUrl, {
        headers: {
          'User-Agent': process.env.REDDIT_USER_AGENT || 'GeminiPMDashboard/1.0 (by /u/test)'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        redditTestResult = {
          success: true,
          message: `Found ${data.data.children.length} posts`,
          data: data.data.children.slice(0, 2).map((child: { data: { title: string; author: string; score: number; subreddit: string } }) => ({
            title: child.data.title,
            author: child.data.author,
            score: child.data.score,
            subreddit: child.data.subreddit
          }))
        }
      } else {
        redditTestResult = {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          data: null
        }
      }
    } catch (error) {
      redditTestResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envResults,
      reddit: redditTestResult,
      summary: {
        envVarsSet: Object.values(envResults).filter(Boolean).length,
        totalEnvVars: requiredVars.length,
        redditWorking: redditTestResult.success
      }
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 