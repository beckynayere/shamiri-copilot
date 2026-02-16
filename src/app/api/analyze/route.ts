import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { fellow: true }
    })
    
    if (!session) {
      return new Response('Session not found', { status: 404 })
    }
    
    // Use OpenAI to analyze the transcript
    const openai = new (await import('openai')).default({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    const prompt = `You are an expert supervisor at Shamiri, analyzing a therapy session transcript.
Evaluate the session according to the following rubric.

Rubric:
1. Content Coverage (score 1-3):
   1: Missed – Fellow failed to mention "Growth Mindset" or defined it incorrectly.
   2: Partial – Mentioned concept but moved on quickly without checking understanding.
   3: Complete – Explained clearly, gave an example, and asked for thoughts.

2. Facilitation Quality (score 1-3):
   1: Poor – Monologue, interrupted, used confusing jargon.
   2: Adequate – Polite but transactional, stuck to script.
   3: Excellent – Warm, encouraged quiet members, validated feelings.

3. Protocol Safety (score 1-3):
   1: Violation – Gave unauthorized advice (medical/relationship) or strayed off topic.
   2: Minor Drift – Got distracted but brought it back.
   3: Adherent – Stayed focused on curriculum, handled distractions gracefully.

Risk Detection: If the transcript contains any indication of self-harm, severe crisis, or harm to others, set riskFlag to "RISK" and extract the exact quote. Otherwise set to "SAFE".

Transcript:
"""
${session.transcript}
"""

Return a JSON object with the following structure:
{
  "summary": "3-sentence summary",
  "metrics": {
    "contentCoverage": { "score": number },
    "facilitationQuality": { "score": number },
    "protocolSafety": { "score": number }
  },
  "riskDetection": {
    "status": "SAFE" | "RISK",
    "quote": "string if status is RISK, otherwise null"
  }
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }
    
    const analysis = JSON.parse(content)
    
    // Save analysis to database using AIAnalysis model
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        aiAnalysis: {
          create: {
            summary: analysis.summary,
            contentScore: analysis.metrics.contentCoverage.score,
            facilitationScore: analysis.metrics.facilitationQuality.score,
            protocolScore: analysis.metrics.protocolSafety.score,
            justification: `Content: ${analysis.metrics.contentCoverage.score}/3, Facilitation: ${analysis.metrics.facilitationQuality.score}/3, Protocol: ${analysis.metrics.protocolSafety.score}/3`,
            riskFlag: analysis.riskDetection.status,
            riskQuote: analysis.riskDetection.quote,
          }
        },
        status: analysis.riskDetection.status === 'RISK' ? 'FLAGGED' : 'PROCESSED'
      }
    })
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze session' },
      { status: 500 }
    )
  }
}
