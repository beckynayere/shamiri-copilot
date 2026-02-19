import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, withAuth, Role } from '@/lib/auth'

// Type for supervisor with extended fields
interface SupervisorWithRole {
  id: string
  name: string
  email: string
  password: string | null
  role: string
  createdAt: Date
}

export async function GET() {
  // Check authentication
  const authError = await withAuth()
  if (authError) return authError

  const supervisors = await prisma.supervisor.findMany({ 
    orderBy: { name: 'asc' },
  }) as any
  
  // Remove password from response
  const safeSupervisors = supervisors.map(({ password, ...rest }: any) => rest)
  return NextResponse.json(safeSupervisors)
}

export async function POST(req: NextRequest) {
  // Allow signup without authentication
  try {
    const body = await req.json()
    const { name, email, password, role } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check if email already exists using raw query
    const existing = await prisma.$queryRaw`SELECT * FROM "Supervisor" WHERE email = ${email}` as any[]
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Insert supervisor using raw SQL
    const result = await prisma.$queryRaw`
      INSERT INTO "Supervisor" (id, name, email, password, role, "createdAt") 
      VALUES (${crypto.randomUUID()}, ${name}, ${email}, ${password || null}, ${role || 'SUPERVISOR'}, NOW())
      RETURNING id, name, email, role, "createdAt"
    ` as any[]

    const supervisor = result[0]
    return NextResponse.json(supervisor, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supervisor' }, { status: 500 })
  }
}
