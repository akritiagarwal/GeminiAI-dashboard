import { GoogleGenerativeAI } from '@google/generative-ai';

export class SimpleHEARTAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Use flash model for better rate limits
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1024, // Reduced for faster processing
      },
    });
  }

  // Check if content is relevant to Gemini/Google
  private isGeminiGoogleRelevant(content: string, platform: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Gemini-specific keywords
    const geminiKeywords = [
      'gemini', 'gemini api', 'gemini pro', 'gemini flash', 'gemini 1.5',
      'google ai', 'google generative ai', 'google ai studio',
      'vertex ai', 'palm', 'bard', 'google assistant'
    ];
    
    // Google AI platform keywords
    const googleKeywords = [
      'google cloud ai', 'google ml', 'google machine learning',
      'tensorflow', 'google colab', 'google cloud platform',
      'google cloud', 'gcp', 'google workspace'
    ];
    
    // Check if content contains relevant keywords
    const hasGeminiKeywords = geminiKeywords.some(keyword => lowerContent.includes(keyword));
    const hasGoogleKeywords = googleKeywords.some(keyword => lowerContent.includes(keyword));
    
    // Platform-specific relevance
    const isRelevantPlatform = platform === 'google_forum' || platform === 'reddit' || platform === 'hackernews';
    
    // Content must be substantial (not just a few words)
    const isSubstantial = content.split(' ').length > 10;
    
    return (hasGeminiKeywords || hasGoogleKeywords) && isRelevantPlatform && isSubstantial;
  }

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Faster rate limiting: max 15 requests per minute
    if (timeSinceLastRequest < 4000) { // 4 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 4000 - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private calculateFallbackHEART(content: string, platform: string) {
    const lowerContent = content.toLowerCase();
    
    // Simple keyword-based HEART scoring
    let happiness_csat = 3; // neutral default
    let engagement = 3;
    let adoption = 3;
    let retention = 3;
    let task_success = 3;
    
    // Happiness (CSAT) - based on positive/negative words
    const positiveWords = ['great', 'awesome', 'excellent', 'good', 'love', 'amazing', 'perfect', 'working', 'solved', 'helpful', 'thanks', 'thank you', 'wonderful', 'fantastic'];
    const negativeWords = ['bug', 'error', 'issue', 'problem', 'broken', 'fail', 'crash', 'wrong', 'bad', 'terrible', 'hate', 'useless', 'frustrated', 'annoying'];
    
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      happiness_csat = Math.min(5, 3 + (positiveCount - negativeCount));
    } else if (negativeCount > positiveCount) {
      happiness_csat = Math.max(1, 3 - (negativeCount - positiveCount));
    }
    
    // Engagement - based on content length and detail
    const wordCount = content.split(' ').length;
    if (wordCount > 100) engagement = 4;
    else if (wordCount > 50) engagement = 3;
    else engagement = 2;
    
    // Adoption - based on technical terms and implementation mentions
    const techTerms = ['api', 'integration', 'implementation', 'deploy', 'production', 'code', 'function', 'method'];
    const techCount = techTerms.filter(term => lowerContent.includes(term)).length;
    adoption = Math.min(5, 2 + techCount);
    
    // Retention - based on future plans and continued usage
    const futureTerms = ['will use', 'plan to', 'continue', 'keep using', 'upgrade', 'next version'];
    const futureCount = futureTerms.filter(term => lowerContent.includes(term)).length;
    retention = Math.min(5, 3 + futureCount);
    
    // Task Success - based on problem resolution
    const successTerms = ['solved', 'working', 'fixed', 'resolved', 'success', 'completed'];
    const problemTerms = ['error', 'bug', 'issue', 'problem', 'broken'];
    const successCount = successTerms.filter(term => lowerContent.includes(term)).length;
    const problemCount = problemTerms.filter(term => lowerContent.includes(term)).length;
    
    if (successCount > problemCount) {
      task_success = Math.min(5, 3 + successCount);
    } else if (problemCount > successCount) {
      task_success = Math.max(1, 3 - problemCount);
    }
    
    const overall_score = (happiness_csat + engagement + adoption + retention + task_success) / 5;
    
    // Determine category
    let category = 'unknown';
    if (lowerContent.includes('bug') || lowerContent.includes('error')) category = 'bug';
    else if (lowerContent.includes('feature') || lowerContent.includes('request')) category = 'feature';
    else if (positiveCount > negativeCount) category = 'praise';
    else if (lowerContent.includes('?') || lowerContent.includes('how') || lowerContent.includes('what')) category = 'question';
    
    // Determine priority
    let priority = 'medium';
    if (negativeCount > 3 || lowerContent.includes('urgent') || lowerContent.includes('critical')) priority = 'high';
    else if (positiveCount > 3) priority = 'low';
    
    return {
      happiness_csat,
      engagement,
      adoption,
      retention,
      task_success,
      overall_score: parseFloat(overall_score.toFixed(2)),
      main_point: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
      actionable: category === 'bug' || category === 'feature',
      priority,
      category
    };
  }

  async analyzeWithHEART(content: string, platform: string) {
    // First check if content is relevant
    if (!this.isGeminiGoogleRelevant(content, platform)) {
      console.log('Skipping non-relevant content for HEART analysis');
      return null; // Return null to indicate this should be skipped
    }

    try {
      // Check if we should use AI or fallback
      if (this.requestCount >= 30) { // Reduced limit for faster processing
        console.log('Using fallback analysis due to rate limits');
        return this.calculateFallbackHEART(content, platform);
      }
      
      await this.rateLimit();
      
      const prompt = `
      You are a Google PM analyzing developer feedback about Gemini API using the HEART framework.
      
      Feedback to analyze:
      "${content}"
      
      Platform: ${platform}
      
      Analyze this feedback and provide scores for Google's HEART metrics:
      
      1. HAPPINESS (CSAT): Rate 1-5 (1=very unhappy, 5=very happy)
      2. ENGAGEMENT: How engaged is this developer? (1-5)
      3. ADOPTION: What stage are they at? (1=considering, 2=trying, 3=implementing, 4=integrated, 5=advocating)
      4. RETENTION: Will they keep using Gemini? (1-5, where 1=definitely leaving, 5=definitely staying)
      5. TASK SUCCESS: Did they accomplish their goal? (1-5, where 1=completely failed, 5=fully succeeded)
      
      Also extract:
      - Main issue or praise point (one sentence)
      - Is this actionable for PMs? (yes/no)
      - Priority (high/medium/low)
      
      Return ONLY this JSON format:
      {
        "happiness_csat": [1-5],
        "engagement": [1-5],
        "adoption": [1-5],
        "retention": [1-5],
        "task_success": [1-5],
        "overall_score": [average of all 5],
        "main_point": "[one sentence summary]",
        "actionable": true/false,
        "priority": "high/medium/low",
        "category": "bug/feature/praise/question/comparison"
      }
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Clean and parse JSON
      const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini HEART analysis failed, using fallback:', error);
      return this.calculateFallbackHEART(content, platform);
    }
  }

  async batchAnalyzeHEART(feedbackBatch: any[]) {
    console.log(`Starting HEART analysis for ${feedbackBatch.length} items...`);
    
    // Filter for relevant content first
    const relevantFeedback = feedbackBatch.filter(item => 
      this.isGeminiGoogleRelevant(item.content, item.platform || 'unknown')
    );
    
    console.log(`Found ${relevantFeedback.length} relevant items out of ${feedbackBatch.length} total`);
    
    if (relevantFeedback.length === 0) {
      console.log('No relevant feedback found for HEART analysis');
      return [];
    }
    
    const results = [];
    const batchSize = 2; // Smaller batch size for faster processing
    
    for (let i = 0; i < relevantFeedback.length; i += batchSize) {
      const batch = relevantFeedback.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          const heartAnalysis = await this.analyzeWithHEART(
            item.content, 
            item.platform || 'unknown'
          );
          
          if (heartAnalysis) { // Only add if analysis was performed
            results.push({
              feedback_id: item.id,
              ...heartAnalysis,
              analyzed_at: new Date().toISOString()
            });
          }
          
          // Shorter delay for faster processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error analyzing item ${item.id}:`, error);
          // Use fallback for failed items
          const fallback = this.calculateFallbackHEART(item.content, item.platform || 'unknown');
          results.push({
            feedback_id: item.id,
            ...fallback,
            analyzed_at: new Date().toISOString()
          });
        }
      }
      
      console.log(`Processed ${Math.min(i + batchSize, relevantFeedback.length)}/${relevantFeedback.length} relevant items`);
    }
    
    console.log(`Completed HEART analysis for ${results.length} items`);
    return results;
  }

  async generateHEARTInsights(heartResults: any[]) {
    try {
      if (this.requestCount >= 30) {
        return this.generateFallbackInsights(heartResults);
      }
      
      await this.rateLimit();
      
      const prompt = `
      Based on these HEART analysis results for Gemini API feedback, provide Google PM insights:
      
      ${JSON.stringify(heartResults.slice(0, 10))}
      
      Provide:
      1. Overall HEART score trends for Gemini API
      2. Key areas needing attention (Happiness, Engagement, Adoption, Retention, Task Success)
      3. Top actionable insights for PMs
      4. CSAT score summary
      5. Recommended next steps
      
      Be specific and actionable for Google PMs working on Gemini API.
      `;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating HEART insights:', error);
      return this.generateFallbackInsights(heartResults);
    }
  }

  private generateFallbackInsights(heartResults: any[]) {
    if (heartResults.length === 0) {
      return 'No HEART analysis data available for Gemini API feedback.';
    }

    const avgHappiness = heartResults.reduce((sum, r) => sum + r.happiness_csat, 0) / heartResults.length;
    const avgEngagement = heartResults.reduce((sum, r) => sum + r.engagement, 0) / heartResults.length;
    const avgAdoption = heartResults.reduce((sum, r) => sum + r.adoption, 0) / heartResults.length;
    const avgRetention = heartResults.reduce((sum, r) => sum + r.retention, 0) / heartResults.length;
    const avgTaskSuccess = heartResults.reduce((sum, r) => sum + r.task_success, 0) / heartResults.length;
    const avgOverall = heartResults.reduce((sum, r) => sum + r.overall_score, 0) / heartResults.length;

    const bugs = heartResults.filter(r => r.category === 'bug').length;
    const features = heartResults.filter(r => r.category === 'feature').length;
    const praise = heartResults.filter(r => r.category === 'praise').length;

    return `
    Gemini API HEART Analysis Summary (${heartResults.length} relevant items analyzed):
    
    Overall HEART Score: ${avgOverall.toFixed(2)}/5.0
    
    Individual Metrics:
    - Happiness (CSAT): ${avgHappiness.toFixed(1)}/5.0
    - Engagement: ${avgEngagement.toFixed(1)}/5.0
    - Adoption: ${avgAdoption.toFixed(1)}/5.0
    - Retention: ${avgRetention.toFixed(1)}/5.0
    - Task Success: ${avgTaskSuccess.toFixed(1)}/5.0
    
    Feedback Categories:
    - Bug Reports: ${bugs}
    - Feature Requests: ${features}
    - Praise: ${praise}
    
    Key Insights for Gemini API:
    - ${avgHappiness < 3 ? 'Low CSAT scores indicate user satisfaction issues with Gemini API' : 'Good CSAT scores show positive Gemini API experience'}
    - ${avgEngagement < 3 ? 'Low engagement suggests users may not be fully utilizing Gemini API features' : 'High engagement indicates active Gemini API usage'}
    - ${bugs > features ? 'More bug reports than feature requests - focus on Gemini API stability' : 'More feature requests than bugs - users want new Gemini API capabilities'}
    
    Recommended Actions:
    1. Monitor Gemini API CSAT trends daily
    2. Address high-priority Gemini API bug reports promptly
    3. Consider implementing requested Gemini API features
    4. Engage with users showing low retention scores for Gemini API
    `;
  }
} 