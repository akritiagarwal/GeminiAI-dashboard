import { geminiModel } from './gemini'

export interface ExtractedFeature {
  name: string
  category: 'core_api' | 'documentation' | 'pricing' | 'model_capabilities' | 'integration' | 'performance' | 'security' | 'other'
  sentiment: 'positive' | 'negative' | 'neutral'
  frequency: number
  competitorComparison?: {
    competitor: string
    betterOrWorse: 'better' | 'worse' | 'same'
    reason: string
  }
  suggestedImprovement?: string
  businessImpact: 'high' | 'medium' | 'low'
  confidence: number
  useCases: string[]
  technicalDetails?: {
    complexity: 'low' | 'medium' | 'high'
    implementationEffort: 'low' | 'medium' | 'high'
    dependencies: string[]
  }
}

export interface FeatureCluster {
  clusterId: string
  primaryFeature: string
  relatedFeatures: string[]
  totalMentions: number
  averageSentiment: number
  trendingDirection: 'increasing' | 'decreasing' | 'stable'
  category: string
  businessImpact: 'high' | 'medium' | 'low'
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface FeatureInsights {
  trendingFeatures: ExtractedFeature[]
  competitiveGaps: {
    feature: string
    competitors: string[]
    gapDescription: string
    impact: 'high' | 'medium' | 'low'
  }[]
  quickWins: ExtractedFeature[]
  longTermInvestments: ExtractedFeature[]
  featurePrioritization: {
    highImpact: ExtractedFeature[]
    mediumImpact: ExtractedFeature[]
    lowImpact: ExtractedFeature[]
  }
  categoryBreakdown: Record<string, { count: number; sentiment: number }>
}

export interface FeatureExtractionResult {
  features: ExtractedFeature[]
  clusters: FeatureCluster[]
  insights: FeatureInsights
  summary: {
    totalFeatures: number
    positiveFeatures: number
    negativeFeatures: number
    competitiveMentions: number
    highImpactFeatures: number
  }
}

class FeatureExtractor {
  private readonly systemPrompt = `You are an expert product manager specializing in AI API feature analysis. You understand:

1. Developer workflows and pain points
2. API feature categories and priorities
3. Competitive landscape in AI/ML APIs
4. Technical implementation complexity
5. Business impact assessment

Extract features with high precision, considering:
- Explicit feature mentions and requests
- Implicit feature needs from complaints
- Competitor comparisons and gaps
- Technical implementation details
- Business value and user impact

Always provide confidence scores and categorize features appropriately.`

  private async extractWithGemini(prompt: string, retries = 3): Promise<string> {
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

  async extractFeatures(text: string): Promise<ExtractedFeature[]> {
    const prompt = `Extract features mentioned in this developer feedback about Gemini API. Return a JSON array:

[
  {
    "name": "feature name",
    "category": "core_api|documentation|pricing|model_capabilities|integration|performance|security|other",
    "sentiment": "positive|negative|neutral",
    "frequency": 1,
    "competitorComparison": {
      "competitor": "competitor name",
      "betterOrWorse": "better|worse|same",
      "reason": "explanation"
    },
    "suggestedImprovement": "specific improvement suggestion",
    "businessImpact": "high|medium|low",
    "confidence": 0 to 1,
    "useCases": ["use case 1", "use case 2"],
    "technicalDetails": {
      "complexity": "low|medium|high",
      "implementationEffort": "low|medium|high",
      "dependencies": ["dependency1", "dependency2"]
    }
  }
]

Developer feedback: "${text}"

Look for:
- Explicit feature mentions ("I love the X feature", "I need Y feature")
- Implicit feature needs (complaints that suggest missing features)
- Competitor comparisons ("OpenAI has X but Gemini doesn't")
- Technical implementation details
- Use cases and workflows
- Performance and reliability mentions
- Documentation and developer experience
- Pricing and quota discussions

Categorize carefully:
- core_api: API endpoints, authentication, core functionality
- documentation: docs, examples, tutorials, guides
- pricing: costs, quotas, limits, billing
- model_capabilities: model performance, accuracy, capabilities
- integration: SDKs, libraries, frameworks, tools
- performance: speed, latency, throughput, efficiency
- security: authentication, encryption, privacy
- other: anything else`

    try {
      const response = await this.extractWithGemini(prompt)
      const features = JSON.parse(response)
      
      return Array.isArray(features) ? features.map(feature => this.validateFeature(feature)) : []
    } catch (error) {
      console.error('Error in feature extraction:', error)
      return []
    }
  }

  async extractFeaturesFromBatch(texts: string[]): Promise<ExtractedFeature[]> {
    const allFeatures: ExtractedFeature[] = []
    
    // Process in batches to avoid rate limits
    const batchSize = 3
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (text) => {
        try {
          return await this.extractFeatures(text)
        } catch (error) {
          console.error('Error in batch feature extraction:', error)
          return []
        }
      })

      const batchResults = await Promise.all(batchPromises)
      allFeatures.push(...batchResults.flat())

      // Rate limiting between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return this.mergeDuplicateFeatures(allFeatures)
  }

  private mergeDuplicateFeatures(features: ExtractedFeature[]): ExtractedFeature[] {
    const featureMap = new Map<string, ExtractedFeature>()

    for (const feature of features) {
      const key = feature.name.toLowerCase().trim()
      
      if (featureMap.has(key)) {
        const existing = featureMap.get(key)!
        existing.frequency += feature.frequency
        
        // Merge sentiments (weighted average)
        const totalWeight = existing.frequency + feature.frequency
        existing.confidence = (existing.confidence * existing.frequency + feature.confidence * feature.frequency) / totalWeight
        
        // Merge use cases
        existing.useCases = [...new Set([...existing.useCases, ...feature.useCases])]
        
        // Keep the higher business impact
        if (this.getImpactScore(feature.businessImpact) > this.getImpactScore(existing.businessImpact)) {
          existing.businessImpact = feature.businessImpact
        }
        
        // Merge competitor comparisons
        if (feature.competitorComparison && !existing.competitorComparison) {
          existing.competitorComparison = feature.competitorComparison
        }
        
        // Merge suggested improvements
        if (feature.suggestedImprovement && !existing.suggestedImprovement) {
          existing.suggestedImprovement = feature.suggestedImprovement
        }
      } else {
        featureMap.set(key, { ...feature })
      }
    }

    return Array.from(featureMap.values())
  }

  private getImpactScore(impact: 'high' | 'medium' | 'low'): number {
    switch (impact) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 1
    }
  }

  createFeatureClusters(features: ExtractedFeature[]): FeatureCluster[] {
    const clusters: FeatureCluster[] = []
    const processedFeatures = new Set<string>()

    for (const feature of features) {
      if (processedFeatures.has(feature.name)) continue

      const relatedFeatures = features.filter(f => 
        f.name !== feature.name && 
        this.areFeaturesRelated(feature.name, f.name)
      )

      if (relatedFeatures.length > 0) {
        const clusterFeatures = [feature.name, ...relatedFeatures.map(f => f.name)]
        const totalMentions = clusterFeatures.reduce((sum, name) => {
          const f = features.find(feature => feature.name === name)
          return sum + (f?.frequency || 1)
        }, 0)

        const averageSentiment = this.calculateAverageSentiment([
          feature,
          ...relatedFeatures
        ])

        clusters.push({
          clusterId: `cluster_${feature.name.toLowerCase().replace(/\s+/g, '_')}`,
          primaryFeature: feature.name,
          relatedFeatures: relatedFeatures.map(f => f.name),
          totalMentions,
          averageSentiment,
          trendingDirection: this.determineTrendingDirection(),
          category: feature.category,
          businessImpact: this.determineClusterImpact([feature, ...relatedFeatures]),
          priority: this.determineClusterPriority([feature, ...relatedFeatures])
        })

        clusterFeatures.forEach(name => processedFeatures.add(name))
      } else {
        clusters.push({
          clusterId: `cluster_${feature.name.toLowerCase().replace(/\s+/g, '_')}`,
          primaryFeature: feature.name,
          relatedFeatures: [],
          totalMentions: feature.frequency,
          averageSentiment: this.sentimentToScore(feature.sentiment),
          trendingDirection: 'stable',
          category: feature.category,
          businessImpact: feature.businessImpact,
          priority: this.impactToPriority(feature.businessImpact)
        })
        processedFeatures.add(feature.name)
      }
    }

    return clusters
  }

  generateInsights(features: ExtractedFeature[]): FeatureInsights {
    const trendingFeatures = this.identifyTrendingFeatures(features)
    const competitiveGaps = this.identifyCompetitiveGaps(features)
    const quickWins = this.identifyQuickWins(features)
    const longTermInvestments = this.identifyLongTermInvestments(features)

    return {
      trendingFeatures,
      competitiveGaps,
      quickWins,
      longTermInvestments,
      featurePrioritization: {
        highImpact: features.filter(f => f.businessImpact === 'high'),
        mediumImpact: features.filter(f => f.businessImpact === 'medium'),
        lowImpact: features.filter(f => f.businessImpact === 'low')
      },
      categoryBreakdown: this.createCategoryBreakdown(features)
    }
  }

  async analyzeFeatures(texts: string[]): Promise<FeatureExtractionResult> {
    console.log('Starting feature extraction analysis...')
    
    const features = await this.extractFeaturesFromBatch(texts)
    const clusters = this.createFeatureClusters(features)
    const insights = this.generateInsights(features)

    const summary = {
      totalFeatures: features.length,
      positiveFeatures: features.filter(f => f.sentiment === 'positive').length,
      negativeFeatures: features.filter(f => f.sentiment === 'negative').length,
      competitiveMentions: features.filter(f => f.competitorComparison).length,
      highImpactFeatures: features.filter(f => f.businessImpact === 'high').length
    }

    return {
      features,
      clusters,
      insights,
      summary
    }
  }

  private validateFeature(feature: Record<string, unknown>): ExtractedFeature {
    return {
      name: feature.name as string || 'Unknown feature',
      category: this.validateCategory(feature.category as string),
      sentiment: this.validateSentiment(feature.sentiment as string),
      frequency: Math.max(feature.frequency as number || 1, 1),
      competitorComparison: feature.competitorComparison ? {
        competitor: (feature.competitorComparison as Record<string, unknown>).competitor as string || 'Unknown',
        betterOrWorse: this.validateComparison((feature.competitorComparison as Record<string, unknown>).betterOrWorse as string),
        reason: (feature.competitorComparison as Record<string, unknown>).reason as string || 'No reason provided'
      } : undefined,
      suggestedImprovement: feature.suggestedImprovement as string,
      businessImpact: this.validateImpact(feature.businessImpact as string),
      confidence: Math.min(Math.max(feature.confidence as number || 0.5, 0), 1),
      useCases: Array.isArray(feature.useCases) ? feature.useCases as string[] : [],
      technicalDetails: feature.technicalDetails ? {
        complexity: this.validateComplexity((feature.technicalDetails as Record<string, unknown>).complexity as string),
        implementationEffort: this.validateComplexity((feature.technicalDetails as Record<string, unknown>).implementationEffort as string),
        dependencies: Array.isArray((feature.technicalDetails as Record<string, unknown>).dependencies) ? 
          (feature.technicalDetails as Record<string, unknown>).dependencies as string[] : []
      } : undefined
    }
  }

  private validateCategory(category: string): ExtractedFeature['category'] {
    const validCategories: ExtractedFeature['category'][] = [
      'core_api', 'documentation', 'pricing', 'model_capabilities', 
      'integration', 'performance', 'security', 'other'
    ]
    return validCategories.includes(category as ExtractedFeature['category']) ? category as ExtractedFeature['category'] : 'other'
  }

  private validateSentiment(sentiment: string): ExtractedFeature['sentiment'] {
    const validSentiments: ExtractedFeature['sentiment'][] = ['positive', 'negative', 'neutral']
    return validSentiments.includes(sentiment as ExtractedFeature['sentiment']) ? sentiment as ExtractedFeature['sentiment'] : 'neutral'
  }

  private validateComparison(comparison: string): 'better' | 'worse' | 'same' {
    const validComparisons = ['better', 'worse', 'same']
    return validComparisons.includes(comparison) ? comparison as 'better' | 'worse' | 'same' : 'same'
  }

  private validateImpact(impact: string): ExtractedFeature['businessImpact'] {
    const validImpacts: ExtractedFeature['businessImpact'][] = ['high', 'medium', 'low']
    return validImpacts.includes(impact as ExtractedFeature['businessImpact']) ? impact as ExtractedFeature['businessImpact'] : 'medium'
  }

  private validateComplexity(complexity: string): 'low' | 'medium' | 'high' {
    const validComplexities = ['low', 'medium', 'high']
    return validComplexities.includes(complexity) ? complexity as 'low' | 'medium' | 'high' : 'medium'
  }

  private areFeaturesRelated(feature1: string, feature2: string): boolean {
    const words1 = feature1.toLowerCase().split(/\s+/)
    const words2 = feature2.toLowerCase().split(/\s+/)
    
    // Check for common words
    const commonWords = words1.filter(word => words2.includes(word))
    if (commonWords.length > 0) return true
    
    // Check for semantic similarity (simple approach)
    const similarity = this.calculateSimilarity(feature1, feature2)
    return similarity > 0.6
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  private calculateAverageSentiment(features: ExtractedFeature[]): number {
    if (features.length === 0) return 0
    
    const totalScore = features.reduce((sum, feature) => {
      return sum + this.sentimentToScore(feature.sentiment) * feature.frequency
    }, 0)
    
    const totalFrequency = features.reduce((sum, feature) => sum + feature.frequency, 0)
    return totalScore / totalFrequency
  }

  private sentimentToScore(sentiment: 'positive' | 'negative' | 'neutral'): number {
    switch (sentiment) {
      case 'positive': return 1
      case 'negative': return -1
      case 'neutral': return 0
      default: return 0
    }
  }

  private determineTrendingDirection(): 'increasing' | 'decreasing' | 'stable' {
    // This would typically use historical data
    // For now, return stable as placeholder
    return 'stable'
  }

  private determineClusterImpact(features: ExtractedFeature[]): 'high' | 'medium' | 'low' {
    const impactScores = features.map(f => this.getImpactScore(f.businessImpact))
    const averageScore = impactScores.reduce((sum, score) => sum + score, 0) / impactScores.length
    
    if (averageScore >= 2.5) return 'high'
    if (averageScore >= 1.5) return 'medium'
    return 'low'
  }

  private determineClusterPriority(features: ExtractedFeature[]): 'critical' | 'high' | 'medium' | 'low' {
    const highImpactCount = features.filter(f => f.businessImpact === 'high').length
    const negativeCount = features.filter(f => f.sentiment === 'negative').length
    
    if (highImpactCount > 0 && negativeCount > 0) return 'critical'
    if (highImpactCount > 0) return 'high'
    if (negativeCount > 0) return 'medium'
    return 'low'
  }

  private impactToPriority(impact: 'high' | 'medium' | 'low'): 'critical' | 'high' | 'medium' | 'low' {
    switch (impact) {
      case 'high': return 'high'
      case 'medium': return 'medium'
      case 'low': return 'low'
      default: return 'medium'
    }
  }

  private identifyTrendingFeatures(features: ExtractedFeature[]): ExtractedFeature[] {
    // Sort by frequency and sentiment
    return features
      .sort((a, b) => {
        const scoreA = a.frequency * this.sentimentToScore(a.sentiment)
        const scoreB = b.frequency * this.sentimentToScore(b.sentiment)
        return scoreB - scoreA
      })
      .slice(0, 5)
  }

  private identifyCompetitiveGaps(features: ExtractedFeature[]): FeatureInsights['competitiveGaps'] {
    const gaps: FeatureInsights['competitiveGaps'] = []
    
    features.forEach(feature => {
      if (feature.competitorComparison && feature.competitorComparison.betterOrWorse === 'worse') {
        gaps.push({
          feature: feature.name,
          competitors: [feature.competitorComparison.competitor],
          gapDescription: feature.competitorComparison.reason,
          impact: feature.businessImpact
        })
      }
    })
    
    return gaps
  }

  private identifyQuickWins(features: ExtractedFeature[]): ExtractedFeature[] {
    return features.filter(feature => 
      feature.sentiment === 'negative' && 
      feature.businessImpact === 'high' &&
      feature.technicalDetails?.implementationEffort === 'low'
    )
  }

  private identifyLongTermInvestments(features: ExtractedFeature[]): ExtractedFeature[] {
    return features.filter(feature => 
      feature.businessImpact === 'high' &&
      feature.technicalDetails?.implementationEffort === 'high'
    )
  }

  private createCategoryBreakdown(features: ExtractedFeature[]): Record<string, { count: number; sentiment: number }> {
    const breakdown: Record<string, { count: number; sentiment: number }> = {}
    
    features.forEach(feature => {
      if (!breakdown[feature.category]) {
        breakdown[feature.category] = { count: 0, sentiment: 0 }
      }
      
      breakdown[feature.category].count += feature.frequency
      breakdown[feature.category].sentiment += this.sentimentToScore(feature.sentiment) * feature.frequency
    })
    
    // Calculate average sentiment
    Object.keys(breakdown).forEach(category => {
      if (breakdown[category].count > 0) {
        breakdown[category].sentiment /= breakdown[category].count
      }
    })
    
    return breakdown
  }
}

export const featureExtractor = new FeatureExtractor() 