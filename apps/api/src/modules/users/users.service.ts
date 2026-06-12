import { prisma } from "../../config/prisma.js";
import type { UpdateUserInput } from "./users.schemas.js";
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
    },
  });

  if (!user) {
    const error = new Error("User not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  // Verify existence
  await getUserById(id);

  return prisma.user.update({
    where: { id },
    data: input,
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

export async function getAgents() {
  return prisma.user.findMany({
    where: {
      OR: [
        { role: "AGENT" },
        { role: "ADMIN" } // Admins can be treated as agents as well for team assignment purposes
      ]
    },
    select: { id: true, name: true, email: true },
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
