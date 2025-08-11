'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus,
  Search,
  Tag,
  Hash,
  Globe,
  MessageSquare,
  Settings,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Play,
  Pause,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'

interface MonitoringConfig {
  id: string
  name: string
  type: 'keyword' | 'tag' | 'community' | 'hashtag'
  value: string
  platform: 'all' | 'discord' | 'twitter' | 'reddit' | 'stackoverflow' | 'google_forum'
  priority: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  created_at: string
  updated_at: string
  created_by: string
  metadata?: {
    description?: string
    category?: string
    team?: string
    notes?: string
  }
}

interface CommunityLink {
  id: string
  name: string
  url: string
  platform: string
  type: 'discord_channel' | 'forum' | 'subreddit' | 'twitter_account' | 'github_repo'
  enabled: boolean
  monitoring_frequency: 'realtime' | 'hourly' | 'daily'
  created_at: string
  updated_at: string
  metadata?: {
    description?: string
    member_count?: number
    activity_level?: 'low' | 'medium' | 'high'
    team?: string
  }
}

interface MonitoringGroup {
  id: string
  name: string
  description: string
  configs: string[]
  communities: string[]
  enabled: boolean
  created_at: string
  updated_at: string
  created_by: string
  metadata?: {
    team?: string
    priority?: string
    notes?: string
  }
}

// Mock data
const mockConfigs: MonitoringConfig[] = [
  {
    id: '1',
    name: 'Gemini API',
    type: 'keyword',
    value: 'gemini api',
    platform: 'all',
    priority: 'critical',
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    metadata: { description: 'Core Gemini API mentions', category: 'core' }
  },
  {
    id: '2',
    name: 'Thinking Mode',
    type: 'keyword',
    value: 'thinking mode',
    platform: 'all',
    priority: 'high',
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    metadata: { description: 'Thinking mode feature mentions', category: 'features' }
  },
  {
    id: '3',
    name: 'Bug Report',
    type: 'tag',
    value: 'bug',
    platform: 'all',
    priority: 'high',
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    metadata: { description: 'Bug report tag', category: 'issues' }
  }
]

const mockCommunities: CommunityLink[] = [
  {
    id: '1',
    name: 'Google AI Discord - Gemini API',
    url: 'https://discord.com/channels/1009525727504384150/1182420115661267085',
    platform: 'discord',
    type: 'discord_channel',
    enabled: true,
    monitoring_frequency: 'realtime',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    metadata: { description: 'Official Google AI Discord Gemini API channel', activity_level: 'high' }
  },
  {
    id: '2',
    name: 'Google AI Developers Forum',
    url: 'https://discuss.ai.google.dev',
    platform: 'google_forum',
    type: 'forum',
    enabled: true,
    monitoring_frequency: 'hourly',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    metadata: { description: 'Official Google AI Developers Forum', activity_level: 'high' }
  }
]

const mockGroups: MonitoringGroup[] = [
  {
    id: '1',
    name: 'Core Gemini Monitoring',
    description: 'Monitor core Gemini API mentions and issues',
    configs: ['1', '2'],
    communities: ['1'],
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    metadata: { team: 'API Engineering', priority: 'high' }
  }
]

export default function MonitoringPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'configs' | 'communities' | 'groups'>('configs')
  const [configs, setConfigs] = useState<MonitoringConfig[]>(mockConfigs)
  const [communities, setCommunities] = useState<CommunityLink[]>(mockCommunities)
  const [groups, setGroups] = useState<MonitoringGroup[]>(mockGroups)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MonitoringConfig | CommunityLink | MonitoringGroup | null>(null)
  const [monitoringStatus, setMonitoringStatus] = useState<'active' | 'paused'>('active')
  const [monitoringEnabled, setMonitoringEnabled] = useState(true)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword': return <Hash className="w-4 h-4" />
      case 'tag': return <Tag className="w-4 h-4" />
      case 'hashtag': return <Hash className="w-4 h-4" />
      case 'community': return <MessageSquare className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'discord': return <MessageSquare className="w-4 h-4" />
      case 'twitter': return <Hash className="w-4 h-4" />
      case 'reddit': return <Globe className="w-4 h-4" />
      case 'google_forum': return <Globe className="w-4 h-4" />
      case 'stackoverflow': return <Globe className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'realtime': return <RefreshCw className="w-4 h-4" />
      case 'hourly': return <RefreshCw className="w-4 h-4" />
      case 'daily': return <RefreshCw className="w-4 h-4" />
      default: return <RefreshCw className="w-4 h-4" />
    }
  }

  const filteredConfigs = configs.filter(config =>
    config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                <h1 className="text-2xl font-bold text-gray-900">Monitoring Configuration</h1>
                <p className="text-gray-600">Manage custom tags, keywords & community monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${monitoringEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {monitoringEnabled ? 'Monitoring Active' : 'Monitoring Paused'}
                </span>
              </div>
              <button 
                onClick={() => setMonitoringEnabled(!monitoringEnabled)}
                className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 ${
                  monitoringEnabled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {monitoringEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{monitoringEnabled ? 'Pause' : 'Resume'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'configs', name: 'Keywords & Tags', count: configs.length },
                { id: 'communities', name: 'Communities', count: communities.length },
                { id: 'groups', name: 'Groups', count: groups.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'configs' | 'communities' | 'groups')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab === 'configs' ? 'Keyword/Tag' : activeTab === 'communities' ? 'Community' : 'Group'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
          {activeTab === 'configs' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Keywords & Tags</h3>
              <div className="space-y-4">
                {filteredConfigs.map((config) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getTypeIcon(config.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{config.name}</h4>
                        <p className="text-sm text-gray-500">{config.value}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(config.priority)}`}>
                            {config.priority}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            {getPlatformIcon(config.platform)}
                            <span>{config.platform}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(config)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setConfigs(configs.map(c => 
                            c.id === config.id ? { ...c, enabled: !c.enabled } : c
                          ))
                        }}
                        className={`p-2 ${config.enabled ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {config.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'communities' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Communities</h3>
              <div className="space-y-4">
                {filteredCommunities.map((community) => (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        {getPlatformIcon(community.platform)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{community.name}</h4>
                        <p className="text-sm text-gray-500">{community.url}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {community.type}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            {getFrequencyIcon(community.monitoring_frequency)}
                            <span>{community.monitoring_frequency}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(community)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCommunities(communities.map(c => 
                            c.id === community.id ? { ...c, enabled: !c.enabled } : c
                          ))
                        }}
                        className={`p-2 ${community.enabled ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {community.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Groups</h3>
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-500">{group.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {group.configs.length} configs, {group.communities.length} communities
                          </span>
                          {group.metadata?.team && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {group.metadata.team}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(group)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setGroups(groups.map(g => 
                            g.id === group.id ? { ...g, enabled: !g.enabled } : g
                          ))
                        }}
                        className={`p-2 ${group.enabled ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {group.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add {activeTab === 'configs' ? 'Keyword/Tag' : activeTab === 'communities' ? 'Community' : 'Group'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter name..."
                />
              </div>
              {activeTab === 'configs' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="keyword">Keyword</option>
                      <option value="tag">Tag</option>
                      <option value="hashtag">Hashtag</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter value..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="all">All Platforms</option>
                      <option value="discord">Discord</option>
                      <option value="twitter">Twitter</option>
                      <option value="reddit">Reddit</option>
                      <option value="google_forum">Google Forum</option>
                      <option value="stackoverflow">Stack Overflow</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === 'communities' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter URL..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="discord_channel">Discord Channel</option>
                      <option value="forum">Forum</option>
                      <option value="subreddit">Subreddit</option>
                      <option value="twitter_account">Twitter Account</option>
                      <option value="github_repo">GitHub Repository</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monitoring Frequency</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === 'groups' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-24"
                    placeholder="Enter description..."
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Add
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 