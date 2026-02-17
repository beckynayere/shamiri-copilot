import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const fellows = await prisma.fellow.findMany({ 
    orderBy: { name: 'asc' } 
  })
  return NextResponse.json(fellows)
}

export async function POST(req: NextRequest) {
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
    console.error('Create fellow error:', error)
    return NextResponse.json({ error: 'Failed to create fellow' }, { status: 500 })
  }
}
