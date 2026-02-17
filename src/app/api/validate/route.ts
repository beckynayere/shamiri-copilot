import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  console.log('📝 Validate API called')
  
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

    // Update session status
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: validatedStatus },
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