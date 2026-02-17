import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supervisors = await prisma.supervisor.findMany({ 
    orderBy: { name: 'asc' } 
  })
  return NextResponse.json(supervisors)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const supervisor = await prisma.supervisor.create({
      data: { name, email }
    })

    return NextResponse.json(supervisor, { status: 201 })
  } catch (error) {
    console.error('Create supervisor error:', error)
    return NextResponse.json({ error: 'Failed to create supervisor' }, { status: 500 })
  }
}
