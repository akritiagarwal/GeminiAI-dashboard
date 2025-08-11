'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  Calendar,
  ExternalLink
} from 'lucide-react'

interface HackerNewsPost {
  id: string
  platform: string
  content: string
  author: string
  url: string
  timestamp: string
  metadata: {
    url: string
    type: string
    score: number
    story_id: number
    descendants: number
  }
}

export default function HackerNewsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<HackerNewsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchHackerNewsData()
  }, [])

  const fetchHackerNewsData = async () => {
    try {
      const response = await fetch('/api/test/recent-data')
      const data = await response.json()
      
      if (data.success) {
        const hnPosts = data.data.filter((post: any) => post.platform === 'hackernews')
        setPosts(hnPosts)
      }
    } catch (error) {
      console.error('Error fetching Hacker News data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true
    if (filter === 'stories' && post.metadata.type === 'story') return true
    if (filter === 'comments' && post.metadata.type === 'comment') return true
    if (filter === 'high-score' && (post.metadata.score || 0) > 100) return true
    return false
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
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
                <h1 className="text-2xl font-bold text-gray-900">Hacker News Data</h1>
                <p className="text-gray-600">Developer discussions and tech news from Hacker News</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-500">{posts.length} posts collected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Posts ({posts.length})
            </button>
            <button
              onClick={() => setFilter('stories')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'stories' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Stories ({posts.filter(p => p.metadata.type === 'story').length})
            </button>
            <button
              onClick={() => setFilter('comments')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'comments' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Comments ({posts.filter(p => p.metadata.type === 'comment').length})
            </button>
            <button
              onClick={() => setFilter('high-score')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'high-score' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              High Score ({posts.filter(p => (p.metadata.score || 0) > 100).length})
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {post.content}
                    </h3>
                    {post.metadata.url && (
                      <a
                        href={post.metadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{post.metadata.score || 0} points</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.metadata.descendants || 0} comments</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.metadata.type === 'story' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {post.metadata.type}
                    </span>
                    {post.metadata.score && post.metadata.score > 100 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        High Score
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later for new posts.</p>
          </div>
        )}
      </div>
    </div>
  )
} 