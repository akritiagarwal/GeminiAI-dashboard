import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

export class RedditCollector {
  private subreddits = [
    'GoogleAI',
    'singularity', 
    'MachineLearning',
    'LocalLLaMA',
    'ArtificialIntelligence',
    'learnmachinelearning',
    'OpenAI', // To catch comparison discussions
    'googlecloud',
    'Bard', // Often discusses Gemini
    'artificial'
  ];

  private searchTerms = [
    'gemini api',
    'gemini pro',
    'gemini ultra',
    'google ai api',
    'vertex ai gemini',
    'palm api', // Often compared
    'gemini vs gpt',
    'gemini vs claude',
    'google gemini'
  ];

  async collectFromSubreddit(subreddit: string, searchTerm: string) {
    // Use Reddit's public JSON endpoint (no auth needed)
    const urls = [
      // Search within subreddit
      `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchTerm)}&sort=new&limit=25&restrict_sr=on`,
      // Also get hot posts
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
      // And new posts
      `https://www.reddit.com/r/${subreddit}/new.json?limit=25`
    ];

    const allPosts = [];
    
    for (const url of urls) {
      try {
        // Add longer delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });

        const posts = response.data?.data?.children || [];
        
        for (const post of posts) {
          const data = post.data;
          
          // Check if post mentions Gemini or related terms
          const content = `${data.title} ${data.selftext}`.toLowerCase();
          const isRelevant = this.searchTerms.some(term => 
            content.includes(term.toLowerCase())
          );

          if (isRelevant) {
            allPosts.push({
              platform: 'reddit',
              subreddit: data.subreddit,
              id: data.id,
              title: data.title,
              content: data.selftext || data.title,
              author: data.author,
              url: `https://reddit.com${data.permalink}`,
              score: data.score,
              num_comments: data.num_comments,
              created_at: new Date(data.created_utc * 1000),
              is_question: data.title.includes('?'),
              flair: data.link_flair_text
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching from ${subreddit}:`, error.message);
        // Continue with next URL instead of failing completely
      }
    }

    return allPosts;
  }

  async fetchComments(permalink: string) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get(
        `https://reddit.com${permalink}.json?limit=20`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Gemini API Sentiment Monitor)'
          }
        }
      );

      const comments = [];
      const traverse = (comment: any, depth = 0) => {
        if (depth > 3) return; // Limit depth
        
        if (comment.kind === 't1') {
          const data = comment.data;
          if (data.body && data.body.length > 20) {
            comments.push({
              platform: 'reddit',
              type: 'comment',
              content: data.body,
              author: data.author,
              score: data.score,
              created_at: new Date(data.created_utc * 1000),
              parent_id: data.parent_id
            });
          }
        }

        if (comment.data?.replies?.data?.children) {
          comment.data.replies.data.children.forEach((reply: any) => {
            traverse(reply, depth + 1);
          });
        }
      };

      const commentData = response.data[1]?.data?.children || [];
      commentData.forEach((comment: any) => traverse(comment));

      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  async collectAll() {
    const allData = [];
    
    for (const subreddit of this.subreddits) {
      console.log(`Collecting from r/${subreddit}...`);
      
      for (const searchTerm of this.searchTerms) {
        const posts = await this.collectFromSubreddit(subreddit, searchTerm);
        allData.push(...posts);
      }
    }

    // Deduplicate by ID
    const uniqueData = Array.from(
      new Map(allData.map(item => [item.id, item])).values()
    );

    console.log(`Collected ${uniqueData.length} unique posts from Reddit`);
    return uniqueData;
  }

  async storeInSupabase(data: any[]) {
    const supabase = await createClient()
    
    for (const item of data) {
      try {
        await supabase.from('developer_feedback').insert({
          platform: 'reddit',
          content: item.content,
          author: item.author,
          url: item.url,
          timestamp: item.timestamp,
          metadata: {
            subreddit: item.subreddit,
            score: item.score,
            num_comments: item.num_comments,
            is_question: item.is_question,
            flair: item.flair
          }
        })
      } catch (error) {
        console.error('Error storing Reddit item:', error)
      }
    }
  }
} 