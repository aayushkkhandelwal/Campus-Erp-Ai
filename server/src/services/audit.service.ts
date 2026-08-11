import prisma from '../prisma/client';

export interface CreateAuditLogInput {
  userId?: string | null;
  userRole?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}

export const createAuditLog = async (data: CreateAuditLogInput) => {
  try {
    const detailsString = typeof data.details === 'object' && data.details !== null
      ? JSON.stringify(data.details)
      : data.details || null;

    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        userRole: data.userRole || null,
        action: data.action,
        resource: data.resource || null,
        resourceId: data.resourceId || null,
        details: detailsString,
        ipAddress: data.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('⚠️ Failed to write audit log:', error);
  }
};
