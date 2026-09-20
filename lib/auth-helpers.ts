import { getSession } from './session';
import { prisma } from './prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

/**
 * Ensures the user is authenticated.
 * Returns the session if authenticated, otherwise throws an Error.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Ensures the user has one of the allowed roles.
 * Returns the session if authorized, otherwise throws an Error.
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role as Role)) {
    throw new Error('Forbidden: Insufficient role');
  }
  return session;
}

/**
 * Ensures the user has a specific permission enabled.
 * Admins and Super Admins bypass this check.
 * Returns the session if authorized, otherwise throws an Error.
 */
export async function requirePermission(permissionKey: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  // ADMIN and SUPER_ADMIN bypass granular permission checks
  if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN') {
    return session;
  }

  // Fetch all permissions for this user to support legacy names and case-insensitivity
  const permissions = await prisma.userPermission.findMany({
    where: { userId: session.userId, enabled: true }
  });

  const activeKeys = permissions.map(p => p.permissionKey);
  
  // Support legacy names temporarily
  const legacyMap: { [key: string]: string[] } = {
    'blogWrite': ['blogWrite', 'BLOG_WRITE', 'blog_write', 'blogWriter', 'canWriteBlog'],
    'blogPublish': ['blogPublish', 'BLOG_PUBLISH', 'blog_publish', 'blogPublisher'],
    'aiTestAccess': ['aiTestAccess', 'AI_TEST_ACCESS'],
    'aiTrainingAccess': ['aiTrainingAccess', 'AI_TRAINING_ACCESS'],
    'aiQuestionManage': ['aiQuestionManage', 'AI_QUESTION_MANAGE'],
    'newsWrite': ['newsWrite', 'NEWS_WRITE'],
    'newsPublish': ['newsPublish', 'NEWS_PUBLISH'],
    'supportTicketHandle': ['supportTicketHandle', 'SUPPORT_TICKET_HANDLE'],
    'contentManage': ['contentManage', 'CONTENT_MANAGE'],
    'viewAuditLimited': ['viewAuditLimited', 'VIEW_AUDIT_LIMITED']
  };

  const allowedKeys = legacyMap[permissionKey] || [permissionKey];
  const hasPermission = activeKeys.some(key => allowedKeys.includes(key));

  // DEBUG LOG
  console.log(`[PERM DEBUG] User: ${session.email} | Checking: ${permissionKey} | Allowed: [${allowedKeys}] | Active: [${activeKeys}] | Result: ${hasPermission}`);

  if (!hasPermission) {
    throw new Error(`Forbidden: Missing required permission [${permissionKey}]`);
  }

  return session;
}

/**
 * Checks if an administrator can manage a target user.
 * Implements hierarchy protection (e.g., Admins cannot delete Super Admins).
 */
export async function canManageTargetUser(adminId: string, adminRole: Role, targetUserId: string) {
  if (adminId === targetUserId) {
    throw new Error('Forbidden: You cannot perform management actions on your own account.');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true }
  });

  if (!targetUser) {
    throw new Error('Target user not found');
  }

  // Super Admin protection
  if (targetUser.role === 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin accounts are protected from external modification.');
  }

  // Hierarchy checks
  if (adminRole === 'SUPER_ADMIN') return true;
  
  if (adminRole === 'ADMIN') {
    if (targetUser.role === 'ADMIN') {
      throw new Error('Forbidden: Admins cannot manage other Admin-level accounts.');
    }
    return true;
  }

  throw new Error('Forbidden: Insufficient privileges for user management.');
}

/**
 * Unified error handler for API routes.
 * Logs forbidden access attempts and returns appropriate JSON responses.
 */
export async function handleApiError(error: any) {
  console.error('[API ERROR]:', error);
  const message = error.message || 'Internal server error';
  const status = message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500;
  
  if (status === 403) {
    try {
      const session = await getSession();
      if (session) {
        await prisma.auditLog.create({
          data: {
            userId: session.userId,
            action: 'SECURITY_VIOLATION',
            details: `Unauthorized access attempt: ${message}`
          }
        });
      }
    } catch (e) {
      console.error('Failed to log security violation:', e);
    }
  }

  return NextResponse.json({ 
    success: false, 
    message 
  }, { status });
}
