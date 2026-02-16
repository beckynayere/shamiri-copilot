import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker' // we'll install this

const prisma = new PrismaClient()

async function main() {
  // Create a supervisor
  const supervisor = await prisma.supervisor.create({
    data: {
      name: 'Dr. Sarah Mitchell',
      email: 'sarah@shamiri.org',
    },
  })

  // Create a few fellows
  const fellow1 = await prisma.fellow.create({
    data: {
      name: 'Alice Wanjiku',
    },
  })
  const fellow2 = await prisma.fellow.create({
    data: {
      name: 'Brian Otieno',
    },
  })

  // Generate 10+ sessions with mock transcripts
  // We'll create some safe, some flagged for demonstration
  const statuses = ['PROCESSED', 'FLAGGED', 'SAFE'] as const
  const riskFlags = ['SAFE', 'RISK'] as const

  for (let i = 0; i < 12; i++) {
    const fellow = i % 2 === 0 ? fellow1 : fellow2
    const date = faker.date.recent({ days: 30 })
    const groupId = `Group ${String.fromCharCode(65 + (i % 4))}` // A, B, C, D
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const transcript = generateMockTranscript(i)

    const session = await prisma.session.create({
      data: {
        fellowId: fellow.id,
        supervisorId: supervisor.id,
        date,
        groupId,
        status,
        transcript,
      },
    })

    // For sessions that are processed, flagged, or safe, create an AI analysis
    if (status === 'PROCESSED' || status === 'FLAGGED' || status === 'SAFE') {
      const riskFlag = riskFlags[Math.floor(Math.random() * riskFlags.length)]
      const contentScore = Math.floor(Math.random() * 3) + 1
      const facilitationScore = Math.floor(Math.random() * 3) + 1
      const protocolScore = Math.floor(Math.random() * 3) + 1

      await prisma.aIAnalysis.create({
        data: {
          sessionId: session.id,
          summary: faker.lorem.sentences(3),
          contentScore,
          facilitationScore,
          protocolScore,
          justification: faker.lorem.sentences(2),
          riskFlag,
          riskQuote: riskFlag === 'RISK' ? faker.lorem.sentence() : null,
        },
      })
    }
  }
}

function generateMockTranscript(index: number): string {
  // For a realistic feel, you can embed specific phrases that match the rubric.
  // Here we return a few paragraphs. In a real scenario you might generate longer text.
  const transcripts = [
    `Fellow: Today we're going to talk about growth mindset. Has anyone heard of it?
Student: Is it like believing you can get smarter?
Fellow: Exactly! It's the idea that our brain is like a muscle – it grows with exercise. What do you think?`,
    `Fellow: So, growth mindset means that intelligence is fixed. You either have it or you don't.
Student: Wait, I thought we could improve?
Fellow: No, it's genetic.`,
    `Fellow: Let's talk about failure. Thomas Edison failed many times before inventing the light bulb. That's growth mindset – learning from mistakes.
Student: So it's okay to fail?
Fellow: Absolutely! Now, let's each share a time we failed and what we learned.`,
    // ... add more variations to cover the rubric
  ]
  return transcripts[index % transcripts.length]
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })