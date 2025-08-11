-- Fix platform constraint to include google_forum and news
ALTER TABLE developer_feedback DROP CONSTRAINT IF EXISTS developer_feedback_platform_check;
ALTER TABLE developer_feedback ADD CONSTRAINT developer_feedback_platform_check 
    CHECK (platform IN ('reddit', 'hackernews', 'google_forum', 'twitter', 'news'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'developer_feedback'::regclass 
AND contype = 'c'; 