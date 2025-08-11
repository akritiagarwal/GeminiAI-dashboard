import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });
  }

  async analyzeFeedback(content: string) {
    const prompt = `
    Analyze this developer feedback about AI APIs. Focus on Gemini API mentions.
    
    Return a JSON object with:
    {
      "sentiment_score": number between -1 and 1,
      "sentiment_label": "positive" | "negative" | "neutral",
      "is_about_gemini": boolean,
      "apis_mentioned": ["gemini", "openai", "claude", etc],
      "key_topics": [list of technical topics discussed],
      "is_comparison": boolean,
      "comparison_winner": "gemini" | "other" | "none",
      "feature_request": string or null,
      "bug_report": string or null,
      "praise_point": string or null,
      "pain_point": string or null,
      "actionable": boolean,
      "priority": "high" | "medium" | "low",
      "summary": "one line summary"
    }

    Feedback: "${content.substring(0, 2000)}"
    
    Return ONLY valid JSON, no markdown or explanation.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Clean response and parse JSON
      const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini analysis error:', error);
      
      // Fallback to simple analysis
      return {
        sentiment_score: 0,
        sentiment_label: 'neutral',
        is_about_gemini: content.toLowerCase().includes('gemini'),
        apis_mentioned: this.extractAPIs(content),
        key_topics: [],
        actionable: false,
        priority: 'low',
        summary: content.substring(0, 100)
      };
    }
  }

  extractAPIs(content: string): string[] {
    const apis = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('gemini')) apis.push('gemini');
    if (lowerContent.includes('gpt') || lowerContent.includes('openai')) apis.push('openai');
    if (lowerContent.includes('claude') || lowerContent.includes('anthropic')) apis.push('claude');
    if (lowerContent.includes('cohere')) apis.push('cohere');
    if (lowerContent.includes('mistral')) apis.push('mistral');
    
    return apis;
  }

  async generateInsights(feedbackBatch: any[]) {
    const prompt = `
    Based on this developer feedback about Gemini API, provide:
    1. Overall sentiment trend
    2. Top 3 feature requests
    3. Top 3 pain points
    4. Competitive positioning vs OpenAI/Claude
    5. Recommended PM actions
    
    Feedback: ${JSON.stringify(feedbackBatch.slice(0, 20))}
    
    Be specific and actionable.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
} 