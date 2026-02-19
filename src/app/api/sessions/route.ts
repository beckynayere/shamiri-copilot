import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/rateLimiter'
import { withAuth } from '@/lib/auth'

export async function GET() {
  // Check authentication
  const authError = await withAuth()
  if (authError) return authError

  // Get all fellows and supervisors for the form dropdowns
  const [fellows, supervisors] = await Promise.all([
    prisma.fellow.findMany({ orderBy: { name: 'asc' } }),
    prisma.supervisor.findMany({ orderBy: { name: 'asc' } }),
  ])

  // If no fellows/supervisors exist, create default ones
  if (fellows.length === 0) {
    await prisma.fellow.createMany({
      data: [
        { name: 'Alice Wanjiku' },
        { name: 'Brian Otieno' },
        { name: 'Catherine Akinyi' },
        { name: 'David Mwangi' },
      ]
    })
  }

  if (supervisors.length === 0) {
    await prisma.supervisor.createMany({
      data: [
        { name: 'Dr. Sarah Mitchell', email: 'sarah@shamiri.org' },
      ]
    })
  }

  // Re-fetch after creation
  const [fellowsUpdated, supervisorsUpdated] = await Promise.all([
    prisma.fellow.findMany({ orderBy: { name: 'asc' } }),
    prisma.supervisor.findMany({ orderBy: { name: 'asc' } }),
  ])

  return NextResponse.json({ fellows: fellowsUpdated, supervisors: supervisorsUpdated })
}

export async function POST(req: NextRequest) {
  // Check authentication
  const authError = await withAuth()
  if (authError) return authError
  
  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  try {
    const body = await req.json()
    const { fellowId, supervisorId, date, groupId, transcript } = body

    // Validate required fields
    if (!fellowId || !supervisorId || !date || !groupId || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields: fellowId, supervisorId, date, groupId, transcript', received: body },
        { status: 400 }
      )
    }

    // Verify fellow exists
    const fellow = await prisma.fellow.findUnique({ where: { id: fellowId } })
    if (!fellow) {
      return NextResponse.json({ error: 'Fellow not found', fellowId }, { status: 404 })
    }

    // Verify supervisor exists
    const supervisor = await prisma.supervisor.findUnique({ where: { id: supervisorId } })
    if (!supervisor) {
      return NextResponse.json({ error: 'Supervisor not found', supervisorId }, { status: 404 })
    }

    // Create the session (status defaults to PENDING from schema)
    const session = await prisma.session.create({
      data: {
        fellowId,
        supervisorId,
        date: new Date(date),
        groupId,
        transcript,
      },
      include: {
        fellow: true,
        supervisor: true,
      },
    })

    return NextResponse.json(session, { status: 201 })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
