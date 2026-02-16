import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Define the expected schema using Zod
const AnalysisSchema = z.object({
  summary: z.string().min(10),
  contentScore: z.number().int().min(1).max(3),
  contentJustification: z.string(),
  facilitationScore: z.number().int().min(1).max(3),
  facilitationJustification: z.string(),
  safetyScore: z.number().int().min(1).max(3),
  safetyJustification: z.string(),
  riskFlag: z.enum(['SAFE', 'RISK']),
  riskQuote: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { aiAnalysis: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.aiAnalysis) {
      return NextResponse.json({ error: 'Analysis already exists' }, { status: 400 })
    }

    // Build the prompt with rubric instructions
    const prompt = `
You are an expert supervisor at Shamiri, analyzing a therapy session transcript.
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
  "contentScore": number,
  "contentJustification": "string",
  "facilitationScore": number,
  "facilitationJustification": "string",
  "safetyScore": number,
  "safetyJustification": "string",
  "riskFlag": "SAFE" | "RISK",
  "riskQuote": "string if riskFlag is RISK, otherwise omit"
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or gpt-4 if you have access
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('Empty response from OpenAI')

    // Parse and validate with Zod
    const parsed = AnalysisSchema.parse(JSON.parse(content))

    // Save to database
    const analysis = await prisma.aIAnalysis.create({
      data: {
        sessionId: session.id,
        summary: parsed.summary,
        contentScore: parsed.contentScore,
        facilitationScore: parsed.facilitationScore,
        protocolScore: parsed.safetyScore,
        justification: `${parsed.contentJustification} | ${parsed.facilitationJustification} | ${parsed.safetyJustification}`,
        riskFlag: parsed.riskFlag,
        riskQuote: parsed.riskQuote,
      },
    })

    // Update session status to PROCESSED (or FLAGGED if risk)
    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: parsed.riskFlag === 'RISK' ? 'FLAGGED' : 'PROCESSED',
      },
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