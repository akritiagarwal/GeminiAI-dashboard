-- Fix missing raw_data column
ALTER TABLE developer_feedback 
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

-- Fix missing timestamp column in sentiment_analysis
ALTER TABLE sentiment_analysis 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Fix missing columns in daily_aggregates
ALTER TABLE daily_aggregates 
ADD COLUMN IF NOT EXISTS total_feedback INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_sentiment DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_platforms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS critical_issues INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Update platform constraint to include google_forum
ALTER TABLE developer_feedback 
DROP CONSTRAINT IF EXISTS developer_feedback_platform_check;

ALTER TABLE developer_feedback 
ADD CONSTRAINT developer_feedback_platform_check 
CHECK (platform IN ('reddit', 'hackernews', 'google_forum', 'twitter', 'news')); 