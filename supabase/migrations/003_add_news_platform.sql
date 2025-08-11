-- Add 'news' as an allowed platform in the developer_feedback table
ALTER TABLE developer_feedback 
DROP CONSTRAINT IF EXISTS developer_feedback_platform_check;

ALTER TABLE developer_feedback 
ADD CONSTRAINT developer_feedback_platform_check 
CHECK (platform IN ('reddit', 'stackoverflow', 'hackernews', 'discord', 'google_forum', 'twitter', 'news')); 