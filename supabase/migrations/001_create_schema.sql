-- Create developer_feedback table
CREATE TABLE IF NOT EXISTS developer_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('reddit', 'hackernews', 'google_forum', 'twitter', 'news')),
    content TEXT NOT NULL,
    author TEXT,
    url TEXT,
    title TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    raw_data JSONB DEFAULT '{}'::jsonb,
    analyzed_at TIMESTAMPTZ,
    CONSTRAINT unique_feedback_item UNIQUE (platform, id)
);

-- Create indexes for developer feedback
CREATE INDEX IF NOT EXISTS idx_developer_feedback_platform ON developer_feedback(platform);
CREATE INDEX IF NOT EXISTS idx_developer_feedback_timestamp ON developer_feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_developer_feedback_collected_at ON developer_feedback(collected_at);
CREATE INDEX IF NOT EXISTS idx_developer_feedback_author ON developer_feedback(author);
CREATE INDEX IF NOT EXISTS idx_developer_feedback_metadata ON developer_feedback USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_developer_feedback_raw_data ON developer_feedback USING GIN(raw_data);

-- Create sentiment_analysis table
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feedback_id UUID NOT NULL REFERENCES developer_feedback(id) ON DELETE CASCADE,
    sentiment_score FLOAT NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'negative', 'neutral', 'mixed')),
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    processing_model TEXT NOT NULL,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sentiment analysis
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_feedback_id ON sentiment_analysis(feedback_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_score ON sentiment_analysis(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_label ON sentiment_analysis(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_analyzed_at ON sentiment_analysis(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_timestamp ON sentiment_analysis(timestamp);

-- Create extracted_insights table
CREATE TABLE IF NOT EXISTS extracted_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feedback_id UUID NOT NULL REFERENCES developer_feedback(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('feature_request', 'bug_report', 'praise', 'complaint', 'comparison', 'question')),
    apis_mentioned TEXT[] DEFAULT '{}',
    features_mentioned TEXT[] DEFAULT '{}',
    competitor_comparison JSONB DEFAULT '{}'::jsonb,
    technical_details JSONB DEFAULT '{}'::jsonb,
    priority_score INTEGER NOT NULL CHECK (priority_score >= 1 AND priority_score <= 10),
    extracted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for extracted insights
CREATE INDEX IF NOT EXISTS idx_extracted_insights_feedback_id ON extracted_insights(feedback_id);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_type ON extracted_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_priority ON extracted_insights(priority_score);
CREATE INDEX IF NOT EXISTS idx_extracted_insights_apis ON extracted_insights USING GIN(apis_mentioned);

-- Create competitor_updates table
CREATE TABLE IF NOT EXISTS competitor_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor TEXT NOT NULL CHECK (competitor IN ('openai', 'anthropic', 'perplexity', 'grok', 'cohere', 'mistral')),
    update_type TEXT NOT NULL CHECK (update_type IN ('feature_launch', 'pricing_change', 'model_update', 'acquisition', 'partnership')),
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    impact_analysis TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for competitor updates
CREATE INDEX IF NOT EXISTS idx_competitor_updates_competitor ON competitor_updates(competitor);
CREATE INDEX IF NOT EXISTS idx_competitor_updates_type ON competitor_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_competitor_updates_detected_at ON competitor_updates(detected_at);

-- Create daily_aggregates table
CREATE TABLE IF NOT EXISTS daily_aggregates (
    date DATE PRIMARY KEY,
    platform TEXT NOT NULL,
    total_mentions INTEGER DEFAULT 0,
    sentiment_average FLOAT DEFAULT 0,
    top_features JSONB DEFAULT '{}'::jsonb,
    top_complaints JSONB DEFAULT '{}'::jsonb,
    competitor_mentions JSONB DEFAULT '{}'::jsonb,
    total_feedback INTEGER DEFAULT 0,
    average_sentiment FLOAT DEFAULT 0,
    active_platforms INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for daily aggregates
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_date ON daily_aggregates(date);
CREATE INDEX IF NOT EXISTS idx_daily_aggregates_platform ON daily_aggregates(platform);

-- Create pm_action_items table
CREATE TABLE IF NOT EXISTS pm_action_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('feature', 'bug', 'documentation', 'pricing', 'performance')),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    evidence_ids UUID[] DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('new', 'investigating', 'planned', 'in_progress', 'resolved')) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for PM action items
CREATE INDEX IF NOT EXISTS idx_pm_action_items_category ON pm_action_items(category);
CREATE INDEX IF NOT EXISTS idx_pm_action_items_priority ON pm_action_items(priority);
CREATE INDEX IF NOT EXISTS idx_pm_action_items_status ON pm_action_items(status);
CREATE INDEX IF NOT EXISTS idx_pm_action_items_created_at ON pm_action_items(created_at);

-- Create a view for recent feedback with sentiment
CREATE OR REPLACE VIEW recent_feedback_with_sentiment AS
SELECT 
    df.*,
    sa.sentiment_score,
    sa.sentiment_label,
    sa.confidence as sentiment_confidence
FROM developer_feedback df
LEFT JOIN sentiment_analysis sa ON df.id = sa.feedback_id
WHERE df.collected_at >= NOW() - INTERVAL '7 days'
ORDER BY df.collected_at DESC;

-- Create a view for platform summary
CREATE OR REPLACE VIEW platform_summary AS
SELECT 
    platform,
    COUNT(*) as total_posts,
    AVG(author_reputation) as avg_author_reputation,
    COUNT(DISTINCT author) as unique_authors,
    MAX(collected_at) as last_collection
FROM developer_feedback
GROUP BY platform
ORDER BY total_posts DESC;

-- Enable Row Level Security (RLS)
ALTER TABLE developer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - adjust based on your auth needs)
CREATE POLICY "Allow all operations on developer_feedback" ON developer_feedback FOR ALL USING (true);
CREATE POLICY "Allow all operations on sentiment_analysis" ON sentiment_analysis FOR ALL USING (true);
CREATE POLICY "Allow all operations on extracted_insights" ON extracted_insights FOR ALL USING (true);
CREATE POLICY "Allow all operations on competitor_updates" ON competitor_updates FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_aggregates" ON daily_aggregates FOR ALL USING (true);
CREATE POLICY "Allow all operations on pm_action_items" ON pm_action_items FOR ALL USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for pm_action_items
CREATE TRIGGER update_pm_action_items_updated_at 
    BEFORE UPDATE ON pm_action_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to aggregate daily data
CREATE OR REPLACE FUNCTION aggregate_daily_data()
RETURNS void AS $$
BEGIN
    INSERT INTO daily_aggregates (
        date, 
        platform, 
        total_mentions, 
        sentiment_average,
        top_features,
        top_complaints,
        competitor_mentions
    )
    SELECT 
        DATE(collected_at) as date,
        platform,
        COUNT(*) as total_mentions,
        AVG(COALESCE(sa.sentiment_score, 0)) as sentiment_average,
        '{}'::jsonb as top_features, -- Placeholder
        '{}'::jsonb as top_complaints, -- Placeholder
        '{}'::jsonb as competitor_mentions -- Placeholder
    FROM developer_feedback df
    LEFT JOIN sentiment_analysis sa ON df.id = sa.feedback_id
    WHERE DATE(df.collected_at) = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY DATE(df.collected_at), df.platform
    ON CONFLICT (date, platform) DO UPDATE SET
        total_mentions = EXCLUDED.total_mentions,
        sentiment_average = EXCLUDED.sentiment_average,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql; 