import { NextResponse } from 'next/server'
import { GeminiAPICollector } from '@/lib/collectors/gemini-api-collector'

export const runtime = 'edge'

export async function GET() {
  try {
    console.log('🔍 Testing Gemini API collection...')
    const collector = new GeminiAPICollector()
    
    // Collect data
    const data = await collector.collectFromGeminiAPICategory()
    
    console.log(`✅ Collected ${data.length} topics from Gemini API category`)
    
    // Store in database
    if (data.length > 0) {
      const storedData = await collector.storeInSupabase(data)
      console.log(`✅ Stored ${storedData?.length || 0} topics in database`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Gemini API collection test completed',
      collected: data.length,
      stored: data.length > 0 ? data.length : 0,
      sampleData: data.slice(0, 3)
    })
    
  } catch (error) {
    console.error('❌ Error in Gemini API test:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    )
  }
}
