import { createClient } from '../supabase/server'

export class SentimentGenerator {
  async generateSentimentForFeedback() {
    const supabase = await createClient()
    
    // Get feedback without sentiment analysis
    const { data: feedback, error } = await supabase
      .from('developer_feedback')
      .select('*')
      .not('id', 'in', `(select feedback_id from sentiment_analysis)`)
      .limit(20)

    if (error) {
      console.error('Error fetching feedback for sentiment analysis:', error)
      return
    }

    console.log(`Generating sentiment for ${feedback?.length || 0} feedback items`)

    for (const item of feedback || []) {
      const sentiment = this.analyzeSentiment(item.content, item.metadata?.title || '')
      
      try {
        const { error: insertError } = await supabase
          .from('sentiment_analysis')
          .insert({
            feedback_id: item.id,
            sentiment_score: sentiment.score,
            sentiment_label: sentiment.label,
            confidence: sentiment.confidence,
            processing_model: 'rule-based-analyzer',
            analyzed_at: new Date().toISOString()
          })

        if (insertError) {
          console.error(`Error inserting sentiment for ${item.id}:`, insertError)
        } else {
          console.log(`Generated sentiment for feedback ${item.id}: ${sentiment.label}`)
        }
      } catch (error) {
        console.error(`Exception generating sentiment for ${item.id}:`, error)
      }
    }
  }

  private analyzeSentiment(content: string, title: string): { score: number; label: string; confidence: number } {
    const text = (content + ' ' + title).toLowerCase()
    
    // Positive keywords
    const positiveWords = [
      'great', 'excellent', 'amazing', 'awesome', 'good', 'improved', 'better', 'fast', 'efficient',
      'reliable', 'stable', 'working', 'success', 'love', 'perfect', 'outstanding', 'fantastic'
    ]
    
    // Negative keywords
    const negativeWords = [
      'error', 'bug', 'crash', 'fail', 'broken', 'slow', 'problem', 'issue', 'bad', 'terrible',
      'awful', 'horrible', 'doesn\'t work', 'not working', 'broken', 'frustrated', 'annoying'
    ]
    
    // Count positive and negative words
    let positiveCount = 0
    let negativeCount = 0
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      const matches = text.match(regex)
      if (matches) positiveCount += matches.length
    })
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      const matches = text.match(regex)
      if (matches) negativeCount += matches.length
    })
    
    // Calculate sentiment score
    const total = positiveCount + negativeCount
    let score = 0.5 // neutral default
    
    if (total > 0) {
      score = positiveCount / total
    }
    
    // Determine label
    let label = 'neutral'
    if (score > 0.6) label = 'positive'
    else if (score < 0.4) label = 'negative'
    
    // Calculate confidence based on word count
    const confidence = Math.min(0.9, Math.max(0.5, total / 10))
    
    return { score, label, confidence }
  }
} 