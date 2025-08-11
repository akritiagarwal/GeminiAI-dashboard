'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  Users,
  Target,
  MessageSquare,
  Play,
  GitBranch,
  Download,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react'

// Mock data for feature analytics
const mockFeaturePipeline = {
  new: { count: 12, trend: 0.25, features: ['Real-time streaming', 'Custom models', 'Batch processing'] },
  trending: { count: 8, trend: 0.15, features: ['Multi-modal support', 'Fine-tuning API', 'Enterprise SSO'] },
  validated: { count: 15, trend: 0.08, features: ['Advanced analytics', 'Webhook management', 'Rate limiting'] },
  inDevelopment: { count: 6, trend: 0, features: ['Documentation v2', 'SDK improvements', 'Cost optimization'] },
  shipped: { count: 23, trend: 0.12, features: ['Chat completions', 'Embeddings', 'Moderation'] }
}

const mockCompetitorComparison = [
  {
    feature: 'Real-time Streaming',
    gemini: { available: true, quality: 0.9 },
    openai: { available: true, quality: 0.85 },
    claude: { available: false, quality: 0 },
    others: { available: true, quality: 0.7 }
  },
  {
    feature: 'Multi-modal Support',
    gemini: { available: true, quality: 0.95 },
    openai: { available: true, quality: 0.9 },
    claude: { available: true, quality: 0.88 },
    others: { available: false, quality: 0 }
  },
  {
    feature: 'Fine-tuning API',
    gemini: { available: false, quality: 0 },
    openai: { available: true, quality: 0.8 },
    claude: { available: false, quality: 0 },
    others: { available: true, quality: 0.6 }
  },
  {
    feature: 'Enterprise SSO',
    gemini: { available: false, quality: 0 },
    openai: { available: true, quality: 0.85 },
    claude: { available: true, quality: 0.8 },
    others: { available: true, quality: 0.7 }
  }
]

const mockFeatureImpact = [
  {
    feature: 'Chat Completions',
    beforeSentiment: 0.65,
    afterSentiment: 0.89,
    adoption: 0.78,
    feedback: 'Game-changer for our chatbot'
  },
  {
    feature: 'Embeddings API',
    beforeSentiment: 0.55,
    afterSentiment: 0.82,
    adoption: 0.65,
    feedback: 'Much better than alternatives'
  },
  {
    feature: 'Moderation',
    beforeSentiment: 0.45,
    afterSentiment: 0.75,
    adoption: 0.45,
    feedback: 'Essential for production use'
  }
]

const mockVoiceOfDeveloper = [
  {
    quote: "The new streaming API is incredible! Reduced our response time by 60%.",
    author: "Sarah Chen, Senior Dev",
    company: "TechCorp",
    sentiment: 0.95,
    feature: "Real-time Streaming"
  },
  {
    quote: "Finally, proper multi-modal support. This is exactly what we needed.",
    author: "Mike Rodriguez",
    company: "StartupXYZ",
    sentiment: 0.88,
    feature: "Multi-modal Support"
  },
  {
    quote: "The documentation could be better, but the API itself is solid.",
    author: "Alex Thompson",
    company: "DevStudio",
    sentiment: 0.65,
    feature: "Documentation"
  }
]

const mockPrioritizationMatrix = [
  {
    feature: 'Fine-tuning API',
    reach: 0.8,
    impact: 0.9,
    confidence: 0.7,
    effort: 0.6,
    rice: 0.84
  },
  {
    feature: 'Enterprise SSO',
    reach: 0.6,
    impact: 0.8,
    confidence: 0.9,
    effort: 0.4,
    rice: 0.72
  },
  {
    feature: 'Advanced Analytics',
    reach: 0.7,
    impact: 0.7,
    confidence: 0.8,
    effort: 0.5,
    rice: 0.78
  }
]

export default function FeaturesPage() {
  const router = useRouter()
  const [showMatrix, setShowMatrix] = useState(true)
  const [dragMode, setDragMode] = useState(false)

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return '#3B82F6'
      case 'trending': return '#F59E0B'
      case 'validated': return '#10B981'
      case 'inDevelopment': return '#8B5CF6'
      case 'shipped': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'new': return <Plus className="w-4 h-4" />
      case 'trending': return <TrendingUp className="w-4 h-4" />
      case 'validated': return <CheckCircle className="w-4 h-4" />
      case 'inDevelopment': return <Clock className="w-4 h-4" />
      case 'shipped': return <Star className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 0.9) return '#10B981'
    if (quality >= 0.7) return '#3B82F6'
    if (quality >= 0.5) return '#F59E0B'
    return '#EF4444'
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
                <h1 className="text-2xl font-bold text-gray-900">Feature Analytics</h1>
                <p className="text-gray-600">Feature request pipeline, competitive analysis & prioritization</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setDragMode(!dragMode)}
                className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 ${
                  dragMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>{dragMode ? 'Exit' : 'Prioritize'}</span>
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Request Pipeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Feature Request Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Object.entries(mockFeaturePipeline).map(([stage, data]) => (
              <motion.div 
                key={stage}
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: getStageColor(stage) }}
                    >
                      {getStageIcon(stage)}
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 capitalize">{stage}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{data.count}</div>
                    <div className="text-sm text-green-600">+{Math.round(data.trend * 100)}%</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {data.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="text-sm text-gray-600 truncate">
                      • {feature}
                    </div>
                  ))}
                  {data.features.length > 2 && (
                    <div className="text-sm text-gray-500">
                      +{data.features.length - 2} more
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Feature Comparison Matrix */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Comparison Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Feature</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Gemini</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">OpenAI</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Claude</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Others</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCompetitorComparison.map((row, index) => (
                      <motion.tr 
                        key={row.feature}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3 px-2 text-sm font-medium text-gray-900">{row.feature}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center">
                            {row.gemini.available ? (
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: getQualityColor(row.gemini.quality) }}
                              >
                                {Math.round(row.gemini.quality * 100)}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">—</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center">
                            {row.openai.available ? (
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: getQualityColor(row.openai.quality) }}
                              >
                                {Math.round(row.openai.quality * 100)}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">—</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center">
                            {row.claude.available ? (
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: getQualityColor(row.claude.quality) }}
                              >
                                {Math.round(row.claude.quality * 100)}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">—</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center">
                            {row.others.available ? (
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: getQualityColor(row.others.quality) }}
                              >
                                {Math.round(row.others.quality * 100)}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">—</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Feature Impact Analysis */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Impact Analysis</h3>
              <div className="space-y-6">
                {mockFeatureImpact.map((feature, index) => (
                  <motion.div 
                    key={feature.feature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{feature.feature}</h4>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Before</div>
                          <div className="text-lg font-bold text-gray-700">
                            {Math.round(feature.beforeSentiment * 100)}
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <div className="text-center">
                          <div className="text-sm text-gray-500">After</div>
                          <div className="text-lg font-bold text-green-600">
                            {Math.round(feature.afterSentiment * 100)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Adoption: {Math.round(feature.adoption * 100)}%
                      </div>
                      <div className="text-sm text-gray-600 italic">
                        &ldquo;{feature.feedback}&rdquo;
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Voice of Developer */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice of Developer</h3>
              <div className="space-y-4">
                {mockVoiceOfDeveloper.map((quote, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border-l-4 rounded-r-lg"
                    style={{ borderLeftColor: quote.sentiment >= 0.8 ? '#10B981' : '#F59E0B' }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-2">&ldquo;{quote.quote}&rdquo;</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{quote.author}, {quote.company}</span>
                          <span className="bg-gray-100 px-2 py-1 rounded-full">
                            {quote.feature}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Prioritization Helper */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Prioritization Helper</h3>
                <button 
                  onClick={() => setShowMatrix(!showMatrix)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showMatrix ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showMatrix && (
                <div className="space-y-4">
                  {mockPrioritizationMatrix.map((item, index) => (
                    <motion.div 
                      key={item.feature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.feature}</h4>
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(item.rice * 100)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Reach: {Math.round(item.reach * 100)}%</div>
                        <div>Impact: {Math.round(item.impact * 100)}%</div>
                        <div>Confidence: {Math.round(item.confidence * 100)}%</div>
                        <div>Effort: {Math.round(item.effort * 100)}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Feature Request</span>
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center justify-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Start Development</span>
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Request Feedback</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 