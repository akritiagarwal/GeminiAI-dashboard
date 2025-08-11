import axios from 'axios';

const REDDIT_ENDPOINTS = [
  'https://www.reddit.com/r/GeminiAI/hot.json',
  'https://www.reddit.com/r/GoogleAIStudio/hot.json',
  'https://www.reddit.com/r/ChatGPT/hot.json',
  'https://www.reddit.com/r/GrokAI/hot.json',
  'https://www.reddit.com/r/GoogleGeminiAI/hot.json'
];

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

interface RedditPost {
  title: string;
  author: string;
  score: number;
  num_comments: number;
  url: string;
  selftext: string;
  created_utc: number;
  id: string;
  permalink: string;
  subreddit: string;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

async function fetchRedditData(endpoint: string): Promise<RedditPost[]> {
  try {
    console.log(`Fetching data from: ${endpoint}`);
    
    const response = await axios.get(endpoint, {
      headers: {
        'User-Agent': USER_AGENT
      },
      params: {
        limit: 25
      }
    });

    const data: RedditResponse = response.data;
    return data.data.children.map(child => child.data);
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return [];
  }
}

function transformRedditData(posts: RedditPost[], subreddit: string) {
  return posts.map(post => ({
    title: post.title,
    content: post.selftext || post.title,
    author: post.author,
    platform: 'reddit',
    url: `https://www.reddit.com${post.permalink}`,
    score: post.score,
    comments_count: post.num_comments,
    created_at: new Date(post.created_utc * 1000).toISOString(),
    metadata: {
      subreddit: subreddit,
      reddit_id: post.id,
      permalink: post.permalink
    },
    raw_data: post
  }));
}

async function storeRedditData(data: any[]) {
  try {
    console.log(`Storing ${data.length} Reddit posts...`);
    
    const response = await axios.post('http://localhost:3000/api/store/bulk', {
      feedback: data
    });

    console.log(`Successfully stored ${data.length} Reddit posts`);
    return response.data;
  } catch (error) {
    console.error('Error storing Reddit data:', error);
    throw error;
  }
}

async function main() {
  console.log('Starting Reddit data collection...');
  
  const allData: any[] = [];
  
  for (const endpoint of REDDIT_ENDPOINTS) {
    try {
      // Extract subreddit name from endpoint
      const subreddit = endpoint.match(/\/r\/([^\/]+)\//)?.[1] || 'unknown';
      
      const posts = await fetchRedditData(endpoint);
      const transformedData = transformRedditData(posts, subreddit);
      
      allData.push(...transformedData);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing ${endpoint}:`, error);
    }
  }
  
  if (allData.length > 0) {
    await storeRedditData(allData);
    console.log(`Collection complete! Total posts collected: ${allData.length}`);
  } else {
    console.log('No data collected');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as collectRedditData }; 