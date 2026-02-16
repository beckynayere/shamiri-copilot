import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, validatedStatus, note } = await req.json()

    if (!sessionId || !validatedStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update AIAnalysis with supervisor's validation
    const analysis = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { aiAnalysis: true },
    })

    if (!analysis?.aiAnalysis) {
      return NextResponse.json({ error: 'No analysis found to validate' }, { status: 400 })
    }

    const validation = await prisma.aIAnalysis.update({
      where: { id: analysis.aiAnalysis.id },
      data: {
        validated: true,
        supervisorNote: note,
      },
    })

    // Update session status to reflect supervisor's decision
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: validatedStatus },
    })

    return NextResponse.json(validation)
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}