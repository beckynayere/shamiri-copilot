import { auth as nextAuth } from "@/auth"
import { NextResponse } from "next/server"

// Re-export auth from next-auth
export const auth = nextAuth

// Role types
export type Role = "ADMIN" | "SUPERVISOR"

// Role hierarchy - higher number = more permissions
const roleHierarchy: Record<Role, number> = {
  ADMIN: 2,
  SUPERVISOR: 1,
}

/**
 * Check if the current user is authenticated
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session) {
    return { authenticated: false, user: null }
  }
  
  return { authenticated: true, user: session.user }
}

/**
 * Check if the current user has a specific role
 */
export async function requireRole(requiredRole: Role) {
  const { authenticated, user } = await requireAuth()
  
  if (!authenticated || !user) {
    return { authorized: false, user: null }
  }
  
  const userRole = user.role as Role
  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  if (userLevel < requiredLevel) {
    return { authorized: false, user }
  }
  
  return { authorized: true, user }
}

/**
 * Check if the current user has at least one of the specified roles
 */
export async function requireAnyRole(roles: Role[]) {
  const { authenticated, user } = await requireAuth()
  
  if (!authenticated || !user) {
    return { authorized: false, user: null }
  }
  
  const userRole = user.role as Role
  
  for (const role of roles) {
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[role] || 0
    
    if (userLevel >= requiredLevel) {
      return { authorized: true, user }
    }
  }
  
  return { authorized: false, user }
}

/**
 * Middleware-like function to protect API routes
 * Returns the user if authorized, otherwise returns an error response
 */
export async function withAuth(requiredRole?: Role) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
  
  if (requiredRole) {
    const userRole = session.user.role as Role
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    
    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      )
    }
  }
  
  return null // Authorization passed
}

/**
 * Helper to check if user is an admin
 */
export async function isAdmin() {
  const { authorized } = await requireRole("ADMIN")
  return authorized
}

/**
 * Helper to check if user is an admin or supervisor
 */
export async function isAdminOrSupervisor() {
  const { authorized } = await requireAnyRole(["ADMIN", "SUPERVISOR"])
  return authorized
}
