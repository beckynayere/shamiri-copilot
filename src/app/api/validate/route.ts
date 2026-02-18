import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/rateLimiter'
import { withAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Check authentication
  const authError = await withAuth()
  if (authError) return authError

  console.log('📝 Validate API called')
  
  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    console.log(`⚠️ Rate limit exceeded for IP: ${clientIP}`)
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimit.retryAfter,
        remaining: 0,
        resetIn: rateLimit.resetIn
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
    console.log('Request body:', body)
    
    const { sessionId, validatedStatus, note } = body

    if (!sessionId || !validatedStatus) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if session exists and has analysis
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { aiAnalysis: true }
    })

    console.log('Session found:', session ? 'yes' : 'no')

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.aiAnalysis) {
      return NextResponse.json(
        { error: 'No analysis found to validate. Run analysis first.' },
        { status: 400 }
      )
    }

    // Update the AIAnalysis record with validation
    const validated = validatedStatus === 'APPROVED'
    const validation = await prisma.aIAnalysis.update({
      where: { sessionId },
      data: {
        validated,
        supervisorNote: note || null,
      },
    })

    // Map validatedStatus to SessionStatus enum
    const statusMap: Record<string, 'SAFE' | 'PROCESSED' | 'FLAGGED'> = {
      'APPROVED': 'SAFE',
      'REJECTED': 'FLAGGED'
    };
    const newStatus = statusMap[validatedStatus] || 'PROCESSED';

    // Update session status
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: newStatus },
    })

    console.log('✅ Validation saved successfully')
    return NextResponse.json(validation)
    
  } catch (error) {
    console.error('❌ Validation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}