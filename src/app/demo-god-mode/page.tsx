'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play,
  RefreshCw,
  Zap,
  AlertTriangle,
  TrendingUp,
  Target,
  Users,
  Settings,
  CheckCircle,
  X,
  Eye,
  BarChart3
} from 'lucide-react'

interface DemoStatus {
  isActive: boolean
  lastUpdate: string
  feedbackCount: number
  sentimentScore: number
  activeScenarios: string[]
}

export default function DemoGodMode() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastAction, setLastAction] = useState<string>('')
  const [demoStatus, setDemoStatus] = useState<DemoStatus>({
    isActive: false,
    lastUpdate: new Date().toLocaleTimeString(),
    feedbackCount: 0,
    sentimentScore: 0.73,
    activeScenarios: []
  })

  const scenarios = [
    {
      id: 'positive_momentum',
      name: 'Positive Momentum',
      description: 'Inject highly positive feedback about Gemini',
      icon: TrendingUp,
      color: 'bg-green-500',
      duration: '2 minutes'
    },
    {
      id: 'feature_request',
      name: 'Feature Request Pattern',
      description: 'Create trending feature request pattern',
      icon: Target,
      color: 'bg-blue-500',
      duration: '3 minutes'
    },
    {
      id: 'competitive_win',
      name: 'Competitive Win',
      description: 'Show developers switching from competitors',
      icon: Users,
      color: 'bg-purple-500',
      duration: '2 minutes'
    },
    {
      id: 'urgent_issue',
      name: 'Urgent Issue',
      description: 'Create critical issue requiring attention',
      icon: AlertTriangle,
      color: 'bg-red-500',
      duration: '1 minute'
    }
  ]

  // Check for secret key combination
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setIsVisible(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const triggerScenario = async (scenarioId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scenario: scenarioId })
      })

      if (response.ok) {
        setLastAction(`Scenario '${scenarioId}' triggered successfully`)
        setDemoStatus(prev => ({
          ...prev,
          isActive: true,
          lastUpdate: new Date().toLocaleTimeString(),
          activeScenarios: [...prev.activeScenarios, scenarioId]
        }))
        
        // Auto-refresh after scenario duration
        const scenario = scenarios.find(s => s.id === scenarioId)
        const duration = scenario?.duration || '2 minutes'
        const durationMs = parseInt(duration) * 60 * 1000
        
        setTimeout(() => {
          window.location.reload()
        }, durationMs)
      } else {
        setLastAction('Failed to trigger scenario')
      }
    } catch (error) {
      console.error('Error triggering scenario:', error)
      setLastAction('Error triggering scenario')
    } finally {
      setIsLoading(false)
    }
  }

  const seedFullData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setLastAction('Full demo data seeded successfully')
        setDemoStatus(prev => ({
          ...prev,
          isActive: true,
          lastUpdate: new Date().toLocaleTimeString(),
          feedbackCount: 200
        }))
        
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setLastAction('Failed to seed demo data')
      }
    } catch (error) {
      console.error('Error seeding demo data:', error)
      setLastAction('Error seeding demo data')
    } finally {
      setIsLoading(false)
    }
  }

  const resetDemo = async () => {
    setIsLoading(true)
    try {
      // Clear demo data
      const response = await fetch('/api/demo/seed', {
        method: 'DELETE'
      })

      if (response.ok) {
        setLastAction('Demo reset successfully')
        setDemoStatus({
          isActive: false,
          lastUpdate: new Date().toLocaleTimeString(),
          feedbackCount: 0,
          sentimentScore: 0.5,
          activeScenarios: []
        })
      } else {
        setLastAction('Failed to reset demo')
      }
    } catch (error) {
      console.error('Error resetting demo:', error)
      setLastAction('Error resetting demo')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
          title="Demo Controls (Ctrl+Shift+D)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Demo God Mode</h2>
              <p className="text-sm text-gray-500">Control demo scenarios and data flow</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              lastAction.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {lastAction.includes('successfully') ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{lastAction}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Demo Status */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    demoStatus.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {demoStatus.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update:</span>
                  <span className="text-sm font-medium">{demoStatus.lastUpdate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Feedback Count:</span>
                  <span className="text-sm font-medium">{demoStatus.feedbackCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sentiment Score:</span>
                  <span className="text-sm font-medium">{(demoStatus.sentimentScore * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={seedFullData}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Generate Full Demo Data</span>
                </button>
                <button
                  onClick={resetDemo}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scenarios */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => (
                <motion.div
                  key={scenario.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 ${scenario.color} rounded-lg flex items-center justify-center`}>
                      <scenario.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                        <span className="text-xs text-gray-500">{scenario.duration}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => triggerScenario(scenario.id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm flex items-center space-x-1"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          <span>Trigger</span>
                        </button>
                        <button
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Tips */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">Keyboard Shortcuts:</h4>
              <ul className="space-y-1">
                <li>• Ctrl+Shift+D: Toggle demo controls</li>
                <li>• Ctrl+R: Refresh dashboard</li>
                <li>• F11: Toggle fullscreen</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Demo Flow:</h4>
              <ul className="space-y-1">
                <li>• Start with &ldquo;Positive Momentum&rdquo;</li>
                <li>• Use &ldquo;Feature Request&rdquo; for pattern detection</li>
                <li>• Show &ldquo;Competitive Win&rdquo; for market advantages</li>
                <li>• End with &ldquo;Urgent Issue&rdquo; for monitoring value</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 