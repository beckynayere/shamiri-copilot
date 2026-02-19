import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

export async function GET() {
  // Allow authenticated users to get fellows list
  const authError = await withAuth()
  if (authError) return authError

  const fellows = await prisma.fellow.findMany({ 
    orderBy: { name: 'asc' } 
  })
  return NextResponse.json(fellows)
}

export async function POST(req: NextRequest) {
  // Allow authenticated supervisors to create fellows
  const authError = await withAuth("SUPERVISOR")
  if (authError) return authError

  try {
    const body = await req.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const fellow = await prisma.fellow.create({
      data: { name }
    })

    return NextResponse.json(fellow, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fellow' }, { status: 500 })
  }
}
