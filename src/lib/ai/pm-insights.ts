import { geminiModel } from './gemini'

export interface FeedbackItem {
  id: string
  platform: string
  content: string
  author: string
  timestamp: Date
  sentiment: number
  metadata?: Record<string, unknown>
}

export interface PMInsight {
  type: 'feature_request' | 'bug' | 'opportunity' | 'threat'
  title: string
  description: string
  evidence: FeedbackItem[]
  priority: number // 1-10
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL'
  impact: 'XS' | 'S' | 'M' | 'L' | 'XL'
  recommendation: string
  successMetrics: string[]
  category: 'user_experience' | 'performance' | 'pricing' | 'documentation' | 'integration' | 'competitive' | 'technical'
  confidence: number // 0-1
  estimatedUsersAffected: number
  businessValue: 'high' | 'medium' | 'low'
  competitivePressure: 'high' | 'medium' | 'low'
  timeToMarket: 'immediate' | 'short_term' | 'long_term'
}

export interface DailyInsights {
  date: Date
  topPriorities: PMInsight[]
  emergingTrends: {
    trend: string
    description: string
    evidence: string[]
    impact: 'high' | 'medium' | 'low'
    timeframe: 'immediate' | 'short_term' | 'long_term'
  }[]
  competitiveThreats: {
    threat: string
    competitor: string
    description: string
    urgency: 'high' | 'medium' | 'low'
    recommendedResponse: string
  }[]
  quickWins: PMInsight[]
  summary: {
    totalInsights: number
    highPriorityCount: number
    quickWinsCount: number
    threatsCount: number
    overallSentiment: number
  }
}

export interface PMArtifact {
  type: 'prd_snippet' | 'user_story' | 'ab_test' | 'gtm_suggestion'
  title: string
  content: string
  insightId: string
  priority: number
  effort: string
  impact: string
  successCriteria: string[]
}

export interface InsightEffectiveness {
  insightId: string
  implemented: boolean
  implementationDate?: Date
  outcome: 'positive' | 'negative' | 'neutral' | 'unknown'
  metrics: {
    userSatisfaction?: number
    adoptionRate?: number
    revenueImpact?: number
    competitiveAdvantage?: number
  }
  learnings: string[]
  recommendations: string[]
}

export interface PrioritizationMatrix {
  highImpactLowEffort: PMInsight[]
  highImpactHighEffort: PMInsight[]
  lowImpactLowEffort: PMInsight[]
  lowImpactHighEffort: PMInsight[]
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    strategic: string[]
  }
}

class PMInsightsGenerator {
  private readonly systemPrompt = `You are a Senior Product Manager with 10+ years of experience in AI/ML products. You excel at:

1. Data-driven decision making and prioritization
2. Translating user feedback into actionable product insights
3. Competitive analysis and strategic positioning
4. Technical feasibility assessment and effort estimation
5. Business impact analysis and ROI calculation

Generate insights as a Senior Product Manager would present to leadership. Be specific, data-driven, and action-oriented.

Focus on:
- Clear, actionable recommendations
- Evidence-based prioritization
- Business impact and user value
- Competitive positioning
- Technical feasibility
- Success metrics and measurement

Always provide concrete next steps and measurable outcomes.`

  private async generateWithGemini(prompt: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        const fullPrompt = `${this.systemPrompt}\n\n${prompt}`
        const result = await geminiModel.generateContent(fullPrompt)
        
        const response = await result.response
        return response.text()
      } catch (error) {
        console.error(`Gemini API error (attempt ${i + 1}):`, error)
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Max retries exceeded for Gemini API')
  }

  async generateDailyInsights(
    feedback: FeedbackItem[],
    competitorUpdates: Record<string, unknown>[],
    switchingPatterns: Record<string, unknown>[]
  ): Promise<DailyInsights> {
    const prompt = `Generate daily PM insights from this data. Return a JSON response:

{
  "topPriorities": [
    {
      "type": "feature_request|bug|opportunity|threat",
      "title": "clear, actionable title",
      "description": "detailed description with context",
      "priority": 1-10,
      "effort": "XS|S|M|L|XL",
      "impact": "XS|S|M|L|XL",
      "recommendation": "specific action to take",
      "successMetrics": ["metric1", "metric2"],
      "category": "user_experience|performance|pricing|documentation|integration|competitive|technical",
      "confidence": 0-1,
      "estimatedUsersAffected": 1000,
      "businessValue": "high|medium|low",
      "competitivePressure": "high|medium|low",
      "timeToMarket": "immediate|short_term|long_term"
    }
  ],
  "emergingTrends": [
    {
      "trend": "trend name",
      "description": "detailed description",
      "evidence": ["evidence1", "evidence2"],
      "impact": "high|medium|low",
      "timeframe": "immediate|short_term|long_term"
    }
  ],
  "competitiveThreats": [
    {
      "threat": "threat description",
      "competitor": "competitor name",
      "description": "detailed threat analysis",
      "urgency": "high|medium|low",
      "recommendedResponse": "specific response action"
    }
  ],
  "quickWins": [
    {
      "type": "feature_request|bug|opportunity|threat",
      "title": "quick win title",
      "description": "description",
      "priority": 1-10,
      "effort": "XS|S",
      "impact": "M|L|XL",
      "recommendation": "action",
      "successMetrics": ["metric1"]
    }
  ]
}

Feedback Data: ${JSON.stringify(feedback.slice(0, 20))}
Competitor Updates: ${JSON.stringify(competitorUpdates)}
Switching Patterns: ${JSON.stringify(switchingPatterns)}

Focus on:
- Top 3 priorities that need immediate attention
- Emerging trends that could impact the product
- Competitive threats requiring response
- Quick wins with high impact, low effort
- Evidence-based recommendations
- Measurable success metrics`

    try {
      const response = await this.generateWithGemini(prompt)
      const insights = JSON.parse(response)
      
      return this.validateDailyInsights(insights, feedback)
    } catch (error) {
      console.error('Error generating daily insights:', error)
      return this.getFallbackDailyInsights(feedback)
    }
  }

  async generatePMArtifacts(insight: PMInsight): Promise<PMArtifact[]> {
    const artifacts: PMArtifact[] = []
    
    // Generate PRD snippet
    const prdSnippet = await this.generatePRDSnippet(insight)
    artifacts.push(prdSnippet)
    
    // Generate user story
    const userStory = await this.generateUserStory(insight)
    artifacts.push(userStory)
    
    // Generate A/B test proposal if applicable
    if (insight.type === 'feature_request' || insight.type === 'opportunity') {
      const abTest = await this.generateABTestProposal(insight)
      artifacts.push(abTest)
    }
    
    // Generate GTM suggestion
    const gtmSuggestion = await this.generateGTMSuggestion(insight)
    artifacts.push(gtmSuggestion)
    
    return artifacts
  }

  private async generatePRDSnippet(insight: PMInsight): Promise<PMArtifact> {
    const prompt = `Generate a PRD snippet for this insight. Return a JSON response:

{
  "type": "prd_snippet",
  "title": "PRD title",
  "content": "detailed PRD content with problem statement, solution, success metrics",
  "priority": 1-10,
  "effort": "XS|S|M|L|XL",
  "impact": "XS|S|M|L|XL",
  "successCriteria": ["criterion1", "criterion2"]
}

Insight: ${JSON.stringify(insight)}

Write as a professional PRD section including:
- Problem statement
- Proposed solution
- Success metrics
- Technical requirements
- User acceptance criteria`

    try {
      const response = await this.generateWithGemini(prompt)
      const prd = JSON.parse(response)
      
      return {
        type: 'prd_snippet',
        title: prd.title || `PRD: ${insight.title}`,
        content: prd.content || 'PRD content not generated',
        insightId: insight.title,
        priority: insight.priority,
        effort: insight.effort,
        impact: insight.impact,
        successCriteria: Array.isArray(prd.successCriteria) ? prd.successCriteria : []
      }
    } catch (error) {
      console.error('Error generating PRD snippet:', error)
      return this.getFallbackPRDArtifact(insight)
    }
  }

  private async generateUserStory(insight: PMInsight): Promise<PMArtifact> {
    const prompt = `Generate a user story for this insight. Return a JSON response:

{
  "type": "user_story",
  "title": "User Story title",
  "content": "As a [user type], I want [feature/functionality] so that [benefit/value]",
  "priority": 1-10,
  "effort": "XS|S|M|L|XL",
  "impact": "XS|S|M|L|XL",
  "successCriteria": ["criterion1", "criterion2"]
}

Insight: ${JSON.stringify(insight)}

Write user stories that are:
- User-focused
- Value-driven
- Specific and measurable
- Aligned with the insight`

    try {
      const response = await this.generateWithGemini(prompt)
      const userStory = JSON.parse(response)
      
      return {
        type: 'user_story',
        title: userStory.title || `User Story: ${insight.title}`,
        content: userStory.content || 'User story not generated',
        insightId: insight.title,
        priority: insight.priority,
        effort: insight.effort,
        impact: insight.impact,
        successCriteria: Array.isArray(userStory.successCriteria) ? userStory.successCriteria : []
      }
    } catch (error) {
      console.error('Error generating user story:', error)
      return this.getFallbackUserStoryArtifact(insight)
    }
  }

  private async generateABTestProposal(insight: PMInsight): Promise<PMArtifact> {
    const prompt = `Generate an A/B test proposal for this insight. Return a JSON response:

{
  "type": "ab_test",
  "title": "A/B Test title",
  "content": "detailed A/B test proposal with hypothesis, variants, metrics",
  "priority": 1-10,
  "effort": "XS|S|M|L|XL",
  "impact": "XS|S|M|L|XL",
  "successCriteria": ["criterion1", "criterion2"]
}

Insight: ${JSON.stringify(insight)}

Include:
- Hypothesis
- Test variants
- Success metrics
- Sample size requirements
- Duration recommendations
- Statistical significance considerations`

    try {
      const response = await this.generateWithGemini(prompt)
      const abTest = JSON.parse(response)
      
      return {
        type: 'ab_test',
        title: abTest.title || `A/B Test: ${insight.title}`,
        content: abTest.content || 'A/B test proposal not generated',
        insightId: insight.title,
        priority: insight.priority,
        effort: insight.effort,
        impact: insight.impact,
        successCriteria: Array.isArray(abTest.successCriteria) ? abTest.successCriteria : []
      }
    } catch (error) {
      console.error('Error generating A/B test proposal:', error)
      return this.getFallbackABTestArtifact(insight)
    }
  }

  private async generateGTMSuggestion(insight: PMInsight): Promise<PMArtifact> {
    const prompt = `Generate a go-to-market suggestion for this insight. Return a JSON response:

{
  "type": "gtm_suggestion",
  "title": "GTM Strategy title",
  "content": "detailed GTM strategy with target audience, messaging, channels",
  "priority": 1-10,
  "effort": "XS|S|M|L|XL",
  "impact": "XS|S|M|L|XL",
  "successCriteria": ["criterion1", "criterion2"]
}

Insight: ${JSON.stringify(insight)}

Include:
- Target audience
- Key messaging
- Marketing channels
- Launch strategy
- Success metrics
- Competitive positioning`

    try {
      const response = await this.generateWithGemini(prompt)
      const gtm = JSON.parse(response)
      
      return {
        type: 'gtm_suggestion',
        title: gtm.title || `GTM Strategy: ${insight.title}`,
        content: gtm.content || 'GTM strategy not generated',
        insightId: insight.title,
        priority: insight.priority,
        effort: insight.effort,
        impact: insight.impact,
        successCriteria: Array.isArray(gtm.successCriteria) ? gtm.successCriteria : []
      }
    } catch (error) {
      console.error('Error generating GTM suggestion:', error)
      return this.getFallbackGTMArtifact(insight)
    }
  }

  createPrioritizationMatrix(insights: PMInsight[]): PrioritizationMatrix {
    const matrix = {
      highImpactLowEffort: [] as PMInsight[],
      highImpactHighEffort: [] as PMInsight[],
      lowImpactLowEffort: [] as PMInsight[],
      lowImpactHighEffort: [] as PMInsight[],
      recommendations: {
        immediate: [] as string[],
        shortTerm: [] as string[],
        longTerm: [] as string[],
        strategic: [] as string[]
      }
    }

    insights.forEach(insight => {
      const impactScore = this.getTShirtScore(insight.impact)
      const effortScore = this.getTShirtScore(insight.effort)
      
      if (impactScore >= 4 && effortScore <= 2) {
        matrix.highImpactLowEffort.push(insight)
        matrix.recommendations.immediate.push(`Implement ${insight.title} - high impact, low effort`)
      } else if (impactScore >= 4 && effortScore >= 3) {
        matrix.highImpactHighEffort.push(insight)
        matrix.recommendations.shortTerm.push(`Plan ${insight.title} - high impact, requires planning`)
      } else if (impactScore <= 2 && effortScore <= 2) {
        matrix.lowImpactLowEffort.push(insight)
        matrix.recommendations.immediate.push(`Quick win: ${insight.title}`)
      } else {
        matrix.lowImpactHighEffort.push(insight)
        matrix.recommendations.longTerm.push(`Evaluate ${insight.title} - low impact, high effort`)
      }
    })

    // Add strategic recommendations
    if (matrix.highImpactLowEffort.length > 0) {
      matrix.recommendations.strategic.push('Focus on high-impact, low-effort opportunities for quick wins')
    }
    if (matrix.highImpactHighEffort.length > 0) {
      matrix.recommendations.strategic.push('Plan major initiatives for high-impact features')
    }

    return matrix
  }

  async trackInsightEffectiveness(
    insightId: string,
    implemented: boolean,
    outcome?: 'positive' | 'negative' | 'neutral' | 'unknown',
    metrics?: Record<string, number>
  ): Promise<InsightEffectiveness> {
    const prompt = `Analyze the effectiveness of this implemented insight. Return a JSON response:

{
  "outcome": "positive|negative|neutral|unknown",
  "metrics": {
    "userSatisfaction": 0-1,
    "adoptionRate": 0-1,
    "revenueImpact": 0-1,
    "competitiveAdvantage": 0-1
  },
  "learnings": ["learning1", "learning2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Insight ID: ${insightId}
Implemented: ${implemented}
Outcome: ${outcome || 'unknown'}
Metrics: ${JSON.stringify(metrics || {})}

Provide:
- Outcome assessment
- Metric analysis
- Key learnings
- Future recommendations`

    try {
      const response = await this.generateWithGemini(prompt)
      const effectiveness = JSON.parse(response)
      
      return {
        insightId,
        implemented,
        implementationDate: implemented ? new Date() : undefined,
        outcome: effectiveness.outcome || 'unknown',
        metrics: effectiveness.metrics || {},
        learnings: Array.isArray(effectiveness.learnings) ? effectiveness.learnings : [],
        recommendations: Array.isArray(effectiveness.recommendations) ? effectiveness.recommendations : []
      }
    } catch (error) {
      console.error('Error tracking insight effectiveness:', error)
      return {
        insightId,
        implemented,
        outcome: outcome || 'unknown',
        metrics: metrics || {},
        learnings: ['Unable to analyze effectiveness'],
        recommendations: ['Continue monitoring']
      }
    }
  }

  private getTShirtScore(size: 'XS' | 'S' | 'M' | 'L' | 'XL'): number {
    switch (size) {
      case 'XS': return 1
      case 'S': return 2
      case 'M': return 3
      case 'L': return 4
      case 'XL': return 5
      default: return 3
    }
  }

  private validateDailyInsights(insights: Record<string, unknown>, feedback: FeedbackItem[]): DailyInsights {
    return {
      date: new Date(),
      topPriorities: Array.isArray(insights.topPriorities) ? 
        insights.topPriorities.map((p: Record<string, unknown>) => this.validatePMInsight(p, feedback)) : [],
      emergingTrends: Array.isArray(insights.emergingTrends) ? 
        insights.emergingTrends.map((t: Record<string, unknown>) => ({
          trend: t.trend as string || 'Unknown trend',
          description: t.description as string || 'No description',
          evidence: Array.isArray(t.evidence) ? t.evidence as string[] : [],
          impact: this.validateImpact(t.impact as string),
          timeframe: this.validateTimeframe(t.timeframe as string)
        })) : [],
      competitiveThreats: Array.isArray(insights.competitiveThreats) ? 
        insights.competitiveThreats.map((t: Record<string, unknown>) => ({
          threat: t.threat as string || 'Unknown threat',
          competitor: t.competitor as string || 'Unknown competitor',
          description: t.description as string || 'No description',
          urgency: this.validateUrgency(t.urgency as string),
          recommendedResponse: t.recommendedResponse as string || 'No response recommended'
        })) : [],
      quickWins: Array.isArray(insights.quickWins) ? 
        insights.quickWins.map((q: Record<string, unknown>) => this.validatePMInsight(q, feedback)) : [],
      summary: {
        totalInsights: (Array.isArray(insights.topPriorities) ? insights.topPriorities.length : 0) +
                      (Array.isArray(insights.quickWins) ? insights.quickWins.length : 0),
        highPriorityCount: Array.isArray(insights.topPriorities) ? 
          insights.topPriorities.filter((p: Record<string, unknown>) => (p.priority as number || 0) >= 8).length : 0,
        quickWinsCount: Array.isArray(insights.quickWins) ? insights.quickWins.length : 0,
        threatsCount: Array.isArray(insights.competitiveThreats) ? insights.competitiveThreats.length : 0,
        overallSentiment: this.calculateOverallSentiment(feedback)
      }
    }
  }

  private validatePMInsight(insight: Record<string, unknown>, feedback: FeedbackItem[]): PMInsight {
    return {
      type: this.validateInsightType(insight.type as string),
      title: insight.title as string || 'Unknown insight',
      description: insight.description as string || 'No description',
      evidence: this.findRelevantFeedback(insight.title as string, feedback),
      priority: Math.min(Math.max(insight.priority as number || 5, 1), 10),
      effort: this.validateTShirtSize(insight.effort as string),
      impact: this.validateTShirtSize(insight.impact as string),
      recommendation: insight.recommendation as string || 'No recommendation provided',
      successMetrics: Array.isArray(insight.successMetrics) ? insight.successMetrics as string[] : [],
      category: this.validateCategory(insight.category as string),
      confidence: Math.min(Math.max(insight.confidence as number || 0.5, 0), 1),
      estimatedUsersAffected: insight.estimatedUsersAffected as number || 100,
      businessValue: this.validateBusinessValue(insight.businessValue as string),
      competitivePressure: this.validateCompetitivePressure(insight.competitivePressure as string),
      timeToMarket: this.validateTimeToMarket(insight.timeToMarket as string)
    }
  }

  private findRelevantFeedback(title: string, feedback: FeedbackItem[]): FeedbackItem[] {
    // Simple keyword matching - in production, use more sophisticated NLP
    const keywords = title.toLowerCase().split(/\s+/)
    return feedback.filter(item => 
      keywords.some(keyword => 
        item.content.toLowerCase().includes(keyword) ||
        item.author.toLowerCase().includes(keyword)
      )
    ).slice(0, 5) // Limit to 5 most relevant
  }

  private calculateOverallSentiment(feedback: FeedbackItem[]): number {
    if (feedback.length === 0) return 0
    
    const totalSentiment = feedback.reduce((sum, item) => sum + item.sentiment, 0)
    return totalSentiment / feedback.length
  }

  private validateInsightType(type: string): PMInsight['type'] {
    const validTypes: PMInsight['type'][] = ['feature_request', 'bug', 'opportunity', 'threat']
    return validTypes.includes(type as PMInsight['type']) ? type as PMInsight['type'] : 'opportunity'
  }

  private validateTShirtSize(size: string): 'XS' | 'S' | 'M' | 'L' | 'XL' {
    const validSizes = ['XS', 'S', 'M', 'L', 'XL']
    return validSizes.includes(size) ? size as 'XS' | 'S' | 'M' | 'L' | 'XL' : 'M'
  }

  private validateCategory(category: string): PMInsight['category'] {
    const validCategories: PMInsight['category'][] = [
      'user_experience', 'performance', 'pricing', 'documentation', 
      'integration', 'competitive', 'technical'
    ]
    return validCategories.includes(category as PMInsight['category']) ? 
      category as PMInsight['category'] : 'technical'
  }

  private validateImpact(impact: string): 'high' | 'medium' | 'low' {
    const validImpacts = ['high', 'medium', 'low']
    return validImpacts.includes(impact) ? impact as 'high' | 'medium' | 'low' : 'medium'
  }

  private validateTimeframe(timeframe: string): 'immediate' | 'short_term' | 'long_term' {
    const validTimeframes = ['immediate', 'short_term', 'long_term']
    return validTimeframes.includes(timeframe) ? 
      timeframe as 'immediate' | 'short_term' | 'long_term' : 'short_term'
  }

  private validateUrgency(urgency: string): 'high' | 'medium' | 'low' {
    const validUrgencies = ['high', 'medium', 'low']
    return validUrgencies.includes(urgency) ? urgency as 'high' | 'medium' | 'low' : 'medium'
  }

  private validateBusinessValue(value: string): 'high' | 'medium' | 'low' {
    const validValues = ['high', 'medium', 'low']
    return validValues.includes(value) ? value as 'high' | 'medium' | 'low' : 'medium'
  }

  private validateCompetitivePressure(pressure: string): 'high' | 'medium' | 'low' {
    const validPressures = ['high', 'medium', 'low']
    return validPressures.includes(pressure) ? pressure as 'high' | 'medium' | 'low' : 'medium'
  }

  private validateTimeToMarket(time: string): 'immediate' | 'short_term' | 'long_term' {
    const validTimes = ['immediate', 'short_term', 'long_term']
    return validTimes.includes(time) ? 
      time as 'immediate' | 'short_term' | 'long_term' : 'short_term'
  }

  private getFallbackDailyInsights(feedback: FeedbackItem[]): DailyInsights {
    return {
      date: new Date(),
      topPriorities: [],
      emergingTrends: [],
      competitiveThreats: [],
      quickWins: [],
      summary: {
        totalInsights: 0,
        highPriorityCount: 0,
        quickWinsCount: 0,
        threatsCount: 0,
        overallSentiment: this.calculateOverallSentiment(feedback)
      }
    }
  }

  private getFallbackPRDArtifact(insight: PMInsight): PMArtifact {
    return {
      type: 'prd_snippet',
      title: `PRD: ${insight.title}`,
      content: `Problem: ${insight.description}\n\nSolution: ${insight.recommendation}\n\nSuccess Metrics: ${insight.successMetrics.join(', ')}`,
      insightId: insight.title,
      priority: insight.priority,
      effort: insight.effort,
      impact: insight.impact,
      successCriteria: insight.successMetrics
    }
  }

  private getFallbackUserStoryArtifact(insight: PMInsight): PMArtifact {
    return {
      type: 'user_story',
      title: `User Story: ${insight.title}`,
      content: `As a developer, I want ${insight.title.toLowerCase()} so that I can ${insight.description.toLowerCase()}`,
      insightId: insight.title,
      priority: insight.priority,
      effort: insight.effort,
      impact: insight.impact,
      successCriteria: insight.successMetrics
    }
  }

  private getFallbackABTestArtifact(insight: PMInsight): PMArtifact {
    return {
      type: 'ab_test',
      title: `A/B Test: ${insight.title}`,
      content: `Test the impact of ${insight.title} on ${insight.successMetrics.join(', ')}`,
      insightId: insight.title,
      priority: insight.priority,
      effort: insight.effort,
      impact: insight.impact,
      successCriteria: insight.successMetrics
    }
  }

  private getFallbackGTMArtifact(insight: PMInsight): PMArtifact {
    return {
      type: 'gtm_suggestion',
      title: `GTM Strategy: ${insight.title}`,
      content: `Go-to-market strategy for ${insight.title} focusing on ${insight.category}`,
      insightId: insight.title,
      priority: insight.priority,
      effort: insight.effort,
      impact: insight.impact,
      successCriteria: insight.successMetrics
    }
  }
}

export const pmInsightsGenerator = new PMInsightsGenerator() 