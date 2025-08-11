'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Play,
  RefreshCw,
  Zap,
  AlertTriangle,
  TrendingUp,
  Target,
  Users,
  X,
  CheckCircle
} from 'lucide-react'

interface DemoControlsProps {
  isVisible: boolean
  onClose: () => void
}

export default function DemoControls({ isVisible, onClose }: DemoControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastAction, setLastAction] = useState<string>('')

  const scenarios = [
    {
      id: 'positive_momentum',
      name: 'Positive Momentum',
      description: 'Inject highly positive feedback about Gemini',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      id: 'feature_request',
      name: 'Feature Request Pattern',
      description: 'Create trending feature request pattern',
      icon: Target,
      color: 'bg-blue-500'
    },
    {
      id: 'competitive_win',
      name: 'Competitive Win',
      description: 'Show developers switching from competitors',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      id: 'urgent_issue',
      name: 'Urgent Issue',
      description: 'Create critical issue requiring attention',
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ]

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
        // Refresh the page after 2 seconds to show new data
        setTimeout(() => {
          window.location.reload()
        }, 2000)
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
        // Refresh the page after 3 seconds to show new data
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

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Demo Controls</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
              lastAction.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {lastAction.includes('successfully') ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-sm">{lastAction}</span>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Full Data Seeding */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Full Demo Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Creates 200+ realistic feedback items with compelling narratives
            </p>
            <button
              onClick={seedFullData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>Generate Full Demo Data</span>
            </button>
          </div>

          {/* Individual Scenarios */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Specific Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => (
                <motion.div
                  key={scenario.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${scenario.color} rounded-lg flex items-center justify-center`}>
                      <scenario.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                      <button
                        onClick={() => triggerScenario(scenario.id)}
                        disabled={isLoading}
                        className="mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm flex items-center space-x-1"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span>Trigger</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>R - Refresh data</span>
                <span className="text-gray-500">Ctrl+R</span>
              </div>
              <div className="flex justify-between">
                <span>D - Toggle demo mode</span>
                <span className="text-gray-500">Ctrl+D</span>
              </div>
              <div className="flex justify-between">
                <span>F - Toggle fullscreen</span>
                <span className="text-gray-500">F11</span>
              </div>
              <div className="flex justify-between">
                <span>? - Show shortcuts</span>
                <span className="text-gray-500">Ctrl+?</span>
              </div>
            </div>
          </div>

          {/* Demo Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Start with &ldquo;Positive Momentum&rdquo; to show Gemini&apos;s success</li>
              <li>• Use &ldquo;Feature Request&rdquo; to demonstrate pattern detection</li>
              <li>• Trigger &ldquo;Competitive Win&rdquo; to highlight market advantages</li>
              <li>• Use &ldquo;Urgent Issue&rdquo; to show monitoring value</li>
              <li>• Refresh the dashboard to see new data appear</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 