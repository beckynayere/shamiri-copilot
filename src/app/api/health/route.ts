import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    const sessionCount = await prisma.session.count()
    const fellowCount = await prisma.fellow.count()
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      stats: {
        sessions: sessionCount,
        fellows: fellowCount
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}