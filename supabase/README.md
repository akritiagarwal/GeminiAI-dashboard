# Supabase Database Setup

This directory contains the database schema and migrations for the Gemini PM Dashboard.

## Quick Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run the Migration**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `migrations/001_create_schema.sql`
   - Run the migration

3. **Update Environment Variables**
   - Copy your Supabase URL and anon key to `.env.local`
   - Add your service role key for admin operations

## Database Schema

### Tables

- **developer_feedback**: Stores raw feedback from all platforms
- **sentiment_analysis**: AI-processed sentiment scores
- **extracted_insights**: Extracted features, bugs, and insights
- **competitor_updates**: Tracks competitor activities
- **daily_aggregates**: Daily summary statistics
- **pm_action_items**: Actionable items for product managers

### Views

- **recent_feedback_with_sentiment**: Recent feedback with sentiment data
- **platform_summary**: Summary statistics by platform

### Functions

- **update_updated_at_column()**: Automatically updates timestamps
- **aggregate_daily_data()**: Aggregates daily statistics

## Security

- Row Level Security (RLS) is enabled on all tables
- Default policies allow all operations (adjust based on your auth needs)
- Use service role key for admin operations

## Testing the Connection

After setting up the database, test the connection by running:

```bash
curl http://localhost:3000/api/test
```

This should show that all environment variables are set correctly.

## Manual Database Setup

If you prefer to set up tables manually:

1. Create the `developer_feedback` table first
2. Add indexes for performance
3. Create related tables (sentiment_analysis, extracted_insights, etc.)
4. Set up RLS policies
5. Create views and functions

See `migrations/001_create_schema.sql` for the complete schema. 