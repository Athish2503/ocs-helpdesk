export type UserRole = 'CUSTOMER' | 'AGENT' | 'SUPERVISOR' | 'ADMIN';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type KBStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  userId: string;
  agentId: string | null;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  slaDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  status: KBStatus;
  viewCount: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeEmbedding {
  id: string;
  articleId: string;
  embedding: number[];
  chunkText: string;
  chunkIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AISession {
  id: string;
  userId: string | null;
  query: string;
  response: string;
  kbArticlesUsed: string[];
  resolved: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, any>;
  readAt: Date | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, any> | null;
  ip: string | null;
  createdAt: Date;
}

export interface FileUpload {
  id: string;
  ticketId: string | null;
  messageId: string | null;
  uploaderId: string;
  minioKey: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface Admin {
  id: string;
  userId: string;
  permissions: Record<string, any>;
  createdAt: Date;
}
