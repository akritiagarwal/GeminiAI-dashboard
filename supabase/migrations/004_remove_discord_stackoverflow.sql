-- Remove 'discord' and 'stackoverflow' from allowed platforms in the developer_feedback table
ALTER TABLE developer_feedback 
DROP CONSTRAINT IF EXISTS developer_feedback_platform_check;

ALTER TABLE developer_feedback 
ADD CONSTRAINT developer_feedback_platform_check 
CHECK (platform IN ('reddit', 'hackernews', 'google_forum', 'twitter', 'news'));

-- Delete existing Discord and Stack Overflow data
DELETE FROM developer_feedback WHERE platform IN ('discord', 'stackoverflow'); 