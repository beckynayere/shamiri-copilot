import { PrismaClient, SessionStatus, RiskFlag } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a supervisor
  const supervisor = await prisma.supervisor.create({
    data: {
      name: 'Dr. Sarah Mitchell',
      email: 'sarah@shamiri.org',
    },
  })
  console.log('✓ Created supervisor:', supervisor.name)

  // Create fellows
  const fellows = await Promise.all([
    prisma.fellow.create({ data: { name: 'Alice Wanjiku' } }),
    prisma.fellow.create({ data: { name: 'Brian Otieno' } }),
    prisma.fellow.create({ data: { name: 'Catherine Akinyi' } }),
    prisma.fellow.create({ data: { name: 'David Mwangi' } }),
  ])
  console.log(`✓ Created ${fellows.length} fellows`)

  // Generate 12 sessions with realistic transcripts
  const sessionsData = generateSessionsData()

  for (const data of sessionsData) {
    const fellow = fellows[data.fellowIndex]
    
    const session = await prisma.session.create({
      data: {
        fellowId: fellow.id,
        supervisorId: supervisor.id,
        date: data.date,
        groupId: data.groupId,
        status: data.status as SessionStatus,
        transcript: data.transcript,
      },
    })

    // Create AI analysis for processed sessions
    if (data.status !== 'PENDING') {
      await prisma.aIAnalysis.create({
        data: {
          sessionId: session.id,
          summary: data.summary,
          contentScore: data.contentScore,
          facilitationScore: data.facilitationScore,
          protocolScore: data.protocolScore,
          justification: data.justification,
          riskFlag: data.riskFlag as RiskFlag,
          riskQuote: data.riskQuote,
        },
      })
    }
  }

  console.log('✅ Seeding complete!')
}

interface SessionData {
  fellowIndex: number
  date: Date
  groupId: string
  status: 'PENDING' | 'PROCESSED' | 'FLAGGED' | 'SAFE'
  transcript: string
  summary: string
  contentScore: number
  facilitationScore: number
  protocolScore: number
  justification: string
  riskFlag: 'SAFE' | 'RISK'
  riskQuote: string | null
}

function generateSessionsData(): SessionData[] {
  const groups = ['Group A', 'Group B', 'Group C', 'Group D']
  const now = new Date()

  return [
    {
      fellowIndex: 0,
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      groupId: groups[0],
      status: 'PROCESSED',
      transcript: `Fellow: Good morning, everyone! Welcome to today's Shamiri session. Today we're going to learn about something really important called Growth Mindset. Has anyone heard of that before?

Student 1: I think it means like, believing in yourself?

Fellow: That's a great start! Yes, growth mindset is the belief that our abilities and intelligence can be developed through dedication and hard work. It's like seeing your brain as a muscle - the more you exercise it, the stronger it gets.

Student 2: So we can actually get smarter?

Fellow: Absolutely! That's exactly right. Unlike the idea that intelligence is fixed, growth mindset teaches us that our brain is plastic - it can change and grow throughout our lives. Now, I want each of you to think about a time when you worked really hard at something and got better at it. Who wants to share?

Student 3: When I started playing football, I was really bad. But I practiced every day and now I'm on the school team!

Fellow: That's a perfect example! Thank you for sharing that. It took effort and practice, didn't it? That's exactly what growth mindset is about - believing that we can improve through effort.

Student 1: What about when we fail? That feels bad.

Fellow: Great question! Failure is actually a really important part of growth mindset. Thomas Edison, who invented the light bulb, failed over 1,000 times before succeeding. He said something like "I have not failed. I've just found 1,000 ways that won't work." Can anyone think of a time when failing taught them something important?

Student 2: When I failed my math test, I realized I needed to study differently and ask for help.

Fellow: That's wonderful! You turned a setback into a learning opportunity. That's exactly the growth mindset approach. Remember, it's not about being perfect - it's about learning and improving.

[Session continues with discussion about growth mindset examples and applications]`,
      summary: 'The Fellow introduced the concept of growth mindset, explaining it as the belief that abilities can be developed through effort. Students shared personal examples of growth and learning from failure, with the Fellow effectively facilitating discussion and validating contributions.',
      contentScore: 3,
      facilitationScore: 3,
      protocolScore: 3,
      justification: 'Content: Complete - Fellow explained clearly, gave examples (Thomas Edison, football), and asked for student thoughts. Facilitation: Excellent - Warm, encouraged quiet members, validated feelings. Protocol: Adherent - Stayed focused on curriculum.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 1,
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      groupId: groups[1],
      status: 'FLAGGED',
      transcript: `Fellow: Okay everyone, today's topic is growth mindset. Let me tell you about it.

Student 1: What's that?

Fellow: It's basically saying your brain can change. But honestly, I think some people are just naturally smarter than others. You know what I mean?

Student 2: Like my brother is really smart but he doesn't even study?

Fellow: Right, exactly. Some people have it and some don't. It's just how it is.

Student 3: But I thought we were supposed to learn about-

Fellow: [interrupting] Yeah yeah, anyway. So the thing is, some people are born with talent and some aren't. It's really sad but that's genetics.

[Awkward silence]

Student 1: My mom says I can be anything I want to be...

Fellow: That's nice but that's not really how the world works. Some things are just predetermined. You know what I mean?

Student 2: This is confusing.

Fellow: Look, here's the thing. Some of you will succeed and some won't. It's not really about trying hard. It's about what you're born with. Just do your best I guess.

[Session ends early with disengaged students]`,
      summary: 'The Fellow incorrectly taught that intelligence is fixed rather than growth-oriented. Students expressed confusion, and the Fellow interrupted a student and gave pessimistic messaging about success being predetermined.',
      contentScore: 1,
      facilitationScore: 1,
      protocolScore: 2,
      justification: 'Content: Missed - Fellow failed to mention Growth Mindset correctly, claiming intelligence is fixed. Facilitation: Poor - Interrupted student, confusing messaging, pessimistic. Protocol: Minor Drift - Some confusion but returned to topic.',
      riskFlag: 'RISK',
      riskQuote: "Some people have it and some don't. That's just how it is.",
    },
    {
      fellowIndex: 2,
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      groupId: groups[2],
      status: 'PROCESSED',
      transcript: `Fellow: Welcome everyone! Today we're going to discuss something called growth mindset. Has anyone heard the phrase "growth mindset" before?

[Silence]

Fellow: No worries, let me explain. Growth mindset means believing that you can develop your abilities through effort and learning. Like how exercising makes your muscles stronger, learning makes your brain stronger.

Student 1: So we can get smarter?

Fellow: Yes! Unlike the idea that intelligence is fixed, growth mindset says our potential is not set in stone. We can all improve. Let me ask you all: What's something you used to not be good at but now you are?

Student 2: Drawing! I used to be terrible at drawing but I practice every day and I'm actually good now.

Fellow: That's amazing! Thank you for sharing that. What did you do to improve?

Student 2: I watched tutorials and kept practicing even when it looked bad at first.

Fellow: Exactly! That's the growth mindset in action. We talked about failing earlier in the week. Can we apply that here?

Student 3: Yeah, even when my drawings looked bad, I didn't give up.

Fellow: Perfect! That's exactly what we want to remember. It's not about being perfect immediately - it's about the process of getting better.

[Session continues positively with more student engagement]`,
      summary: 'The Fellow successfully introduced growth mindset using clear explanations and relatable examples. Students actively participated and shared personal experiences, demonstrating good understanding of the concept.',
      contentScore: 3,
      facilitationScore: 2,
      protocolScore: 3,
      justification: 'Content: Complete - Explained clearly, used analogies, checked understanding. Facilitation: Adequate - Polite and on script but could engage more deeply. Protocol: Adherent - Stayed on topic throughout.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 3,
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      groupId: groups[3],
      status: 'PENDING',
      transcript: `Fellow: Good morning, group! Today we're going to talk about how our brains work and grow. Has anyone ever heard the phrase "growth mindset"?

Student 1: I think my teacher mentioned it once.

Fellow: Great! So here's what it means: Our brains are like muscles. When we exercise them - by learning new things, practicing, and working hard - they actually grow stronger and smarter.

Student 2: That's actually really cool.

Fellow: Isn't it? Now I want everyone to think about something important. There's something called "fixed mindset" which is the opposite. That's when people think "I'm just not good at math" or "I can't sing" and they give up. But we don't want that mindset, right?

Student 3: No, because then you won't try.

Fellow: Exactly right! If you think you can't improve, you won't try. But if you have growth mindset, you believe you can get better, so you keep trying. And that's how success happens!

Student 1: So like, even if I'm not good at something now...

Fellow: Yes! Even if you're not good at something NOW, that doesn't mean you can't be good at it in the FUTURE. That's the key message.

[Discussion continues about growth mindset applications...]`,
      summary: 'Pending analysis',
      contentScore: 0,
      facilitationScore: 0,
      protocolScore: 0,
      justification: '',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 0,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      groupId: groups[1],
      status: 'SAFE',
      transcript: `Fellow: Hello everyone! I'm excited to talk about today's topic: Growth Mindset. This is one of the most important concepts we'll learn this term.

Student 1: Is it about thinking positive?

Fellow: That's part of it, but it's more than that. Growth mindset is about believing that our abilities can develop through effort, good strategies, and help from others. It's the opposite of thinking "I'm just not smart enough" or "I'm bad at this and always will be."

Student 2: So it's like, even if something is hard now...

Fellow: Yes! Even if something is hard now, you can get better with practice and effort. Let me ask: Who here has gotten better at something over time?

[Several students raise hands]

Fellow: Wonderful! What did you get better at?

Student 3: I got better at basketball. I couldn't even make a basket when I started but now I can make most of my shots.

Fellow: That's fantastic! How did you get better?

Student 3: I practiced every day after school. Even when I missed shots, I kept trying.

Fellow: That's the perfect example of growth mindset! You put in effort and you improved. That's exactly what we're talking about today.

Student 2: What about when we fail? That feels really bad.

Fellow: Great question! Failure is actually a good thing when you have growth mindset. It means you're trying something challenging. The key is to learn from the failure. Like Thomas Edison - he failed over 1,000 times before inventing the light bulb! When asked about it, he said he didn't fail - he just found 1,000 ways that didn't work.

Student 1: That's a really good attitude.

Fellow: Yes! Let's all try to have that attitude when we face challenges. Does anyone want to share a time they learned something important from failing at something?

[Students share various experiences with failure leading to learning]`,
      summary: 'The Fellow excellently presented growth mindset using the brain-as-muscle analogy, included famous examples (Thomas Edison), and facilitated meaningful student participation. Students showed high engagement and understanding.',
      contentScore: 3,
      facilitationScore: 3,
      protocolScore: 3,
      justification: 'Content: Complete - Excellent explanation with analogies and examples. Facilitation: Excellent - High engagement, encouraged sharing, validated contributions. Protocol: Adherent - Fully focused on curriculum.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 1,
      date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      groupId: groups[2],
      status: 'PROCESSED',
      transcript: `Fellow: Okay, so today we're talking about growth mindset. It's about believing you can get smarter.

Student 1: Is that real? Can people actually get smarter?

Fellow: Yeah, kind of. Your brain can change a little bit. But honestly, most people are just born with their intelligence. Some people are smart and some aren't. That's pretty much how it works.

Student 2: Oh... that's kind of sad.

Fellow: Yeah well, that's life I guess. Not everyone can be smart. The important thing is to work with what you have.

[Awkward silence]

Student 3: My mom says I can be anything I want...

Fellow: [dismissively] That's nice. Anyway, the point is to try your best even if you're not that smart. You never know.

Student 1: Can you give us an example of growth mindset?

Fellow: Um, I guess when you practice something a lot? Like if you practice basketball you might get better at it. But you're not going to become Michael Jordan if you're not born with that talent.

Student 2: This is confusing.

Fellow: Look, the main thing is don't give up, I guess. Even if you're not smart. Try hard and maybe you'll improve a little.

[The rest of the session is disorganized and students lose interest]`,
      summary: 'The Fellow presented growth mindset incorrectly by emphasizing fixed intelligence. The session lacked structure, used dismissive language, and failed to engage students effectively.',
      contentScore: 1,
      facilitationScore: 1,
      protocolScore: 2,
      justification: 'Content: Missed - Explained as "brain can change a little" but emphasized fixed intelligence. Facilitation: Poor - Dismissive, confused students, lost engagement. Protocol: Minor Drift - Some mention of practice but overall off-topic.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 2,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      groupId: groups[0],
      status: 'PROCESSED',
      transcript: `Fellow: Good morning everyone! Today we're going to learn about an exciting topic: Growth Mindset. This is going to be really helpful for all of you in school and life.

Student 1: What does it mean?

Fellow: Great question! Growth mindset means believing that you can develop your abilities through hard work and good strategies. It's like saying "I can't do it YET" instead of "I can't do it EVER."

Student 2: Oh! So like, I can't speak English well yet, but I will?

Fellow: Exactly! That's perfect. You said "yet" - that's the growth mindset word! Now let's talk about why this is important.

Student 3: Because then you don't give up?

Fellow: Yes! When you have growth mindset, challenges don't scare you. You see them as opportunities to learn and grow. Can anyone think of a famous person who had to work really hard to succeed?

Student 1: Michael Jordan! He got cut from his high school basketball team but then became the best!

Fellow: Excellent example! What does that tell us?

Student 2: That even the best had to work hard and face failure.

Fellow: Absolutely! Michael Jordan wasn't born the greatest. He worked incredibly hard, practiced every day, and learned from his failures. That's growth mindset in action!

Student 3: What about failure? I'm scared of failing.

Fellow: I understand that feeling. But here's the thing - failure is not the opposite of success. It is part of success! Every time you fail and try again, you are learning. That is your brain growing stronger, just like muscles when you exercise.

Student 1: That sounds like a good way to think about it.

Fellow: Yes! Let us all try to have that attitude when we face challenges. Does anyone want to share a time they learned something important from failing at something?

[Session continues with more engagement and positive discussion]`,
      summary: 'The Fellow delivered an excellent session on growth mindset with clear definitions, relatable examples, and effective use of the "yet" framework. Students showed high engagement and understanding of key concepts.',
      contentScore: 3,
      facilitationScore: 3,
      protocolScore: 3,
      justification: 'Content: Complete - Clear explanations, excellent examples, checked understanding. Facilitation: Excellent - Engaging, positive, encouraged all students. Protocol: Adherent - Fully focused on curriculum.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 3,
      date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      groupId: groups[3],
      status: 'FLAGGED',
      transcript: `Fellow: Hey everyone. Today we are talking about growth mindset or something like that.

Student 1: What is it exactly?

Fellow: It is basically about your brain. So like, your brain can change or whatever. Scientists say neuroplasticity which means your brain can rewire itself.

Student 2: That sounds complicated.

Fellow: Yeah it is. So basically, when you learn new things, your brain forms new connections. It is pretty cool actually.

Student 3: So we can get smarter?

Fellow: In theory, yeah. The more you learn, the more your brain grows. It is like exercising a muscle.

Student 1: What about failing? I am really scared of failing.

Fellow: Oh, failing is terrible. You should avoid failing at all costs. If you fail, it means you are not good enough.

Student 2: But earlier you said our brain can change...

Fellow: Yeah but that does not mean you will not fail. You are still probably going to fail a lot. I think the main thing is to just not try things that are too hard. Stay in your comfort zone.

Student 3: But that does not sound right...

Fellow: Look, I am just being honest with you. Not everyone can succeed. Some people are just better than others. The best thing is to accept where you are and not push too hard.

[Students look uncomfortable and disengaged]`,
      summary: 'The Fellow gave incorrect and harmful advice about avoiding failure and staying in comfort zone. The session contained discouraging messaging that could negatively impact students.',
      contentScore: 1,
      facilitationScore: 1,
      protocolScore: 1,
      justification: 'Content: Missed - Explained concept but gave harmful advice about avoiding failure. Facilitation: Poor - Discouraging messaging, uncomfortable atmosphere. Protocol: Violation - Deviated significantly from curriculum with harmful advice.',
      riskFlag: 'RISK',
      riskQuote: 'You should avoid failing at all costs. If you fail, it means you are not good enough.',
    },
    {
      fellowIndex: 0,
      date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      groupId: groups[2],
      status: 'PROCESSED',
      transcript: `Fellow: Welcome back everyone! I hope you had a great week. Today we are going to discuss something that will help you in school, sports, and life: Growth Mindset.

Student 1: I have heard about this! It is about not giving up, right?

Fellow: Yes, that is part of it! Growth mindset is believing that your abilities can develop through effort and learning. It is knowing that success comes from hard work, not just natural talent.

Student 2: So if I work hard, I can be smart?

Fellow: Absolutely! Let me ask you this: Has anyone here improved at something they thought they were bad at?

Student 3: Me! I was really bad at reading out loud but now I am much better.

Fellow: That is wonderful! How did you improve?

Student 3: I practiced reading every night. Even when it was hard, I kept going.

Fellow: That is exactly what growth mindset is about! You recognized it was challenging, but you kept practicing anyway. That is how your brain gets stronger at reading - through effort!

Student 1: What about people who are naturally talented?

Fellow: Great question! Even talented people need to practice. No one becomes excellent without effort. Think about it - even Mozart, who was incredibly musical, practiced for years before becoming famous. Talent is just a starting point, but effort is what leads to mastery.

Student 2: So effort matters more than talent?

Fellow: Exactly! Research shows that effort and good strategies are more important than just being naturally smart. Now, let us talk about what happens when we face challenges...

[The session continues with positive engagement]`,
      summary: 'The Fellow successfully conveyed growth mindset concepts with clear explanations and relatable examples. Students participated actively and showed good understanding of the effort-talent relationship.',
      contentScore: 3,
      facilitationScore: 3,
      protocolScore: 3,
      justification: 'Content: Complete - Excellent explanations with examples and research. Facilitation: Excellent - Great questions, high engagement, validating. Protocol: Adherent - Fully focused on curriculum.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 1,
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      groupId: groups[0],
      status: 'SAFE',
      transcript: `Fellow: Hi everyone! Today we are going to talk about growth mindset. Before we start, I want each of you to think about something you are good at. Not something you were born good at, but something you worked hard to get good at.

Student 1: I am good at cooking! I learned from my grandmother.

Fellow: That is beautiful! Thank you for sharing. What did you learn from becoming good at cooking?

Student 1: That you have to practice a lot. And that it is okay if you mess up sometimes.

Fellow: Perfect! You just described growth mindset. You put in effort, you learned from mistakes, and now you are good at it. That is exactly what we are going to talk about today.

Student 2: Is that like having a growth mindset?

Fellow: Yes! Growth mindset is when you believe that you can get better at things through effort and learning. It is not about being born smart - it is about working hard and never giving up.

Student 3: What about when things are really hard and I want to give up?

Fellow: That is a really important question. When things get hard, that is actually when your brain is growing the most! Think about lifting weights - when it gets difficult, your muscles are getting stronger. It is the same with your brain.

Student 1: So difficulty is good?

Fellow: Yes! Difficulty means you are challenging yourself and learning. Let us all remember: "I cannot do it YET" instead of "I cannot do it." Can everyone say that with me?

Students: I cannot do it YET!

Fellow: Perfect! Now let us discuss some strategies for when things get hard...

[Session continues with practical strategies and positive engagement]`,
      summary: 'The Fellow excellently introduced growth mindset using a relatable cooking example and the "yet" framework. The session was engaging, practical, and students showed strong understanding.',
      contentScore: 3,
      facilitationScore: 3,
      protocolScore: 3,
      justification: 'Content: Complete - Excellent use of relatable examples, clear definitions. Facilitation: Excellent - Very engaging, great questions, inclusive. Protocol: Adherent - Fully focused on curriculum.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 2,
      date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      groupId: groups[1],
      status: 'PROCESSED',
      transcript: `Fellow: Good morning, team! Today we are going to explore something called Growth Mindset. This is how successful people think about challenges and failures.

Student 1: What is it?

Fellow: Growth mindset is the belief that your abilities can be developed through dedication and hard work. It is the understanding that your brain is malleable - it can change and grow throughout your entire life.

Student 2: So we can actually become smarter?

Fellow: Yes! Unlike the old belief that intelligence is fixed, modern science shows that our brains can form new connections and grow through learning. This is called neuroplasticity.

Student 3: That sounds scientific!

Fellow: It is! And here is why it matters: When you have a growth mindset, you embrace challenges instead of avoiding them. You see failures as learning opportunities instead of evidence of inadequacy.

Student 1: What about when I fail tests?

Fellow: Great question! With growth mindset, a failed test does not mean you are stupid. It means you have an opportunity to learn what you did not know, adjust your study strategies, and try again. Failure is feedback, not final judgment.

Student 2: That is actually really helpful.

Fellow: Yes! And remember, every expert was once a beginner. Everyone starts somewhere. The question is not "Am I good at this?" but rather "How can I get better at this?"

[Session continues with more discussion and student participation]`,
      summary: 'The Fellow presented growth mindset with scientific backing (neuroplasticity), addressing common concerns about failure. The session was informative and helped reframe student attitudes toward challenges.',
      contentScore: 3,
      facilitationScore: 2,
      protocolScore: 3,
      justification: 'Content: Complete - Scientific explanation with practical applications. Facilitation: Adequate - Informative but could engage more students. Protocol: Adherent - Focused on curriculum throughout.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
    {
      fellowIndex: 3,
      date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      groupId: groups[3],
      status: 'PROCESSED',
      transcript: `Fellow: Hello everyone! Today we are going to learn about something really powerful: Growth Mindset. This is how successful people handle challenges and setbacks.

Student 1: What is it?

Fellow: Growth mindset is the belief that your abilities can be developed through effort, strategies, and help from others. It is knowing that your brain can always learn and grow, no matter how old you are.

Student 2: That sounds interesting. How does it work?

Fellow: Great question! When you have a growth mindset, you see challenges as opportunities to grow, not threats to avoid. You also see effort as the path to mastery, not as something to be ashamed of. And you learn from criticism - instead of taking it personally, you use it to improve.

Student 3: What about when things get really hard?

Fellow: That is when growth mindset really helps! Instead of thinking "I am not smart enough to do this," you think "I need to try different strategies." You also celebrate the effort, not just the outcome. Remember, every expert was once a beginner.

Student 1: Can you give us an example?

Fellow: Of course! Think about learning to ride a bike. At first, you fall a lot. But with practice, you get better. Someone with a fixed mindset might say "I am not good at riding bikes" and give up. Someone with a growth mindset says "I am not good at riding bikes YET" and keeps practicing until they succeed!

[Students discuss their own experiences with learning new skills]`,
      summary: 'The Fellow clearly explained growth mindset principles with the bicycle example and framework of challenges, effort, and learning from criticism. Students engaged well and connected to personal experiences.',
      contentScore: 3,
      facilitationScore: 2,
      protocolScore: 3,
      justification: 'Content: Complete - Clear principles explained with good examples. Facilitation: Adequate - Good engagement but could be more interactive. Protocol: Adherent - Stayed on curriculum throughout.',
      riskFlag: 'SAFE',
      riskQuote: null,
    },
  ]
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
