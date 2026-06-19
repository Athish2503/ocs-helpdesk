import { prisma } from "../../config/prisma.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schemas.js";
import { hashPassword } from "../../utils/password.js";

export async function listUsers(query: { search?: string; role?: string; isActive?: string }) {
  const where: any = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === "true";
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      teams: {
        select: { id: true, name: true },
      },
      customerCredits: {
        select: {
          id: true,
          allocatedHours: true,
          usedHours: true,
          remainingHours: true,
          billableHours: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      teams: {
        select: { id: true, name: true },
      },
      customerCredits: {
        select: {
          id: true,
          allocatedHours: true,
          usedHours: true,
          remainingHours: true,
          billableHours: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error("User not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return user;
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const error = new Error("An account with this email already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      emailVerified: true,
      isActive: true,
      teams: input.teamIds
        ? {
            connect: input.teamIds.map((id) => ({ id })),
          }
        : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      teams: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  // Verify existence
  await getUserById(id);

  const data: any = { ...input };
  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
    delete data.password;
  }

  if (input.teamIds !== undefined) {
    data.teams = {
      set: input.teamIds.map((id) => ({ id })),
    };
    delete data.teamIds;
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      teams: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function getAgents() {
  return prisma.user.findMany({
    where: {
      role: {
        in: ["AGENT", "SUPPORT_L1", "SUPPORT_L2", "BILLING", "ADMIN"]
      }
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function updateProfile(id: string, input: { name?: string; password?: string }) {
  // Verify user exists
  await getUserById(id);

  const data: any = {};
  if (input.name) {
    data.name = input.name;
  }
  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
