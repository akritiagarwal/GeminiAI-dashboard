import { NextRequest, NextResponse } from 'next/server'
import { MonitoringOrchestrator } from '@/lib/monitoring/orchestrator'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { action, daysBack = 7 } = await request.json()
    const orchestrator = new MonitoringOrchestrator()

    switch (action) {
      case 'collect_data':
        console.log('Starting data collection...')
        const result = await orchestrator.collectAllData(daysBack)
        
        // Update dashboard metrics after collection
        await orchestrator.updateDashboardMetrics()
        
        return NextResponse.json({
          success: true,
          message: 'Data collection completed',
          result
        })

      case 'update_metrics':
        console.log('Updating dashboard metrics...')
        await orchestrator.updateDashboardMetrics()
        
        return NextResponse.json({
          success: true,
          message: 'Dashboard metrics updated'
        })

      case 'get_status':
        console.log('Getting collection status...')
        const status = await orchestrator.getCollectionStatus()
        
        return NextResponse.json({
          success: true,
          status
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in monitoring control:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const orchestrator = new MonitoringOrchestrator()
    const status = await orchestrator.getCollectionStatus()
    
    return NextResponse.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('Error getting monitoring status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 