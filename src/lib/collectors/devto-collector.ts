import axios from 'axios';

export class DevToCollector {
  private baseUrl = 'https://dev.to/api';
  
  async collect() {
    const articles = [];
    const searchTerms = ['Gemini API', 'Google AI Studio', 'gemini-15', 'models','api'];
    
    for (const term of searchTerms) {
      try {
        const response = await axios.get(`${this.baseUrl}/articles`, {
          params: {
            tag: term.replace(' ', ''),
            per_page: 30
          }
        });

        for (const article of response.data) {
          // Get full article with comments
          const fullArticle = await this.fetchArticle(article.id);
          
          if (fullArticle) {
            articles.push({
              platform: 'devto',
              title: fullArticle.title,
              content: fullArticle.body_markdown,
              author: fullArticle.user.username,
              url: fullArticle.url,
              reactions: fullArticle.public_reactions_count,
              comments_count: fullArticle.comments_count,
              created_at: new Date(fullArticle.created_at),
              tags: fullArticle.tags
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching Dev.to articles for ${term}:`, error);
      }
    }

    return articles;
  }

  async fetchArticle(id: number) {
    try {
      const response = await axios.get(`${this.baseUrl}/articles/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }
} 