'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Target,
  Users2,
  Settings,
  Heart,
  Smile,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CollectionStatus {
  [key: string]: {
    lastCollection: string | null
    totalItems: number
    isActive: boolean
  }
}

interface RealDataMetrics {
  developerSentiment: number
  activeDiscussions: number
  criticalIssues: number
  platformActivity: number
  dataFreshness: string
  totalAnalyzed: number
  topFeature: string | null
  topBug: string | null
  winRate: number | null
}

// HEART Framework Types
export interface HEARTAnalysis {
  feedback_id: string;
  happiness_csat: number; // 1-5 scale (Google's CSAT)
  engagement: number; // 1-5 scale
  adoption: number; // 1-5 scale (1=considering, 5=advocating)
  retention: number; // 1-5 scale
  task_success: number; // 1-5 scale
  overall_score: number; // Average of all 5
  main_point: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'bug' | 'feature' | 'praise' | 'question' | 'comparison' | 'unknown';
  analyzed_at: string;
}

export interface HEARTMetrics {
  overall_heart_score: number;
  happiness_csat: number;
  engagement: number;
  adoption: number;
  retention: number;
  task_success: number;
  total_analyzed: number;
  recent_analysis: HEARTAnalysis[];
}

export default function Dashboard() {
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus | null>(null)
  const [metrics, setMetrics] = useState<RealDataMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch collection status
      const statusResponse = await fetch('/api/monitoring/control')
      const statusData = await statusResponse.json()
      setCollectionStatus(statusData.status)

      // Fetch real metrics
      const metricsResponse = await fetch('/api/dashboard/metrics')
      const metricsData = await metricsResponse.json()
      setMetrics(metricsData)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateMetric = (value: any, fallback = '--') => {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'number' && isNaN(value)) return fallback
    if (Array.isArray(value) && value.length === 0) return fallback
    return value
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PM Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time Developer Feedback & Competitive Intelligence</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Data Collection Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/platforms/reddit')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reddit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validateMetric(collectionStatus?.reddit?.totalItems, '0')}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${collectionStatus?.reddit?.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <MessageSquare className={`h-6 w-6 ${collectionStatus?.reddit?.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last: {collectionStatus?.reddit?.lastCollection ? new Date(collectionStatus.reddit.lastCollection).toLocaleDateString() : 'Never'}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/platforms/google-forum')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Google Forum</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validateMetric(collectionStatus?.google_forum?.totalItems, '0')}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${collectionStatus?.google_forum?.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Users className={`h-6 w-6 ${collectionStatus?.google_forum?.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last: {collectionStatus?.google_forum?.lastCollection ? new Date(collectionStatus.google_forum.lastCollection).toLocaleDateString() : 'Never'}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/platforms/hackernews')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hacker News</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validateMetric(collectionStatus?.hackernews?.totalItems, '0')}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${collectionStatus?.hackernews?.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <TrendingUp className={`h-6 w-6 ${collectionStatus?.hackernews?.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last: {collectionStatus?.hackernews?.lastCollection ? new Date(collectionStatus.hackernews.lastCollection).toLocaleDateString() : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Freshness Note */}
        {metrics?.dataFreshness && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <p className="text-sm text-blue-800">
                {metrics.dataFreshness} • {metrics.totalAnalyzed} posts analyzed
              </p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Developer Sentiment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validateMetric(metrics?.developerSentiment, '--')}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Based on {metrics?.totalAnalyzed || 0} analyzed posts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Discussions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validateMetric(metrics?.activeDiscussions, '0')}
                  </p>
                </div>
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validateMetric(metrics?.criticalIssues, '0')}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics?.criticalIssues === 0 ? 'No critical issues' : 'Bugs reported in last 7 days'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Platform Activity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validateMetric(metrics?.platformActivity, '0')}
                  </p>
                </div>
                <div className="w-6 h-6 text-purple-600">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 12h4l3-9 4 18 3-9h4"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Active platforms</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature/Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Sentiment Deep Dive</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Multi-dimensional sentiment analysis with emotion tracking and platform breakdowns.
              </p>
              <Link href="/dashboard/sentiment">
                <Button variant="outline" size="sm" className="w-full">
                  Explore insights
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Feature Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Feature request pipeline, competitive analysis, and prioritization tools.
              </p>
              <Link href="/dashboard/features">
                <Button variant="outline" size="sm" className="w-full">
                  View pipeline
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users2 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Competitive Intelligence</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Real-time competitor monitoring, market share analysis, and strategic insights.
              </p>
              <Link href="/dashboard/competition">
                <Button variant="outline" size="sm" className="w-full">
                  Monitor competition
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Monitoring Config</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Manage custom tags, keywords, and community monitoring settings.
              </p>
              <Link href="/dashboard/monitoring">
                <Button variant="outline" size="sm" className="w-full">
                  Configure monitoring
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Add this link to the navigation section */}
        <Link 
          href="/dashboard/heart" 
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Heart className="h-5 w-5 text-red-500" />
          <span>HEART Analysis</span>
        </Link>
      </div>
    </div>
  )
} 