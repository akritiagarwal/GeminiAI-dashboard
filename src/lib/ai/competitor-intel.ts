import { geminiModel } from './gemini'

export interface CompetitorUpdate {
  competitor: string
  updateType: 'feature_launch' | 'pricing_change' | 'model_update' | 'acquisition' | 'partnership' | 'announcement'
  title: string
  description: string
  date: Date
  source: string
  url?: string
  impact: 'major' | 'minor' | 'neutral'
  developerReaction?: {
    sentiment: number // -1 to 1
    volume: number
    keyComments: string[]
  }
}

export interface CompetitorAnalysis {
  competitor: string
  latestUpdate: {
    type: string
    description: string
    date: Date
    source: string
  }
  developerSentiment: number
  threatLevel: 'high' | 'medium' | 'low'
  geminiAdvantages: string[]
  geminiDisadvantages: string[]
  recommendedResponse: string
  marketPosition: {
    strength: number // 0 to 1
    weaknesses: string[]
    opportunities: string[]
  }
  featureComparison: {
    feature: string
    geminiStatus: 'better' | 'worse' | 'same' | 'missing'
    gapDescription?: string
    priority: 'high' | 'medium' | 'low'
  }[]
}

export interface SwitchingPattern {
  direction: 'to_gemini' | 'from_gemini' | 'considering'
  competitor: string
  reasons: string[]
  sentiment: number
  frequency: number
  concerns: string[]
  opportunities: string[]
}

export interface CompetitiveIntelligenceReport {
  dailySummary: {
    date: Date
    totalUpdates: number
    majorAnnouncements: number
    threatLevel: 'high' | 'medium' | 'low'
    keyDevelopments: string[]
  }
  competitorActivity: CompetitorUpdate[]
  analysis: CompetitorAnalysis[]
  switchingPatterns: SwitchingPattern[]
  winLossAnalysis: {
    wins: {
      count: number
      reasons: string[]
      examples: string[]
    }
    losses: {
      count: number
      reasons: string[]
      examples: string[]
    }
    opportunities: {
      count: number
      areas: string[]
      recommendations: string[]
    }
  }
  featureParity: {
    geminiLeading: string[]
    geminiLagging: string[]
    parity: string[]
    gaps: {
      feature: string
      competitor: string
      impact: 'high' | 'medium' | 'low'
      effort: 'low' | 'medium' | 'high'
    }[]
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    strategic: string[]
  }
}

export interface CompetitorMonitoringConfig {
  competitors: {
    name: string
    priority: 'high' | 'medium' | 'low'
    keywords: string[]
    sources: string[]
  }[]
  updateTypes: string[]
  threatIndicators: string[]
}

class CompetitorIntelligence {
  private readonly systemPrompt = `You are an expert competitive intelligence analyst specializing in AI/ML APIs. You understand:

1. The competitive landscape of AI APIs (OpenAI, Anthropic, Perplexity, etc.)
2. Developer preferences and pain points
3. Feature comparisons and market positioning
4. Pricing strategies and business models
5. Technical capabilities and limitations

Analyze competitor activities with high precision, considering:
- Technical capabilities and limitations
- Developer sentiment and adoption patterns
- Market positioning and differentiation
- Pricing and business model implications
- Strategic implications for Gemini

Always provide evidence-based analysis and actionable recommendations.`

  private readonly competitors = [
    { name: 'OpenAI', priority: 'high' as const, keywords: ['GPT-4', 'GPT-3.5', 'ChatGPT', 'DALL-E', 'Whisper'] },
    { name: 'Anthropic', priority: 'high' as const, keywords: ['Claude', 'Claude-3', 'Constitutional AI'] },
    { name: 'Perplexity', priority: 'medium' as const, keywords: ['Perplexity AI', 'search', 'real-time'] },
    { name: 'Grok', priority: 'medium' as const, keywords: ['xAI', 'Grok', 'Elon Musk'] },
    { name: 'Mistral', priority: 'medium' as const, keywords: ['Mistral AI', 'open source', 'Mixtral'] },
    { name: 'Cohere', priority: 'low' as const, keywords: ['Cohere', 'embedding', 'classification'] }
  ]

  private async analyzeWithGemini(prompt: string, retries = 3): Promise<string> {
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

  async analyzeCompetitorUpdate(
    competitor: string,
    updateContent: string,
    developerFeedback?: string[]
  ): Promise<CompetitorAnalysis> {
    const prompt = `Analyze this competitor update and provide a comprehensive competitive analysis. Return a JSON response:

{
  "competitor": "competitor name",
  "latestUpdate": {
    "type": "update type",
    "description": "detailed description",
    "date": "2024-01-01",
    "source": "source of information"
  },
  "developerSentiment": -1 to 1,
  "threatLevel": "high|medium|low",
  "geminiAdvantages": ["advantage1", "advantage2"],
  "geminiDisadvantages": ["disadvantage1", "disadvantage2"],
  "recommendedResponse": "detailed recommendation",
  "marketPosition": {
    "strength": 0 to 1,
    "weaknesses": ["weakness1", "weakness2"],
    "opportunities": ["opportunity1", "opportunity2"]
  },
  "featureComparison": [
    {
      "feature": "feature name",
      "geminiStatus": "better|worse|same|missing",
      "gapDescription": "description of gap",
      "priority": "high|medium|low"
    }
  ]
}

Competitor: ${competitor}
Update Content: "${updateContent}"
${developerFeedback ? `Developer Feedback: ${JSON.stringify(developerFeedback)}` : ''}

Focus on:
- Technical capabilities and limitations
- Developer sentiment and adoption
- Market positioning vs Gemini
- Strategic implications
- Recommended responses`

    try {
      const response = await this.analyzeWithGemini(prompt)
      const analysis = JSON.parse(response)
      
      return this.validateCompetitorAnalysis(analysis)
    } catch (error) {
      console.error('Error in competitor analysis:', error)
      return this.getFallbackCompetitorAnalysis(competitor)
    }
  }

  async detectSwitchingPatterns(feedback: string[]): Promise<SwitchingPattern[]> {
    const prompt = `Analyze this developer feedback to detect switching patterns between AI APIs. Return a JSON array:

[
  {
    "direction": "to_gemini|from_gemini|considering",
    "competitor": "competitor name",
    "reasons": ["reason1", "reason2"],
    "sentiment": -1 to 1,
    "frequency": 1,
    "concerns": ["concern1", "concern2"],
    "opportunities": ["opportunity1", "opportunity2"]
  }
]

Developer Feedback: ${JSON.stringify(feedback)}

Look for:
- Explicit mentions of switching ("I'm moving from X to Gemini")
- Implicit switching indicators (comparisons, preferences)
- Concerns about current solutions
- Positive mentions of alternatives
- Fence-sitting behavior (considering multiple options)

Focus on:
- Reasons for switching (pricing, features, performance)
- Concerns about switching (compatibility, learning curve)
- Opportunities to capture switchers`

    try {
      const response = await this.analyzeWithGemini(prompt)
      const patterns = JSON.parse(response)
      
      return Array.isArray(patterns) ? patterns.map(pattern => this.validateSwitchingPattern(pattern)) : []
    } catch (error) {
      console.error('Error in switching pattern detection:', error)
      return []
    }
  }

  async generateCompetitiveReport(
    competitorUpdates: CompetitorUpdate[],
    switchingPatterns: SwitchingPattern[],
    developerFeedback: string[]
  ): Promise<CompetitiveIntelligenceReport> {
    const prompt = `Generate a comprehensive competitive intelligence report. Return a JSON response:

{
  "dailySummary": {
    "date": "2024-01-01",
    "totalUpdates": 5,
    "majorAnnouncements": 2,
    "threatLevel": "high|medium|low",
    "keyDevelopments": ["development1", "development2"]
  },
  "winLossAnalysis": {
    "wins": {
      "count": 3,
      "reasons": ["reason1", "reason2"],
      "examples": ["example1", "example2"]
    },
    "losses": {
      "count": 1,
      "reasons": ["reason1", "reason2"],
      "examples": ["example1", "example2"]
    },
    "opportunities": {
      "count": 2,
      "areas": ["area1", "area2"],
      "recommendations": ["rec1", "rec2"]
    }
  },
  "featureParity": {
    "geminiLeading": ["feature1", "feature2"],
    "geminiLagging": ["feature1", "feature2"],
    "parity": ["feature1", "feature2"],
    "gaps": [
      {
        "feature": "feature name",
        "competitor": "competitor name",
        "impact": "high|medium|low",
        "effort": "low|medium|high"
      }
    ]
  },
  "recommendations": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"],
    "strategic": ["action1", "action2"]
  }
}

Competitor Updates: ${JSON.stringify(competitorUpdates)}
Switching Patterns: ${JSON.stringify(switchingPatterns)}
Developer Feedback: ${JSON.stringify(developerFeedback.slice(0, 10))}

Focus on:
- Key competitive developments
- Win/loss analysis with examples
- Feature parity assessment
- Strategic recommendations
- Immediate action items`

    try {
      const response = await this.analyzeWithGemini(prompt)
      const report = JSON.parse(response)
      
      return this.validateCompetitiveReport(report, competitorUpdates, switchingPatterns)
    } catch (error) {
      console.error('Error in competitive report generation:', error)
      return this.getFallbackCompetitiveReport(competitorUpdates, switchingPatterns)
    }
  }

  async analyzeFeatureComparison(
    feature: string,
    geminiCapability: string,
    competitorCapability: string
  ): Promise<{
    geminiAdvantage: number // -1 to 1
    gapDescription: string
    priority: 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
  }> {
    const prompt = `Compare Gemini and competitor capabilities for a specific feature. Return a JSON response:

{
  "geminiAdvantage": -1 to 1,
  "gapDescription": "detailed description of the gap",
  "priority": "high|medium|low",
  "effort": "low|medium|high"
}

Feature: ${feature}
Gemini Capability: "${geminiCapability}"
Competitor Capability: "${competitorCapability}"

Consider:
- Technical superiority
- Developer experience
- Performance characteristics
- Integration capabilities
- Documentation quality`

    try {
      const response = await this.analyzeWithGemini(prompt)
      const comparison = JSON.parse(response)
      
      return {
        geminiAdvantage: Math.min(Math.max(comparison.geminiAdvantage || 0, -1), 1),
        gapDescription: comparison.gapDescription || 'No gap description provided',
        priority: this.validatePriority(comparison.priority),
        effort: this.validateEffort(comparison.effort)
      }
    } catch (error) {
      console.error('Error in feature comparison:', error)
      return {
        geminiAdvantage: 0,
        gapDescription: 'Unable to compare capabilities',
        priority: 'medium',
        effort: 'medium'
      }
    }
  }

  async monitorCompetitorActivity(
    competitorName: string,
    activityData: string[]
  ): Promise<CompetitorUpdate[]> {
    const updates: CompetitorUpdate[] = []
    
    for (const activity of activityData) {
      try {
        const update = await this.parseCompetitorActivity(competitorName, activity)
        if (update) {
          updates.push(update)
        }
      } catch (error) {
        console.error(`Error parsing activity for ${competitorName}:`, error)
      }
    }
    
    return updates
  }

  private async parseCompetitorActivity(
    competitor: string,
    activity: string
  ): Promise<CompetitorUpdate | null> {
    const prompt = `Parse this competitor activity into a structured update. Return a JSON response:

{
  "updateType": "feature_launch|pricing_change|model_update|acquisition|partnership|announcement",
  "title": "brief title",
  "description": "detailed description",
  "date": "2024-01-01",
  "source": "source of information",
  "impact": "major|minor|neutral"
}

Competitor: ${competitor}
Activity: "${activity}"

If this is not a significant update, return null.`

    try {
      const response = await this.analyzeWithGemini(prompt)
      const update = JSON.parse(response)
      
      if (!update || update === 'null') return null
      
      return {
        competitor,
        updateType: this.validateUpdateType(update.updateType),
        title: update.title || 'Unknown update',
        description: update.description || 'No description provided',
        date: new Date(update.date || Date.now()),
        source: update.source || 'Unknown source',
        impact: this.validateImpact(update.impact)
      }
    } catch (error) {
      console.error('Error parsing competitor activity:', error)
      return null
    }
  }

  private validateCompetitorAnalysis(analysis: Record<string, unknown>): CompetitorAnalysis {
    return {
      competitor: analysis.competitor as string || 'Unknown',
      latestUpdate: {
        type: (analysis.latestUpdate as Record<string, unknown>)?.type as string || 'Unknown',
        description: (analysis.latestUpdate as Record<string, unknown>)?.description as string || 'No description',
        date: new Date((analysis.latestUpdate as Record<string, unknown>)?.date as string || Date.now()),
        source: (analysis.latestUpdate as Record<string, unknown>)?.source as string || 'Unknown'
      },
      developerSentiment: Math.min(Math.max(analysis.developerSentiment as number || 0, -1), 1),
      threatLevel: this.validateThreatLevel(analysis.threatLevel as string),
      geminiAdvantages: Array.isArray(analysis.geminiAdvantages) ? analysis.geminiAdvantages as string[] : [],
      geminiDisadvantages: Array.isArray(analysis.geminiDisadvantages) ? analysis.geminiDisadvantages as string[] : [],
      recommendedResponse: analysis.recommendedResponse as string || 'No recommendation provided',
      marketPosition: {
        strength: Math.min(Math.max((analysis.marketPosition as Record<string, unknown>)?.strength as number || 0.5, 0), 1),
        weaknesses: Array.isArray((analysis.marketPosition as Record<string, unknown>)?.weaknesses) ? 
          (analysis.marketPosition as Record<string, unknown>).weaknesses as string[] : [],
        opportunities: Array.isArray((analysis.marketPosition as Record<string, unknown>)?.opportunities) ? 
          (analysis.marketPosition as Record<string, unknown>).opportunities as string[] : []
      },
      featureComparison: Array.isArray(analysis.featureComparison) ? 
        analysis.featureComparison.map((fc: Record<string, unknown>) => ({
          feature: fc.feature as string || 'Unknown',
          geminiStatus: this.validateGeminiStatus(fc.geminiStatus as string),
          gapDescription: fc.gapDescription as string,
          priority: this.validatePriority(fc.priority as string)
        })) : []
    }
  }

  private validateSwitchingPattern(pattern: Record<string, unknown>): SwitchingPattern {
    return {
      direction: this.validateDirection(pattern.direction as string),
      competitor: pattern.competitor as string || 'Unknown',
      reasons: Array.isArray(pattern.reasons) ? pattern.reasons as string[] : [],
      sentiment: Math.min(Math.max(pattern.sentiment as number || 0, -1), 1),
      frequency: Math.max(pattern.frequency as number || 1, 1),
      concerns: Array.isArray(pattern.concerns) ? pattern.concerns as string[] : [],
      opportunities: Array.isArray(pattern.opportunities) ? pattern.opportunities as string[] : []
    }
  }

  private validateCompetitiveReport(
    report: Record<string, unknown>,
    competitorUpdates: CompetitorUpdate[],
    switchingPatterns: SwitchingPattern[]
  ): CompetitiveIntelligenceReport {
    return {
      dailySummary: {
        date: new Date((report.dailySummary as Record<string, unknown>)?.date as string || Date.now()),
        totalUpdates: (report.dailySummary as Record<string, unknown>)?.totalUpdates as number || competitorUpdates.length,
        majorAnnouncements: (report.dailySummary as Record<string, unknown>)?.majorAnnouncements as number || 0,
        threatLevel: this.validateThreatLevel((report.dailySummary as Record<string, unknown>)?.threatLevel as string),
        keyDevelopments: Array.isArray((report.dailySummary as Record<string, unknown>)?.keyDevelopments) ? 
          (report.dailySummary as Record<string, unknown>).keyDevelopments as string[] : []
      },
      competitorActivity: competitorUpdates,
      analysis: [], // Will be populated separately
      switchingPatterns,
      winLossAnalysis: {
        wins: {
          count: ((report.winLossAnalysis as Record<string, unknown>)?.wins as Record<string, unknown>)?.count as number || 0,
          reasons: Array.isArray(((report.winLossAnalysis as Record<string, unknown>)?.wins as Record<string, unknown>)?.reasons) ? 
            ((report.winLossAnalysis as Record<string, unknown>)?.wins as Record<string, unknown>)?.reasons as string[] : [],
          examples: Array.isArray(((report.winLossAnalysis as Record<string, unknown>)?.wins as Record<string, unknown>)?.examples) ? 
            ((report.winLossAnalysis as Record<string, unknown>)?.wins as Record<string, unknown>)?.examples as string[] : []
        },
        losses: {
          count: ((report.winLossAnalysis as Record<string, unknown>)?.losses as Record<string, unknown>)?.count as number || 0,
          reasons: Array.isArray(((report.winLossAnalysis as Record<string, unknown>)?.losses as Record<string, unknown>)?.reasons) ? 
            ((report.winLossAnalysis as Record<string, unknown>)?.losses as Record<string, unknown>)?.reasons as string[] : [],
          examples: Array.isArray(((report.winLossAnalysis as Record<string, unknown>)?.losses as Record<string, unknown>)?.examples) ? 
            ((report.winLossAnalysis as Record<string, unknown>)?.losses as Record<string, unknown>)?.examples as string[] : []
        },
        opportunities: {
          count: ((report.winLossAnalysis as Record<string, unknown>)?.opportunities as Record<string, unknown>)?.count as number || 0,
          areas: Array.isArray(((report.winLossAnalysis as Record<string, unknown>)?.opportunities as Record<string, unknown>)?.areas) ? 
            ((report.winLossAnalysis as Record<string, unknown>)?.opportunities as Record<string, unknown>)?.areas as string[] : [],
          recommendations: Array.isArray(((report.winLossAnalysis as Record<string, unknown>)?.opportunities as Record<string, unknown>)?.recommendations) ? 
            ((report.winLossAnalysis as Record<string, unknown>)?.opportunities as Record<string, unknown>)?.recommendations as string[] : []
        }
      },
      featureParity: {
        geminiLeading: Array.isArray((report.featureParity as Record<string, unknown>)?.geminiLeading) ? 
          (report.featureParity as Record<string, unknown>).geminiLeading as string[] : [],
        geminiLagging: Array.isArray((report.featureParity as Record<string, unknown>)?.geminiLagging) ? 
          (report.featureParity as Record<string, unknown>).geminiLagging as string[] : [],
        parity: Array.isArray((report.featureParity as Record<string, unknown>)?.parity) ? 
          (report.featureParity as Record<string, unknown>).parity as string[] : [],
        gaps: Array.isArray((report.featureParity as Record<string, unknown>)?.gaps) ? 
          ((report.featureParity as Record<string, unknown>).gaps as Record<string, unknown>[]).map((gap: Record<string, unknown>) => ({
            feature: gap.feature as string || 'Unknown',
            competitor: gap.competitor as string || 'Unknown',
            impact: this.validatePriority(gap.impact as string), // Using priority validation for impact
            effort: this.validateEffort(gap.effort as string)
          })) : []
      },
      recommendations: {
        immediate: Array.isArray((report.recommendations as Record<string, unknown>)?.immediate) ? 
          (report.recommendations as Record<string, unknown>).immediate as string[] : [],
        shortTerm: Array.isArray((report.recommendations as Record<string, unknown>)?.shortTerm) ? 
          (report.recommendations as Record<string, unknown>).shortTerm as string[] : [],
        longTerm: Array.isArray((report.recommendations as Record<string, unknown>)?.longTerm) ? 
          (report.recommendations as Record<string, unknown>).longTerm as string[] : [],
        strategic: Array.isArray((report.recommendations as Record<string, unknown>)?.strategic) ? 
          (report.recommendations as Record<string, unknown>).strategic as string[] : []
      }
    }
  }

  private validateUpdateType(type: string): CompetitorUpdate['updateType'] {
    const validTypes: CompetitorUpdate['updateType'][] = [
      'feature_launch', 'pricing_change', 'model_update', 'acquisition', 'partnership', 'announcement'
    ]
    return validTypes.includes(type as CompetitorUpdate['updateType']) ? 
      type as CompetitorUpdate['updateType'] : 'announcement'
  }

  private validateThreatLevel(level: string): 'high' | 'medium' | 'low' {
    const validLevels = ['high', 'medium', 'low']
    return validLevels.includes(level) ? level as 'high' | 'medium' | 'low' : 'medium'
  }

  private validateDirection(direction: string): SwitchingPattern['direction'] {
    const validDirections: SwitchingPattern['direction'][] = ['to_gemini', 'from_gemini', 'considering']
    return validDirections.includes(direction as SwitchingPattern['direction']) ? 
      direction as SwitchingPattern['direction'] : 'considering'
  }

  private validateGeminiStatus(status: string): 'better' | 'worse' | 'same' | 'missing' {
    const validStatuses = ['better', 'worse', 'same', 'missing']
    return validStatuses.includes(status) ? status as 'better' | 'worse' | 'same' | 'missing' : 'same'
  }

  private validatePriority(priority: string): 'high' | 'medium' | 'low' {
    const validPriorities = ['high', 'medium', 'low']
    return validPriorities.includes(priority) ? priority as 'high' | 'medium' | 'low' : 'medium'
  }

  private validateImpact(impact: string): 'major' | 'minor' | 'neutral' {
    const validImpacts = ['major', 'minor', 'neutral']
    return validImpacts.includes(impact) ? impact as 'major' | 'minor' | 'neutral' : 'neutral'
  }

  private validateEffort(effort: string): 'low' | 'medium' | 'high' {
    const validEfforts = ['low', 'medium', 'high']
    return validEfforts.includes(effort) ? effort as 'low' | 'medium' | 'high' : 'medium'
  }

  private getFallbackCompetitorAnalysis(competitor: string): CompetitorAnalysis {
    return {
      competitor,
      latestUpdate: {
        type: 'announcement',
        description: 'No update information available',
        date: new Date(),
        source: 'Unknown'
      },
      developerSentiment: 0,
      threatLevel: 'medium',
      geminiAdvantages: [],
      geminiDisadvantages: [],
      recommendedResponse: 'Continue monitoring competitor activities',
      marketPosition: {
        strength: 0.5,
        weaknesses: [],
        opportunities: []
      },
      featureComparison: []
    }
  }

  private getFallbackCompetitiveReport(
    competitorUpdates: CompetitorUpdate[],
    switchingPatterns: SwitchingPattern[]
  ): CompetitiveIntelligenceReport {
    return {
      dailySummary: {
        date: new Date(),
        totalUpdates: competitorUpdates.length,
        majorAnnouncements: 0,
        threatLevel: 'medium',
        keyDevelopments: []
      },
      competitorActivity: competitorUpdates,
      analysis: [],
      switchingPatterns,
      winLossAnalysis: {
        wins: { count: 0, reasons: [], examples: [] },
        losses: { count: 0, reasons: [], examples: [] },
        opportunities: { count: 0, areas: [], recommendations: [] }
      },
      featureParity: {
        geminiLeading: [],
        geminiLagging: [],
        parity: [],
        gaps: []
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        strategic: []
      }
    }
  }
}

export const competitorIntelligence = new CompetitorIntelligence() 