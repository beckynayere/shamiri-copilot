import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

// Extended user type with role
interface ExtendedUser {
  id: string
  name: string | null
  email: string | null
  role: string
}

// Supervisor type from Prisma (with new fields)
interface SupervisorWithRole {
  id: string
  name: string
  email: string
  password: string | null
  role: string
  createdAt: Date
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // Find supervisor by email using raw SQL
        const supervisors = await prisma.$queryRaw`
          SELECT * FROM "Supervisor" WHERE email = ${credentials.email as string}
        ` as any[]

        const supervisor = supervisors[0]

        if (!supervisor) {
          return null
        }

        // If password is provided and stored in DB, verify it
        if (credentials.password && supervisor.password) {
          const isValidPassword = credentials.password === supervisor.password
          if (!isValidPassword) {
            return null
          }
        }

        return {
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email,
          role: supervisor.role || 'SUPERVISOR',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        token.id = u.id || ''
        token.role = u.role || 'SUPERVISOR'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
