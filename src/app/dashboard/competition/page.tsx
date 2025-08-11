'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Zap,
  Download,
  RefreshCw,
  Activity,
  ArrowLeft,
  Globe
} from 'lucide-react'

// Mock data for competitive intelligence
const mockCompetitorActivity = [
  {
    competitor: 'OpenAI',
    activity: 'GPT-4 Turbo Launch',
    type: 'launch',
    impact: 'high',
    sentiment: -0.2,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    details: 'New model with improved performance and lower costs'
  },
  {
    competitor: 'Anthropic',
    activity: 'Claude 3.5 Release',
    type: 'launch',
    impact: 'medium',
    sentiment: -0.1,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    details: 'Enhanced reasoning capabilities and better coding support'
  },
  {
    competitor: 'Perplexity',
    activity: 'API Pricing Update',
    type: 'pricing',
    impact: 'low',
    sentiment: 0.05,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    details: 'Reduced pricing for high-volume users'
  },
  {
    competitor: 'Mistral',
    activity: 'Enterprise Partnership',
    type: 'partnership',
    impact: 'medium',
    sentiment: -0.15,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    details: 'Strategic partnership with major cloud provider'
  }
]

const mockMarketShare = [
  { competitor: 'OpenAI', share: 45, trend: 0.02 },
  { competitor: 'Anthropic', share: 18, trend: 0.05 },
  { competitor: 'Google (Gemini)', share: 15, trend: 0.08 },
  { competitor: 'Mistral', share: 8, trend: 0.12 },
  { competitor: 'Others', share: 14, trend: -0.03 }
]

const mockSwitchingAnalysis = {
  toGemini: [
    { reason: 'Better pricing', count: 45, percentage: 35 },
    { reason: 'Superior performance', count: 32, percentage: 25 },
    { reason: 'Better documentation', count: 28, percentage: 22 },
    { reason: 'Enterprise features', count: 23, percentage: 18 }
  ],
  fromGemini: [
    { reason: 'Limited model options', count: 18, percentage: 40 },
    { reason: 'API reliability issues', count: 12, percentage: 27 },
    { reason: 'Higher latency', count: 8, percentage: 18 },
    { reason: 'Feature gaps', count: 6, percentage: 15 }
  ],
  fenceSitters: [
    { concern: 'Pricing uncertainty', count: 34 },
    { concern: 'Feature roadmap', count: 28 },
    { concern: 'Support quality', count: 22 },
    { concern: 'Integration complexity', count: 16 }
  ]
}

const mockHeadToHeadComparison = [
  {
    metric: 'Model Performance',
    gemini: 0.85,
    openai: 0.90,
    claude: 0.88,
    mistral: 0.75
  },
  {
    metric: 'Pricing',
    gemini: 0.90,
    openai: 0.70,
    claude: 0.75,
    mistral: 0.85
  },
  {
    metric: 'Documentation',
    gemini: 0.75,
    openai: 0.85,
    claude: 0.80,
    mistral: 0.70
  },
  {
    metric: 'Enterprise Features',
    gemini: 0.70,
    openai: 0.90,
    claude: 0.85,
    mistral: 0.65
  },
  {
    metric: 'Developer Satisfaction',
    gemini: 0.78,
    openai: 0.82,
    claude: 0.80,
    mistral: 0.72
  }
]

const mockCompetitiveResponse = [
  {
    competitor: 'OpenAI',
    move: 'GPT-4 Turbo Launch',
    suggestedResponse: 'Highlight Gemini\'s superior pricing and multimodal capabilities',
    priority: 'high',
    timeline: '1-2 weeks'
  },
  {
    competitor: 'Anthropic',
    move: 'Claude 3.5 Release',
    suggestedResponse: 'Emphasize Gemini\'s better performance benchmarks',
    priority: 'medium',
    timeline: '2-4 weeks'
  },
  {
    competitor: 'Perplexity',
    move: 'Pricing Update',
    suggestedResponse: 'Review and potentially adjust our pricing strategy',
    priority: 'low',
    timeline: '1 month'
  }
]

const mockMarketTrends = [
  {
    trend: 'Multimodal AI Growth',
    growth: 0.35,
    impact: 'high',
    description: 'Rapid adoption of vision and audio capabilities'
  },
  {
    trend: 'Enterprise AI Adoption',
    growth: 0.28,
    impact: 'high',
    description: 'Increased focus on enterprise-grade features'
  },
  {
    trend: 'Edge AI Development',
    growth: 0.15,
    impact: 'medium',
    description: 'Growing interest in on-device AI processing'
  },
  {
    trend: 'AI Agent Platforms',
    growth: 0.22,
    impact: 'medium',
    description: 'Rise of autonomous AI agent systems'
  }
]

export default function CompetitionPage() {
  const router = useRouter()
  const [showResponses, setShowResponses] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [selectedCompetitor, setSelectedCompetitor] = useState('all')
  const [showActivity, setShowActivity] = useState(true)
  const [showComparison, setShowComparison] = useState(true)
  const [showSwitching, setShowSwitching] = useState(true)

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'launch': return <Zap className="w-4 h-4 text-blue-500" />
      case 'pricing': return <DollarSign className="w-4 h-4 text-green-500" />
      case 'partnership': return <Users className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Competitive Intelligence</h1>
                <p className="text-gray-600">Real-time competitor monitoring & market analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Monitor</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Share Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Market Share Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {mockMarketShare.map((competitor, index) => (
              <motion.div 
                key={competitor.competitor}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">{competitor.competitor}</h3>
                  {competitor.trend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {competitor.share}%
                </div>
                <div className={`text-sm font-medium ${
                  competitor.trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {competitor.trend > 0 ? '+' : ''}{Math.round(competitor.trend * 100)}%
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${competitor.share}%`,
                      backgroundColor: competitor.competitor === 'Google (Gemini)' ? '#3B82F6' : '#6B7280'
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Competitor Activity Feed */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitor Activity Feed</h3>
              <div className="space-y-4">
                {mockCompetitorActivity.map((activity, index) => (
                  <motion.div 
                    key={`${activity.competitor}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border-l-4 rounded-r-lg"
                    style={{ borderLeftColor: getImpactColor(activity.impact) }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900">{activity.competitor}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{activity.activity}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {Math.round((Date.now() - activity.timestamp.getTime()) / 3600000)}h ago
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{activity.details}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full ${
                              activity.impact === 'high' ? 'bg-red-100 text-red-800' :
                              activity.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {activity.impact} impact
                            </span>
                            <span className={`font-medium ${
                              activity.sentiment > 0.1 ? 'text-green-600' :
                              activity.sentiment < -0.1 ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {activity.sentiment > 0.1 ? 'Positive' :
                               activity.sentiment < -0.1 ? 'Negative' :
                               'Neutral'} sentiment
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Head-to-Head Comparison */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Head-to-Head Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Metric</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Gemini</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">OpenAI</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Claude</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Mistral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHeadToHeadComparison.map((row, index) => (
                      <motion.tr 
                        key={row.metric}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3 px-2 text-sm font-medium text-gray-900">{row.metric}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round(row.gemini * 100)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {Math.round(row.openai * 100)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {Math.round(row.claude * 100)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {Math.round(row.mistral * 100)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Switching Analysis */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Switching TO Gemini */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-green-600">
                  Switching TO Gemini
                </h3>
                <div className="space-y-3">
                  {mockSwitchingAnalysis.toGemini.map((reason, index) => (
                    <motion.div 
                      key={reason.reason}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-700">{reason.reason}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-green-600">{reason.count}</span>
                        <span className="text-xs text-gray-500">({reason.percentage}%)</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Switching FROM Gemini */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">
                  Switching FROM Gemini
                </h3>
                <div className="space-y-3">
                  {mockSwitchingAnalysis.fromGemini.map((reason, index) => (
                    <motion.div 
                      key={reason.reason}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-700">{reason.reason}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-red-600">{reason.count}</span>
                        <span className="text-xs text-gray-500">({reason.percentage}%)</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Competitive Response Planner */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Response Planner</h3>
                <button 
                  onClick={() => setShowResponses(!showResponses)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showResponses ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showResponses && (
                <div className="space-y-4">
                  {mockCompetitiveResponse.map((response, index) => (
                    <motion.div 
                      key={response.competitor}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{response.competitor}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          response.priority === 'high' ? 'bg-red-100 text-red-800' :
                          response.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {response.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{response.move}</p>
                      <p className="text-sm text-blue-600 mb-2">{response.suggestedResponse}</p>
                      <div className="text-xs text-gray-500">Timeline: {response.timeline}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Market Trends */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
              <div className="space-y-4">
                {mockMarketTrends.map((trend, index) => (
                  <motion.div 
                    key={trend.trend}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{trend.trend}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        trend.impact === 'high' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trend.impact}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{trend.description}</p>
                    <div className="text-sm font-bold text-green-600">
                      +{Math.round(trend.growth * 100)}% growth
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Fence Sitters */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fence Sitters</h3>
              <div className="space-y-3">
                {mockSwitchingAnalysis.fenceSitters.map((concern, index) => (
                  <motion.div 
                    key={concern.concern}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">{concern.concern}</span>
                    <span className="text-sm font-bold text-yellow-600">{concern.count}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 