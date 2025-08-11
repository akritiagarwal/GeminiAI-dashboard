-- Fix schema errors migration

-- Add missing columns to developer_feedback table
ALTER TABLE developer_feedback 
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

-- Add missing columns to sentiment_analysis table
ALTER TABLE sentiment_analysis 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to daily_aggregates table
ALTER TABLE daily_aggregates 
ADD COLUMN IF NOT EXISTS total_feedback INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_sentiment FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_platforms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS critical_issues INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_developer_feedback_raw_data ON developer_feedback USING GIN(raw_data);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_timestamp ON sentiment_analysis(timestamp);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_analyzed_at ON sentiment_analysis(analyzed_at);

-- Add unique constraints for conflict resolution
ALTER TABLE developer_feedback 
ADD CONSTRAINT IF NOT EXISTS unique_platform_url UNIQUE (platform, url);

-- Add unique constraint for sentiment analysis
ALTER TABLE sentiment_analysis 
ADD CONSTRAINT IF NOT EXISTS unique_feedback_sentiment UNIQUE (feedback_id); 