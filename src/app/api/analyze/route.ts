import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkRateLimit, getClientIP } from '@/lib/rateLimiter'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

// Helper function with retry logic for Gemini
async function callGeminiWithRetry(prompt: string, maxRetries = 3) {
  let lastError: any;
  
  const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (Google uses 429)
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
        // Calculate wait time with exponential backoff: 1s, 2s, 4s
        const waitTime = Math.pow(2, i) * 1000;
        console.log(`Rate limited. Retrying in ${waitTime/1000} seconds... (Attempt ${i + 1}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // Not a rate limit error, throw immediately
        throw error;
      }
    }
  }
  
  throw lastError;
}

export async function POST(req: NextRequest) {
  console.log('📝 Analyze API called')
  
  // Check if Google API key is configured
  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google API key not configured. Please set GOOGLE_API_KEY in .env file.' },
      { status: 500 }
    )
  }
  
  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    console.log(`⚠️ Rate limit exceeded for IP: ${clientIP}`)
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimit.retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter || 60),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetIn)
        }
      }
    );
  }
  
  console.log(`Rate limit: ${rateLimit.remaining}/${10} requests remaining`)
  
  try {
    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      )
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { aiAnalysis: true }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.aiAnalysis) {
      return NextResponse.json(
        { error: 'Analysis already exists for this session' },
        { status: 400 }
      )
    }

    // Build the prompt for analyzing the session using the grading rubric
    const prompt = `You are an expert clinical supervisor analyzing a supervision session transcript. 
Evaluate the session using the Shamiri Grading Rubric (1-3 scale):

CONTENT COVERAGE (Did the Fellow teach "Growth Mindset"?)
- Score 1: Missed - Didn't mention Growth Mindset
- Score 2: Partial - Mentioned but no check for understanding  
- Score 3: Complete - Explained, gave example, asked for thoughts

FACILITATION QUALITY (How empathetic and engaging?)
- Score 1: Poor - Monologue, interrupted, jargon
- Score 2: Adequate - Polite but transactional
- Score 3: Excellent - Warm, encouraged, validated

PROTOCOL SAFETY (Did they stay within boundaries?)
- Score 1: Violation - Gave unauthorized advice
- Score 2: Minor Drift - Got distracted but came back
- Score 3: Adherent - Stayed on curriculum

Analyze the transcript and provide JSON with:
- summary: 2-3 sentence summary
- contentScore: 1-3
- facilitationScore: 1-3
- protocolScore: 1-3
- justification: Brief explanation with rubric criteria used
- riskFlag: "SAFE" or "RISK" (flag if text contains self-harm, crisis, or severe boundary violations)
- riskQuote: If RISK, extract the concerning quote

Transcript:
${session.transcript}

Respond ONLY with valid JSON:
{
  "summary": "...",
  "contentScore": 3,
  "facilitationScore": 2,
  "protocolScore": 3,
  "justification": "...",
  "riskFlag": "SAFE",
  "riskQuote": null
}`

    console.log('Calling Google Gemini with retry logic...')
    
    // Use retry function instead of direct call
    const result = await callGeminiWithRetry(prompt);
    
    const content = result.response.text();
    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from Google Gemini' },
        { status: 500 }
      );
    }
    console.log('Google Gemini response received:', content)

    // Parse the JSON response - handle cases where model adds extra text
    let analysisData;
    try {
      // Try to extract JSON from the response (in case model adds markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        analysisData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', content);
      return NextResponse.json(
        { 
          error: 'Failed to parse analysis response',
          details: 'The AI response was not in valid JSON format',
          rawResponse: content.substring(0, 500) // Include part of response for debugging
        },
        { status: 500 }
      );
    }

    // Validate the response has required fields
    const requiredFields = ['summary', 'contentScore', 'facilitationScore', 'protocolScore', 'justification', 'riskFlag'];
    for (const field of requiredFields) {
      if (analysisData[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 500 }
        );
      }
    }

    // Validate riskFlag is valid
    if (!['SAFE', 'RISK'].includes(analysisData.riskFlag)) {
      analysisData.riskFlag = 'SAFE';
    }

    // Save analysis to database
    const analysis = await prisma.aIAnalysis.create({
      data: {
        sessionId: session.id,
        summary: analysisData.summary,
        contentScore: analysisData.contentScore,
        facilitationScore: analysisData.facilitationScore,
        protocolScore: analysisData.protocolScore,
        justification: analysisData.justification,
        riskFlag: analysisData.riskFlag,
        riskQuote: analysisData.riskQuote || null,
      },
    });

    console.log('✅ Analysis saved successfully:', analysis.id)
    return NextResponse.json(analysis)

  } catch (error: any) {
    console.error('❌ Analysis error:', error)
    
    // Check for rate limit error
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: 'Google API rate limit reached. Please try again in a few minutes.',
          retryAfter: 60
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
