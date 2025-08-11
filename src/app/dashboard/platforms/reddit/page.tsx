'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Calendar,
  ExternalLink
} from 'lucide-react'

interface RedditPost {
  id: string
  platform: string
  content: string
  author: string
  url: string
  timestamp: string
  metadata: {
    title: string
    score: number
    comments: number
    subreddit: string
    source_id: string
    source_url: string
  }
}

export default function RedditPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchRedditData()
  }, [])

  const fetchRedditData = async () => {
    try {
      const response = await fetch('/api/test/recent-data')
      const data = await response.json()
      
      if (data.success) {
        const redditPosts = data.data.filter((post: any) => post.platform === 'reddit')
        setPosts(redditPosts)
      }
    } catch (error) {
      console.error('Error fetching Reddit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true
    if (filter === 'gemini' && post.metadata.subreddit?.toLowerCase().includes('gemini')) return true
    if (filter === 'chatgpt' && post.metadata.subreddit?.toLowerCase().includes('chatgpt')) return true
    if (filter === 'grok' && post.metadata.subreddit?.toLowerCase().includes('grok')) return true
    return false
  })

  const getSubredditColor = (subreddit: string) => {
    const colors = {
      'GeminiAI': 'bg-blue-100 text-blue-800',
      'GoogleAIStudio': 'bg-green-100 text-green-800',
      'GoogleGeminiAI': 'bg-purple-100 text-purple-800',
      'ChatGPT': 'bg-green-100 text-green-800',
      'GrokAI': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    }
    return colors[subreddit as keyof typeof colors] || colors.default
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Reddit Data</h1>
                <p className="text-gray-600">Developer discussions and feedback from Reddit communities</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
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
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Posts ({posts.length})
            </button>
            <button
              onClick={() => setFilter('gemini')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'gemini' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Gemini ({posts.filter(p => p.metadata.subreddit?.toLowerCase().includes('gemini')).length})
            </button>
            <button
              onClick={() => setFilter('chatgpt')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'chatgpt' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ChatGPT ({posts.filter(p => p.metadata.subreddit?.toLowerCase().includes('chatgpt')).length})
            </button>
            <button
              onClick={() => setFilter('grok')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'grok' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Grok ({posts.filter(p => p.metadata.subreddit?.toLowerCase().includes('grok')).length})
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
                      {post.metadata.title || post.content.substring(0, 100)}
                    </h3>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{post.metadata.score || 0} points</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.metadata.comments || 0} comments</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubredditColor(post.metadata.subreddit)}`}
                    >
                      r/{post.metadata.subreddit}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later for new posts.</p>
          </div>
        )}
      </div>
    </div>
  )
} 