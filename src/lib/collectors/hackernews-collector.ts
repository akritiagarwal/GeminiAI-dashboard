import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

export class HackerNewsCollector {
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';
  
  private searchTerms = [
    'gemini api',
    'google ai',
    'gemini pro',
    'vertex ai'
  ];

  async collect() {
    const stories = [];
    
    // Get top and new stories
    const topStories = await this.fetchStoryIds('topstories');
    const newStories = await this.fetchStoryIds('newstories');
    
    const storyIds = [...topStories.slice(0, 200), ...newStories.slice(0, 200)];
    
    for (const id of storyIds) {
      const story = await this.fetchItem(id);
      
      if (story && this.isRelevant(story)) {
        stories.push({
          platform: 'hackernews',
          id: story.id,
          title: story.title,
          content: story.text || story.title,
          author: story.by,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          score: story.score,
          comments_count: story.descendants,
          created_at: new Date(story.time * 1000)
        });

        // Fetch comments
        if (story.kids && story.kids.length > 0) {
          const comments = await this.fetchComments(story.kids.slice(0, 10));
          stories.push(...comments);
        }
      }
    }

    return stories;
  }

  async storeInSupabase(data: any[]) {
    const supabase = await createClient()
    
    for (const item of data) {
      try {
        await supabase.from('developer_feedback').insert({
          platform: 'hackernews',
          content: item.content,
          author: item.author,
          url: item.url,
          timestamp: item.timestamp,
          metadata: {
            type: item.type,
            score: item.score,
            descendants: item.descendants,
            story_id: item.story_id
          }
        })
      } catch (error) {
        console.error('Error storing HackerNews item:', error)
      }
    }
  }

  async fetchStoryIds(type: string) {
    const response = await axios.get(`${this.baseUrl}/${type}.json`);
    return response.data || [];
  }

  async fetchItem(id: number) {
    try {
      const response = await axios.get(`${this.baseUrl}/item/${id}.json`);
      return response.data;
    } catch {
      return null;
    }
  }

  async fetchComments(ids: number[]) {
    const comments = [];
    
    for (const id of ids) {
      const item = await this.fetchItem(id);
      
      if (item && item.text && this.isRelevant(item)) {
        comments.push({
          platform: 'hackernews',
          type: 'comment',
          content: this.cleanHtml(item.text),
          author: item.by,
          created_at: new Date(item.time * 1000)
        });
      }
    }

    return comments;
  }

  isRelevant(item: any): boolean {
    const text = `${item.title || ''} ${item.text || ''}`.toLowerCase();
    return this.searchTerms.some(term => text.includes(term));
  }

  cleanHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
} 