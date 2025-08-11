-- Monitoring Configuration Tables
-- Table for monitoring configurations (keywords, tags, etc.)
CREATE TABLE IF NOT EXISTS monitoring_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('keyword', 'tag', 'community', 'hashtag')),
    value TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (platform IN ('all', 'discord', 'twitter', 'reddit', 'stackoverflow', 'google_forum')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for community links
CREATE TABLE IF NOT EXISTS community_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('discord_channel', 'forum', 'subreddit', 'twitter_account', 'github_repo')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    monitoring_frequency VARCHAR(20) NOT NULL DEFAULT 'hourly' CHECK (monitoring_frequency IN ('realtime', 'hourly', 'daily')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for monitoring groups
CREATE TABLE IF NOT EXISTS monitoring_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    configs UUID[] DEFAULT '{}',
    communities UUID[] DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_enabled ON monitoring_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_platform ON monitoring_configs(platform);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_type ON monitoring_configs(type);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_priority ON monitoring_configs(priority);

CREATE INDEX IF NOT EXISTS idx_community_links_enabled ON community_links(enabled);
CREATE INDEX IF NOT EXISTS idx_community_links_platform ON community_links(platform);
CREATE INDEX IF NOT EXISTS idx_community_links_type ON community_links(type);

CREATE INDEX IF NOT EXISTS idx_monitoring_groups_enabled ON monitoring_groups(enabled);

-- Enable RLS
ALTER TABLE monitoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON monitoring_configs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON monitoring_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON monitoring_configs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON monitoring_configs FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON community_links FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON community_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON community_links FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON community_links FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON monitoring_groups FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON monitoring_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON monitoring_groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON monitoring_groups FOR DELETE USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monitoring_configs_updated_at BEFORE UPDATE ON monitoring_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_links_updated_at BEFORE UPDATE ON community_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitoring_groups_updated_at BEFORE UPDATE ON monitoring_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default monitoring configurations
INSERT INTO monitoring_configs (name, type, value, platform, priority, created_by, metadata) VALUES
-- Default Gemini API keywords
('Gemini API', 'keyword', 'gemini api', 'all', 'critical', 'system', '{"description": "Core Gemini API mentions", "category": "core"}'),
('Gemini Pro', 'keyword', 'gemini pro', 'all', 'high', 'system', '{"description": "Gemini Pro model mentions", "category": "models"}'),
('Gemini Ultra', 'keyword', 'gemini ultra', 'all', 'high', 'system', '{"description": "Gemini Ultra model mentions", "category": "models"}'),
('Vertex AI', 'keyword', 'vertex ai', 'all', 'high', 'system', '{"description": "Vertex AI platform mentions", "category": "platform"}'),
('Google AI', 'keyword', 'google ai', 'all', 'medium', 'system', '{"description": "Google AI mentions", "category": "brand"}'),
('AI Studio', 'keyword', 'ai studio', 'all', 'medium', 'system', '{"description": "Google AI Studio mentions", "category": "tools"}'),
('Thinking Mode', 'keyword', 'thinking mode', 'all', 'high', 'system', '{"description": "Thinking mode feature mentions", "category": "features"}'),
('API Documentation', 'keyword', 'api documentation', 'all', 'medium', 'system', '{"description": "API documentation mentions", "category": "documentation"}'),
('SDK', 'keyword', 'sdk', 'all', 'medium', 'system', '{"description": "SDK mentions", "category": "development"}'),
('Rate Limiting', 'keyword', 'rate limiting', 'all', 'medium', 'system', '{"description": "Rate limiting mentions", "category": "features"}'),

-- Default tags
('Feedback', 'tag', 'feedback', 'all', 'medium', 'system', '{"description": "Feedback tag", "category": "feedback"}'),
('Bug Report', 'tag', 'bug', 'all', 'high', 'system', '{"description": "Bug report tag", "category": "issues"}'),
('Feature Request', 'tag', 'feature_request', 'all', 'medium', 'system', '{"description": "Feature request tag", "category": "features"}'),
('Question', 'tag', 'question', 'all', 'low', 'system', '{"description": "Question tag", "category": "support"}'),
('Issue', 'tag', 'issue', 'all', 'high', 'system', '{"description": "Issue tag", "category": "issues"}'),
('Learning', 'tag', 'learning', 'all', 'low', 'system', '{"description": "Learning tag", "category": "education"}'),

-- Default hashtags
('GeminiAPI', 'hashtag', 'geminiAPI', 'twitter', 'high', 'system', '{"description": "Gemini API hashtag", "category": "social"}'),
('GoogleAI', 'hashtag', 'googleai', 'twitter', 'medium', 'system', '{"description": "Google AI hashtag", "category": "social"}'),
('AI', 'hashtag', 'ai', 'twitter', 'low', 'system', '{"description": "AI hashtag", "category": "social"}'),
('MachineLearning', 'hashtag', 'machinelearning', 'twitter', 'low', 'system', '{"description": "Machine Learning hashtag", "category": "social"}'),
('LLM', 'hashtag', 'llm', 'twitter', 'medium', 'system', '{"description": "LLM hashtag", "category": "social"}'),
('APIDevelopment', 'hashtag', 'apidevelopment', 'twitter', 'medium', 'system', '{"description": "API Development hashtag", "category": "social"}');

-- Insert default community links
INSERT INTO community_links (name, url, platform, type, monitoring_frequency, metadata) VALUES
-- Discord channels
('Google AI Discord - Gemini API', 'https://discord.com/channels/1009525727504384150/1182420115661267085', 'discord', 'discord_channel', 'realtime', '{"description": "Official Google AI Discord Gemini API channel", "activity_level": "high"}'),
('Google AI Discord - General', 'https://discord.com/channels/1009525727504384150/1009525727504384153', 'discord', 'discord_channel', 'hourly', '{"description": "Official Google AI Discord general channel", "activity_level": "high"}'),

-- Forums
('Google AI Developers Forum', 'https://discuss.ai.google.dev', 'google_forum', 'forum', 'hourly', '{"description": "Official Google AI Developers Forum", "activity_level": "high"}'),
('Reddit r/MachineLearning', 'https://reddit.com/r/MachineLearning', 'reddit', 'subreddit', 'hourly', '{"description": "Machine Learning subreddit", "activity_level": "high"}'),
('Reddit r/LocalLLaMA', 'https://reddit.com/r/LocalLLaMA', 'reddit', 'subreddit', 'hourly', '{"description": "Local LLM subreddit", "activity_level": "medium"}'),

-- Twitter accounts
('Google AI Twitter', 'https://twitter.com/GoogleAI', 'twitter', 'twitter_account', 'hourly', '{"description": "Official Google AI Twitter account", "activity_level": "high"}'),
('Gemini API Twitter', 'https://twitter.com/GeminiAPI', 'twitter', 'twitter_account', 'hourly', '{"description": "Gemini API Twitter account", "activity_level": "medium"}'),

-- GitHub
('Google AI GitHub', 'https://github.com/google/generative-ai-js', 'github', 'github_repo', 'daily', '{"description": "Google Generative AI JavaScript SDK", "activity_level": "medium"}');

-- Insert default monitoring groups
INSERT INTO monitoring_groups (name, description, created_by, metadata) VALUES
('Core Gemini Monitoring', 'Monitor core Gemini API mentions and issues', 'system', '{"team": "API Engineering", "priority": "high"}'),
('Developer Experience', 'Monitor developer experience and documentation feedback', 'system', '{"team": "Developer Relations", "priority": "medium"}'),
('Model Performance', 'Monitor model performance and quality feedback', 'system', '{"team": "Model Development", "priority": "high"}'),
('Community Engagement', 'Monitor community engagement and social media', 'system', '{"team": "Marketing", "priority": "medium"}'); 