export interface ActivityLog {
  id: number;
  userId: number | null;
  user?: { id: number; firstName: string; lastName: string; username: string };
  action: string;
  entity: string;
  entityId: number | null;
  description: string;
  metadata: string;
  ipAddress: string;
  userAgent: string;
  level: string;
  createdAt: string;
}

export interface QueryActivityLog {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entity?: string;
  userId?: number;
  level?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ActivityLogStats {
  total: number;
  byAction: Record<string, number>;
  byEntity: Record<string, number>;
  byLevel: Record<string, number>;
}
