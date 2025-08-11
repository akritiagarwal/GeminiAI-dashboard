import { createClient } from '../supabase/server'

export interface DemoFeedback {
  id: string
  content: string
  platform: 'reddit' | 'hackernews' | 'stackoverflow'
  author: string
  timestamp: string
  sentiment: number
  url?: string
  title?: string
}

export class DemoGenerator {
  private supabase = createClient()

  private generateRealisticFeedback(): DemoFeedback[] {
    return [
      {
        id: '1',
        content: "Just migrated our entire codebase from OpenAI to Gemini. The context window is a game-changer for our use case. Processing 30% faster too.",
        platform: 'reddit',
        author: 'dev_alex',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        sentiment: 0.9,
        url: 'https://reddit.com/r/MachineLearning/comments/example1'
      },
      {
        id: '2',
        content: "Gemini's function calling actually works reliably unlike GPT-4 which fails 20% of the time on complex schemas",
        platform: 'hackernews',
        author: 'ml_engineer',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        sentiment: 0.7,
        url: 'https://news.ycombinator.com/item?id=example2'
      },
      {
        id: '3',
        content: "Why doesn't Gemini support streaming responses yet? This is table stakes for production apps",
        platform: 'stackoverflow',
        author: 'backend_dev',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        sentiment: -0.6,
        url: 'https://stackoverflow.com/questions/example3'
      },
      {
        id: '4',
        content: "The multimodal capabilities are incredible. We're processing images and text together seamlessly",
        platform: 'reddit',
        author: 'ai_researcher',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        sentiment: 0.8,
        url: 'https://reddit.com/r/ArtificialIntelligence/comments/example4'
      },
      {
        id: '5',
        content: "Documentation could be better, but the API itself is solid. Much more stable than alternatives",
        platform: 'hackernews',
        author: 'startup_cto',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        sentiment: 0.4,
        url: 'https://news.ycombinator.com/item?id=example5'
      },
      {
        id: '6',
        content: "Switched from Claude to Gemini for our chatbot. The response quality is noticeably better",
        platform: 'reddit',
        author: 'chatbot_dev',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        sentiment: 0.8,
        url: 'https://reddit.com/r/LocalLLaMA/comments/example6'
      },
      {
        id: '7',
        content: "Gemini's pricing is much more competitive than OpenAI. We're saving 40% on our AI costs",
        platform: 'stackoverflow',
        author: 'cost_optimizer',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        sentiment: 0.9,
        url: 'https://stackoverflow.com/questions/example7'
      },
      {
        id: '8',
        content: "The new Gemini Pro model is significantly better at code generation. Much more consistent than before",
        platform: 'reddit',
        author: 'code_reviewer',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        sentiment: 0.8,
        url: 'https://reddit.com/r/learnmachinelearning/comments/example8'
      }
    ]
  }

  private generateSentimentAnalysis(feedback: DemoFeedback) {
    return {
      id: `sentiment_${feedback.id}`,
      feedback_id: feedback.id,
      technical_sentiment: feedback.sentiment,
      business_sentiment: feedback.sentiment + (Math.random() - 0.5) * 0.2,
      emotional_tone: this.getEmotionalTone(feedback.sentiment),
      developer_intent: this.getDeveloperIntent(feedback.content),
      confidence_score: 0.85 + Math.random() * 0.1,
      created_at: feedback.timestamp
    }
  }

  private getEmotionalTone(sentiment: number): string {
    if (sentiment > 0.7) return 'excited'
    if (sentiment > 0.3) return 'satisfied'
    if (sentiment > -0.3) return 'neutral'
    if (sentiment > -0.7) return 'frustrated'
    return 'angry'
  }

  private getDeveloperIntent(content: string): string {
    if (content.includes('migrated') || content.includes('switched')) return 'adoption_success'
    if (content.includes('why') || content.includes('doesn\'t')) return 'seeking_help'
    if (content.includes('better') || content.includes('improved')) return 'positive_feedback'
    if (content.includes('cost') || content.includes('pricing')) return 'business_concern'
    return 'general_discussion'
  }

  async seedDemoData(scenario?: string) {
    try {
      const supabase = await this.supabase
      
      // Clear existing demo data
      await supabase
        .from('developer_feedback')
        .delete()
        .eq('is_demo', true)

      const feedback = this.generateRealisticFeedback()
      
      // Insert feedback
      const { data: insertedFeedback, error: feedbackError } = await supabase
        .from('developer_feedback')
        .insert(feedback.map(f => ({
          ...f,
          is_demo: true,
          created_at: f.timestamp
        })))
        .select()

      if (feedbackError) {
        console.error('Error inserting feedback:', feedbackError)
        return { success: false, error: feedbackError }
      }

      // Generate sentiment analysis
      const sentimentData = feedback.map(f => this.generateSentimentAnalysis(f))
      
      const { error: sentimentError } = await supabase
        .from('sentiment_analysis')
        .insert(sentimentData)

      if (sentimentError) {
        console.error('Error inserting sentiment:', sentimentError)
        return { success: false, error: sentimentError }
      }

      return { 
        success: true, 
        feedbackCount: feedback.length,
        message: `Successfully seeded ${feedback.length} demo feedback items`
      }
    } catch (error) {
      console.error('Error seeding demo data:', error)
      return { success: false, error }
    }
  }

  async generateScenario(scenario: string) {
    const scenarios = {
      positive_momentum: this.generatePositiveMomentum(),
      feature_request: this.generateFeatureRequest(),
      competitive_win: this.generateCompetitiveWin(),
      urgent_issue: this.generateUrgentIssue()
    }

    return scenarios[scenario as keyof typeof scenarios] || scenarios.positive_momentum
  }

  private generatePositiveMomentum(): DemoFeedback[] {
    return [
      {
        id: 'pos_1',
        content: "Gemini's new model is absolutely incredible! We've seen 50% improvement in accuracy",
        platform: 'reddit',
        author: 'ai_enthusiast',
        timestamp: new Date().toISOString(),
        sentiment: 0.95
      },
      {
        id: 'pos_2',
        content: "Just deployed Gemini in production. Zero issues, amazing performance",
        platform: 'hackernews',
        author: 'senior_dev',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        sentiment: 0.9
      }
    ]
  }

  private generateFeatureRequest(): DemoFeedback[] {
    return [
      {
        id: 'feat_1',
        content: "Would love to see streaming responses in Gemini API. This is the only missing feature",
        platform: 'stackoverflow',
        author: 'streaming_dev',
        timestamp: new Date().toISOString(),
        sentiment: 0.3
      },
      {
        id: 'feat_2',
        content: "Gemini needs better documentation for function calling. The examples are unclear",
        platform: 'reddit',
        author: 'doc_seeker',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        sentiment: 0.2
      }
    ]
  }

  private generateCompetitiveWin(): DemoFeedback[] {
    return [
      {
        id: 'comp_1',
        content: "Switched from OpenAI to Gemini and never looking back. Much better value",
        platform: 'reddit',
        author: 'switcher',
        timestamp: new Date().toISOString(),
        sentiment: 0.8
      },
      {
        id: 'comp_2',
        content: "Gemini beats Claude hands down for our use case. Faster and more accurate",
        platform: 'hackernews',
        author: 'comparison_dev',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        sentiment: 0.7
      }
    ]
  }

  private generateUrgentIssue(): DemoFeedback[] {
    return [
      {
        id: 'urgent_1',
        content: "Critical bug: Gemini API returning 500 errors for all requests. Need immediate fix",
        platform: 'stackoverflow',
        author: 'urgent_dev',
        timestamp: new Date().toISOString(),
        sentiment: -0.9
      },
      {
        id: 'urgent_2',
        content: "Production down due to Gemini API issues. This is costing us thousands",
        platform: 'reddit',
        author: 'production_dev',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        sentiment: -0.8
      }
    ]
  }
}

export const demoGenerator = new DemoGenerator() 