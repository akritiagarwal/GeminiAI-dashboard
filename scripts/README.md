# Daily Data Collection Script

This script collects data from multiple sources for the Gemini API PM Dashboard.

## Sources Covered

### Google Forum Endpoints (18 endpoints)
- **AI Studio**: `/c/ai-studio/8` and hot topics
- **AI Studio Models**: Tagged discussions about models
- **Gemini API**: API-related discussions
- **Gemini 1.5**: Gemini 1.5 specific discussions
- **Gemini Flash**: Gemini Flash discussions
- **Bug Reports**: Bug reports from both AI Studio and Gemini API
- **Prompt Discussions**: General prompt-related discussions

### Reddit Subreddits (5 subreddits)
- r/GeminiAI
- r/GoogleAIStudio
- r/ChatGPT (for competitive analysis)
- r/GrokAI (for competitive analysis)
- r/GoogleGeminiAI

## How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run collect:daily
```

### Option 2: Using the shell script
```bash
./scripts/run-daily-collection.sh
```

### Option 3: Direct execution
```bash
npx tsx scripts/daily-data-collection-simple.ts
```

## What the Script Does

1. **Collects Data**: Fetches recent posts (last 7 days) from all sources
2. **Removes Duplicates**: Filters out duplicate content based on platform, content, and author
3. **Stores Data**: Saves to the database via API endpoints
4. **Rate Limiting**: Includes delays to respect API limits
5. **Error Handling**: Gracefully handles API failures
6. **Summary Report**: Provides a summary of collected data

## Data Collected

### Google Forum Data
- Post title and content
- Author information
- Reply count and views
- Tags and categories
- Creation and last activity dates
- Source endpoint for tracking

### Reddit Data
- Post title and content
- Author information
- Score and comment count
- Subreddit source
- Creation date
- Permalink URL

## Frequency

**Recommended**: Run once daily to keep the dashboard updated with fresh data.

## Output

The script provides:
- Real-time progress updates
- Collection summary with platform counts
- Error reporting for failed requests
- Total items collected

## Requirements

- Node.js and npm installed
- `.env.local` file with Supabase credentials
- Dashboard running on `localhost:3002`

## Troubleshooting

### Environment Variables
Make sure your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Dashboard Not Running
Start the dashboard first:
```bash
npm run dev
```

### Rate Limiting
If you encounter rate limiting, the script includes built-in delays. You can increase them by modifying the `delay()` calls in the script.

## Data Usage

The collected data is used for:
- **Sentiment Analysis**: Understanding developer sentiment
- **Bug Tracking**: Identifying common issues
- **Feature Requests**: Discovering desired features
- **Competitive Analysis**: Comparing with other AI platforms
- **Trend Analysis**: Tracking discussion trends over time 