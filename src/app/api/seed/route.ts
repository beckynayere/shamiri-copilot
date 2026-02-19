import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if data already exists
    const existingFellows = await prisma.fellow.count()
    const existingSupervisors = await prisma.supervisor.count()

    if (existingFellows > 0 && existingSupervisors > 0) {
      return NextResponse.json({
        message: 'Database already seeded',
        fellows: existingFellows,
        supervisors: existingSupervisors
      })
    }

    // Create default fellows
    const fellows = await prisma.fellow.createMany({
      data: [
        { name: 'Alice Wanjiku' },
        { name: 'Brian Otieno' },
        { name: 'Catherine Akinyi' },
        { name: 'David Mwangi' },
        { name: 'Esther Njoroge' },
      ],
      skipDuplicates: true,
    })

    // Create default supervisor using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "Supervisor" (id, name, email, role, "createdAt") 
      VALUES (${crypto.randomUUID()}, 'Dr. Sarah Mitchell', 'sarah@shamiri.org', 'SUPERVISOR', NOW())
      ON CONFLICT (email) DO NOTHING
    `

    return NextResponse.json({
      message: 'Database seeded successfully',
      fellowsCreated: fellows.count,
      supervisorsCreated: 1,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
