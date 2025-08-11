import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' })

export async function analyzeSentiment(content: string) {
  const prompt = `
    Analyze the sentiment of this developer feedback. Return a JSON response with:
    - sentiment_score: float between -1 (very negative) and 1 (very positive)
    - sentiment_label: "positive", "negative", "neutral", or "mixed"
    - confidence: float between 0 and 1
    - reasoning: brief explanation

    Content: ${content}
  `

  const result = await geminiModel.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    return JSON.parse(text)
  } catch {
    return {
      sentiment_score: 0,
      sentiment_label: 'neutral' as const,
      confidence: 0.5,
      reasoning: 'Unable to parse AI response'
    }
  }
}

export async function extractInsights(content: string) {
  const prompt = `
    Extract insights from this developer feedback. Return a JSON response with:
    - insight_type: "feature_request", "bug_report", "praise", "complaint", "comparison", or "question"
    - apis_mentioned: array of API names mentioned
    - features_mentioned: array of specific features discussed
    - competitor_comparison: object with competitor mentions and comparisons
    - technical_details: object with technical information
    - priority_score: integer 1-10 based on importance

    Content: ${content}
  `

  const result = await geminiModel.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  
  try {
    return JSON.parse(text)
  } catch {
    return {
      insight_type: 'question' as const,
      apis_mentioned: [],
      features_mentioned: [],
      competitor_comparison: {},
      technical_details: {},
      priority_score: 5
    }
  }
} 