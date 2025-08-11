import { createClient } from '@/lib/supabase/server'

export interface MonitoringConfig {
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

export interface CommunityLink {
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

export interface MonitoringGroup {
  id: string
  name: string
  description: string
  configs: string[] // Array of config IDs
  communities: string[] // Array of community IDs
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

export class MonitoringConfigManager {
  private supabase: any

  constructor() {
    this.supabase = createClient()
  }

  // Keyword Management
  async addKeyword(keyword: string, platform: 'all' | 'discord' | 'twitter' | 'reddit' | 'stackoverflow' | 'google_forum' = 'all', priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    try {
      const config: Partial<MonitoringConfig> = {
        name: `Keyword: ${keyword}`,
        type: 'keyword',
        value: keyword.toLowerCase(),
        platform,
        priority,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        metadata: {
          description: `Monitoring for keyword: ${keyword}`,
          category: 'keyword'
        }
      }

      const { error } = await this.supabase
        .from('monitoring_configs')
        .insert([config])

      if (error) {
        console.error('Error adding keyword:', error)
      } else {
        console.log(`Added keyword: ${keyword}`)
      }
    } catch (error) {
      console.error('Error adding keyword:', error)
    }
  }

  async removeKeyword(keyword: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('monitoring_configs')
        .delete()
        .eq('type', 'keyword')
        .eq('value', keyword.toLowerCase())

      if (error) {
        console.error('Error removing keyword:', error)
      } else {
        console.log(`Removed keyword: ${keyword}`)
      }
    } catch (error) {
      console.error('Error removing keyword:', error)
    }
  }

  // Tag Management
  async addTag(tag: string, platform: 'all' | 'discord' | 'twitter' | 'reddit' | 'stackoverflow' | 'google_forum' = 'all'): Promise<void> {
    try {
      const config: Partial<MonitoringConfig> = {
        name: `Tag: ${tag}`,
        type: 'tag',
        value: tag.toLowerCase(),
        platform,
        priority: 'medium',
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        metadata: {
          description: `Monitoring for tag: ${tag}`,
          category: 'tag'
        }
      }

      const { error } = await this.supabase
        .from('monitoring_configs')
        .insert([config])

      if (error) {
        console.error('Error adding tag:', error)
      } else {
        console.log(`Added tag: ${tag}`)
      }
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }

  // Community Management
  async addCommunity(community: Partial<CommunityLink>): Promise<void> {
    try {
      const communityData: Partial<CommunityLink> = {
        ...community,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('community_links')
        .insert([communityData])

      if (error) {
        console.error('Error adding community:', error)
      } else {
        console.log(`Added community: ${community.name}`)
      }
    } catch (error) {
      console.error('Error adding community:', error)
    }
  }

  async removeCommunity(communityId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('community_links')
        .delete()
        .eq('id', communityId)

      if (error) {
        console.error('Error removing community:', error)
      } else {
        console.log(`Removed community: ${communityId}`)
      }
    } catch (error) {
      console.error('Error removing community:', error)
    }
  }

  // Group Management
  async createGroup(group: Partial<MonitoringGroup>): Promise<void> {
    try {
      const groupData: Partial<MonitoringGroup> = {
        ...group,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      }

      const { error } = await this.supabase
        .from('monitoring_groups')
        .insert([groupData])

      if (error) {
        console.error('Error creating group:', error)
      } else {
        console.log(`Created group: ${group.name}`)
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  // Get all active configurations
  async getActiveConfigs(): Promise<MonitoringConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_configs')
        .select('*')
        .eq('enabled', true)
        .order('priority', { ascending: false })

      if (error) {
        console.error('Error fetching active configs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching active configs:', error)
      return []
    }
  }

  // Get all active communities
  async getActiveCommunities(): Promise<CommunityLink[]> {
    try {
      const { data, error } = await this.supabase
        .from('community_links')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching active communities:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching active communities:', error)
      return []
    }
  }

  // Get all groups
  async getGroups(): Promise<MonitoringGroup[]> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_groups')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching groups:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching groups:', error)
      return []
    }
  }

  // Update configuration
  async updateConfig(configId: string, updates: Partial<MonitoringConfig>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('monitoring_configs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', configId)

      if (error) {
        console.error('Error updating config:', error)
      } else {
        console.log(`Updated config: ${configId}`)
      }
    } catch (error) {
      console.error('Error updating config:', error)
    }
  }

  // Enable/disable configuration
  async toggleConfig(configId: string, enabled: boolean): Promise<void> {
    await this.updateConfig(configId, { enabled })
  }

  // Enable/disable community
  async toggleCommunity(communityId: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('community_links')
        .update({
          enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)

      if (error) {
        console.error('Error toggling community:', error)
      } else {
        console.log(`Toggled community: ${communityId} to ${enabled}`)
      }
    } catch (error) {
      console.error('Error toggling community:', error)
    }
  }
} 