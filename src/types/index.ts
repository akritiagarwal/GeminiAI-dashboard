// Platform types
export type Platform = 'reddit' | 'stackoverflow' | 'discord' | 'hackernews' | 'github'

// Sentiment types
export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed'

// Insight types
export type InsightType = 'feature_request' | 'bug_report' | 'praise' | 'complaint' | 'comparison' | 'question'

// Competitor types
export type Competitor = 'openai' | 'anthropic' | 'perplexity' | 'grok' | 'cohere' | 'mistral'
export type UpdateType = 'feature_launch' | 'pricing_change' | 'model_update' | 'acquisition' | 'partnership'

// Action item types
export type ActionCategory = 'feature' | 'bug' | 'documentation' | 'pricing' | 'performance'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type ActionStatus = 'new' | 'investigating' | 'planned' | 'in_progress' | 'resolved'

// Database table interfaces
export interface DeveloperFeedback {
  id: string
  platform: Platform
  content: string
  author: string
  author_reputation: number
  url: string
  thread_title: string
  timestamp: string
  collected_at: string
  parent_id?: string
}

export interface SentimentAnalysis {
  id: string
  feedback_id: string
  sentiment_score: number
  sentiment_label: SentimentLabel
  confidence: number
  processing_model: string
  analyzed_at: string
}

export interface ExtractedInsights {
  id: string
  feedback_id: string
  insight_type: InsightType
  apis_mentioned: string[]
  features_mentioned: string[]
  competitor_comparison: Record<string, unknown>
  technical_details: Record<string, unknown>
  priority_score: number
}

export interface CompetitorUpdates {
  id: string
  competitor: Competitor
  update_type: UpdateType
  title: string
  description: string
  source_url: string
  impact_analysis: string
  detected_at: string
}

export interface DailyAggregates {
  date: string
  platform: string
  total_mentions: number
  sentiment_average: number
  top_features: Record<string, unknown>
  top_complaints: Record<string, unknown>
  competitor_mentions: Record<string, unknown>
}

export interface PMActionItems {
  id: string
  title: string
  description: string
  category: ActionCategory
  priority: Priority
  evidence_ids: string[]
  status: ActionStatus
  created_at: string
} 