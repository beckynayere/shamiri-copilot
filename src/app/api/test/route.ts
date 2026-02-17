import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const sessionCount = await prisma.session.count()
    
    return NextResponse.json({
      status: 'ok',
      message: 'API is working',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        googleKeySet: !!process.env.GOOGLE_API_KEY,
        googleKeyPrefix: process.env.GOOGLE_API_KEY ? 
          process.env.GOOGLE_API_KEY.substring(0, 15) + '...' : 'not set',
        databaseUrlSet: !!process.env.DATABASE_URL,
      },
      database: {
        sessionCount,
        connected: true
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}