# Shamiri Supervisor Copilot

A web-based dashboard where Supervisors can review therapy sessions conducted by Fellows, with AI-generated analysis to help identify risks and ensure protocol adherence.

## Project Overview

This is a **Senior Software Engineer Take-Home Assignment** for Shamiri Institute. The application amplifies a Supervisor's capacity to review sessions using Generative AI.

### Core Features

1. **Dashboard** - View list of therapy sessions with metadata (Fellow Name, Date, Group ID, Status)
2. **AI Analysis Engine** - LLM-generated session insights with:
   - Session Summary (3 sentences)
   - Quantitative scores with justifications (Content Coverage, Facilitation Quality, Protocol Safety)
   - Risk Detection (SAFE/RISK flag with quote extraction)
3. **Human-in-the-Loop** - Supervisors can Validate or Reject AI findings

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4o-mini
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- OpenAI API Key

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd shamiri-supervisor

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/shamiri_db"

# OpenAI API Key
OPENAI_API_KEY="your-openai-api-key"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with mock data
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

## Project Structure

```
shamiri-supervisor/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Mock data seeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/   # AI Analysis endpoint
│   │   │   └── validate/ # Validation endpoint
│   │   ├── sessions/
│   │   │   └── [id]/     # Session detail page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx      # Dashboard (home)
│   ├── components/
│   │   ├── SessionDetail.tsx
│   │   └── SessionList.tsx
│   └── lib/
│       └── prisma.ts     # Prisma client singleton
├── .env                  # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## AI Engineering

### Prompt Engineering

The AI analysis uses a structured prompt that evaluates sessions against the **3-Point Quality Index**:

1. **Content Coverage** (1-3): Did the Fellow teach "Growth Mindset"?
2. **Facilitation Quality** (1-3): How empathetic and engaging was the Fellow?
3. **Protocol Safety** (1-3): Did they stay within boundaries?

### Structured Output

We use:
- **JSON Schema Enforcement** via OpenAI's `response_format: { type: 'json_object' }`
- **Zod validation** (in analyze route) for defense in depth
- **Error handling** with try/catch and user-friendly error messages

## Database Schema

### Models

- **Supervisor**: The user (Supervisor)
- **Fellow**: The session facilitator (18-22 year old lay provider)
- **Session**: A therapy session with transcript
- **AIAnalysis**: AI-generated insights (linked to Session)

### Session Status

- `PENDING` - Session not yet analyzed
- `PROCESSED` - AI analysis complete
- `FLAGGED` - Risk detected
- `SAFE` - Supervisor validated as safe

## API Endpoints

### POST /api/analyze

Analyzes a session transcript using OpenAI.

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-uuid"}'
```

### POST /api/validate

Allows supervisor to validate or flag AI analysis.

```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-uuid", "validatedStatus": "SAFE", "note": "Looks good"}'
```

## Development Guidelines

### Code Quality

- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for formatting

### Adding New Features

1. Create a new branch
2. Implement the feature
3. Run `npm run build` to verify
4. Test locally

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables (Production)

Set these in Vercel dashboard:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key

## AI vs Hand-Coded

### AI-Generated (Cursor/Copilot)
- Initial Next.js project scaffolding
- Basic component templates
- Prisma schema structure

### Hand-Coded
- AI prompt engineering in `src/app/api/analyze/route.ts`
- Structured output parsing and validation
- Tailwind styling for professional UI
- Session grading rubric implementation
- Database seed data with realistic transcripts

### Verification
- All TypeScript compiles with no errors (`npx tsc --noEmit`)
- Build passes (`npm run build`)
- Manual testing of analyze and validate endpoints

## Grading Rubric Reference

| Metric | Score | Criteria |
|--------|-------|----------|
| Content Coverage | 1 | Missed - Didn't mention Growth Mindset |
| Content Coverage | 2 | Partial - Mentioned but no check for understanding |
| Content Coverage | 3 | Complete - Explained, gave example, asked for thoughts |
| Facilitation Quality | 1 | Poor - Monologue, interrupted, jargon |
| Facilitation Quality | 2 | Adequate - Polite but transactional |
| Facilitation Quality | 3 | Excellent - Warm, encouraged, validated |
| Protocol Safety | 1 | Violation - Gave unauthorized advice |
| Protocol Safety | 2 | Minor Drift - Got distracted but came back |
| Protocol Safety | 3 | Adherent - Stayed on curriculum |

## License

MIT
