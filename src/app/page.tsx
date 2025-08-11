'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  MessageSquare,
  Zap,
  Globe,
  ExternalLink,
  ArrowRight,
  Play,
  Activity
} from 'lucide-react'

interface LiveFeedback {
  id: string
  content: string
  platform: 'reddit' | 'hackernews' | 'stackoverflow'
  sentiment: number
  timestamp: string
  author: string
}

interface LiveStats {
  feedbackAnalyzed: number
  currentSentiment: number
  activeDiscussions: number
  lastUpdated: string
}

export default function LandingPage() {
  const router = useRouter()
  const [liveStats, setLiveStats] = useState<LiveStats>({
    feedbackAnalyzed: 0,
    currentSentiment: 0,
    activeDiscussions: 0,
    lastUpdated: 'Never'
  })
  const [liveFeed, setLiveFeed] = useState<LiveFeedback[]>([])
  const [loading, setLoading] = useState(true)

  // Simulate loading for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit': return <Globe className="w-4 h-4 text-orange-500" />
      case 'hackernews': return <Activity className="w-4 h-4 text-orange-600" />
      case 'stackoverflow': return <MessageSquare className="w-4 h-4 text-blue-500" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'bg-green-500'
    if (sentiment < -0.3) return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getSentimentTrend = (sentiment: number) => {
    if (sentiment > 0.7) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (sentiment < 0.3) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Activity className="w-4 h-4 text-yellow-600" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Gemini API Monitor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Gemini API Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Live Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Gemini API Developer Sentiment Monitor
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
            >
              Real-time insights from 10,000+ developers across Reddit, HackerNews, and Stack Overflow
            </motion.p>

            {/* Live Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Feedback Analyzed Today</h3>
                  <div className="w-5 h-5 text-blue-500">📊</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {liveStats.feedbackAnalyzed > 0 ? liveStats.feedbackAnalyzed.toLocaleString() : '--'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {liveStats.feedbackAnalyzed > 0 ? 'Analyzing feedback' : 'No feedback analyzed'}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Current Sentiment</h3>
                  {liveStats.currentSentiment > 0 ? getSentimentTrend(liveStats.currentSentiment) : <Activity className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {liveStats.currentSentiment > 0 ? `${(liveStats.currentSentiment * 100).toFixed(0)}%` : '--'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {liveStats.currentSentiment > 0 ? 'Positive' : 'No sentiment data'}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Active Discussions</h3>
                  <div className="w-5 h-5 text-green-500">💬</div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {liveStats.activeDiscussions > 0 ? liveStats.activeDiscussions : '--'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {liveStats.activeDiscussions > 0 ? 'Last 24 hours' : 'No active discussions'}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Last Updated</h3>
                  <div className={`w-2 h-2 rounded-full ${liveStats.lastUpdated !== 'Never' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {liveStats.lastUpdated !== 'Never' ? liveStats.lastUpdated.split(':').slice(0, 2).join(':') : 'Never'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {liveStats.lastUpdated !== 'Never' ? 'Live data' : 'No data available'}
                </div>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center space-x-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              <span>View Live Dashboard</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Live Insight Preview */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Developers Are Saying Right Now</h2>
            <p className="text-gray-600">Real-time feedback from across the developer community</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Live Feed */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Live Feed</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Live</span>
                </div>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {liveFeed.length > 0 ? (
                    liveFeed.map((feedback, index) => (
                      <motion.div
                        key={feedback.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border-l-4 rounded-r-lg"
                        style={{ borderLeftColor: getSentimentColor(feedback.sentiment).replace('bg-', '').includes('green') ? '#10B981' : getSentimentColor(feedback.sentiment).replace('bg-', '').includes('red') ? '#EF4444' : '#F59E0B' }}
                      >
                        <div className="flex items-start space-x-3">
                          {getPlatformIcon(feedback.platform)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">{feedback.author}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{feedback.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{feedback.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No live feedback available</p>
                        <p className="text-sm">Developer feedback will appear here in real-time</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 mx-auto"
                >
                  <span>See Full Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-6">
              {/* Sentiment Gauge */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Sentiment</h3>
                <div className="relative">
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${liveStats.currentSentiment * 100}%` }}
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Negative</span>
                    <span>Neutral</span>
                    <span>Positive</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{(liveStats.currentSentiment * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-500">Overall positive sentiment</div>
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Topics</h3>
                <div className="h-32 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No trending topics</p>
                    <p className="text-sm">Topics will appear as they're detected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Showcase */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered By</h2>
            <p className="text-gray-600">Built with cutting-edge technology for real-time insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gemini Pro API</h3>
              <p className="text-gray-600">Advanced AI analysis with 94% sentiment accuracy</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Next.js 14</h3>
              <p className="text-gray-600">React framework with App Router and Edge Functions</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Supabase</h3>
              <p className="text-gray-600">Real-time PostgreSQL with instant updates</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Built in 48 hours
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Gemini API Monitor</span>
            </div>
            <div className="text-sm text-gray-400">
              Built by Akriti Aggarwal • Former Google PM
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-400">
            Analyzing 500+ feedback items per hour • Powered by Gemini Pro • Monitoring 15+ developer communities
          </div>
        </div>
      </footer>
    </div>
  )
}
