import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

export async function GET() {
  // Check authentication
  const authError = await withAuth()
  if (authError) return authError

  const fellows = await prisma.fellow.findMany({ 
    orderBy: { name: 'asc' } 
  })
  return NextResponse.json(fellows)
}

export async function POST(req: NextRequest) {
  // Only ADMIN can create fellows
  const authError = await withAuth("ADMIN")
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
