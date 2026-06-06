import type { Role } from "../../generated/prisma/enums.js";

// ---------------------------------------------------------------------------
// Request bodies (raw — validated by Zod in auth.schemas.ts)
// ---------------------------------------------------------------------------

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

// ---------------------------------------------------------------------------
// Augment Express — attach the authenticated user on request
// ---------------------------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}
