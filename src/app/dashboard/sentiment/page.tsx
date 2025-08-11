'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Download,
  ArrowLeft,
  MessageSquare,
  Users,
  TrendingUp as TrendingUpIcon
} from 'lucide-react'

interface SentimentData {
  overallSentiment: number
  platformSentiment: Array<{
    platform: string
    averageSentiment: number
    count: number
  }>
  recentSentiment: Array<{
    id: string
    platform: string
    content: string
    author: string
    sentiment: number
    timestamp: string
  }>
  totalAnalyzed: number
}

export default function SentimentPage() {
  const router = useRouter()
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSentimentData()
  }, [])

  const fetchSentimentData = async () => {
    try {
      const response = await fetch('/api/dashboard/sentiment')
      const data = await response.json()
      setSentimentData(data)
    } catch (error) {
      console.error('Error fetching sentiment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.7) return '#10B981' // Green
    if (sentiment >= 0.5) return '#3B82F6' // Blue
    if (sentiment >= 0.3) return '#F59E0B' // Yellow
    return '#EF4444' // Red
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment >= 0.7) return 'Positive'
    if (sentiment >= 0.5) return 'Neutral'
    if (sentiment >= 0.3) return 'Mixed'
    return 'Negative'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sentiment Deep Dive</h1>
                <p className="text-gray-600">Multi-dimensional sentiment analysis & insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Sentiment */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Developer Sentiment</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Sentiment</p>
                <p className="text-3xl font-bold" style={{ color: getSentimentColor(sentimentData?.overallSentiment || 0.5) }}>
                  {((sentimentData?.overallSentiment || 0.5) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {getSentimentLabel(sentimentData?.overallSentiment || 0.5)} • Based on {sentimentData?.totalAnalyzed || 0} posts
                </p>
              </div>
              <div className="w-24 h-24 rounded-full border-8 flex items-center justify-center" 
                   style={{ borderColor: getSentimentColor(sentimentData?.overallSentiment || 0.5) }}>
                <TrendingUpIcon className="w-8 h-8" style={{ color: getSentimentColor(sentimentData?.overallSentiment || 0.5) }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Platform Sentiment */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Platform Sentiment Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sentimentData?.platformSentiment.map((platform, index) => (
              <div key={platform.platform} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {platform.platform === 'google_forum' && <Users className="w-5 h-5 text-blue-600" />}
                    {platform.platform === 'reddit' && <MessageSquare className="w-5 h-5 text-orange-600" />}
                    {platform.platform === 'hackernews' && <TrendingUpIcon className="w-5 h-5 text-green-600" />}
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {platform.platform.replace('_', ' ')}
                    </h3>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: getSentimentColor(platform.averageSentiment) }}>
                    {(platform.averageSentiment * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {getSentimentLabel(platform.averageSentiment)} • {platform.count} posts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Sentiment */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Sentiment Analysis</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sentimentData?.recentSentiment.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {item.platform.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${item.sentiment * 100}%`,
                                backgroundColor: getSentimentColor(item.sentiment)
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium" style={{ color: getSentimentColor(item.sentiment) }}>
                            {(item.sentiment * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 