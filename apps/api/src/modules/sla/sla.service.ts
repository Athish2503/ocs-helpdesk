import { prisma } from "../../config/prisma.js";
import type { CreateSlaPolicyInput, UpdateSlaPolicyInput } from "./sla.schemas.js";

/**
 * List all SLA policies, ordered by priority tier.
 */
export async function listSlaPolicies() {
  const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW", "ALL"];
  const policies = await prisma.slaPolicy.findMany({
    orderBy: { createdAt: "asc" },
  });
  return policies.sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );
}

/**
 * Get a single SLA policy by ID.
 */
export async function getSlaPolicyById(id: string) {
  const policy = await prisma.slaPolicy.findUnique({ where: { id } });
  if (!policy) {
    const err = new Error("SLA policy not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return policy;
}

/**
 * Create a new SLA policy.
 * Priority must be unique — only one policy per priority tier.
 */
export async function createSlaPolicy(input: CreateSlaPolicyInput) {
  const existing = await prisma.slaPolicy.findFirst({
    where: { priority: input.priority },
  });
  if (existing) {
    const err = new Error(
      `An SLA policy already exists for priority "${input.priority}". Edit the existing policy instead.`
    ) as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  return prisma.slaPolicy.create({
    data: {
      name: input.name,
      priority: input.priority,
      firstResponseHours: input.firstResponseHours,
      resolutionHours: input.resolutionHours,
      isActive: input.isActive ?? true,
    },
  });
}

/**
 * Update an existing SLA policy.
 */
export async function updateSlaPolicy(id: string, input: UpdateSlaPolicyInput) {
  await getSlaPolicyById(id); // throws 404 if not found

  // If priority is changing, ensure uniqueness
  if (input.priority) {
    const conflicting = await prisma.slaPolicy.findFirst({
      where: { priority: input.priority, NOT: { id } },
    });
    if (conflicting) {
      const err = new Error(
        `Another SLA policy already exists for priority "${input.priority}".`
      ) as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }
  }

  return prisma.slaPolicy.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.firstResponseHours !== undefined && { firstResponseHours: input.firstResponseHours }),
      ...(input.resolutionHours !== undefined && { resolutionHours: input.resolutionHours }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

/**
 * Delete an SLA policy by ID.
 */
export async function deleteSlaPolicy(id: string) {
  await getSlaPolicyById(id); // throws 404 if not found
  await prisma.slaPolicy.delete({ where: { id } });
}

/**
 * Toggle the isActive status of an SLA policy.
 */
export async function toggleSlaPolicy(id: string, isActive: boolean) {
  await getSlaPolicyById(id);
  return prisma.slaPolicy.update({
    where: { id },
    data: { isActive },
  });
}

/**
 * Find the active SLA policy for a given ticket priority.
 * Falls back to "ALL" policy if no priority-specific policy is found.
 */
export async function getActivePolicyForPriority(priority: string) {
  // Try exact match first
  const exact = await prisma.slaPolicy.findFirst({
    where: { priority, isActive: true },
  });
  if (exact) return exact;

  // Fall back to ALL
  return prisma.slaPolicy.findFirst({
    where: { priority: "ALL", isActive: true },
  });
}

/**
 * Compute SLA deadlines for a ticket based on its priority.
 * Returns null deadlines if no active policy is found.
 */
export async function computeSlaDeadlines(
  priority: string,
  createdAt: Date
): Promise<{ slaResponseDeadline: Date | null; slaResolutionDeadline: Date | null }> {
  const policy = await getActivePolicyForPriority(priority);
  if (!policy) {
    return { slaResponseDeadline: null, slaResolutionDeadline: null };
  }

  const created = createdAt.getTime();
  return {
    slaResponseDeadline: new Date(created + policy.firstResponseHours * 60 * 60 * 1000),
    slaResolutionDeadline: new Date(created + policy.resolutionHours * 60 * 60 * 1000),
  };
}

/**
 * Seed default SLA policies if none exist.
 * Called during server startup or seed.
 */
export async function seedDefaultSlaPolicies() {
  const count = await prisma.slaPolicy.count();
  if (count > 0) return; // already seeded

  const defaults = [
    { name: "Urgent SLA", priority: "URGENT", firstResponseHours: 1, resolutionHours: 4 },
    { name: "High SLA", priority: "HIGH", firstResponseHours: 2, resolutionHours: 8 },
    { name: "Medium SLA", priority: "MEDIUM", firstResponseHours: 8, resolutionHours: 24 },
    { name: "Low SLA", priority: "LOW", firstResponseHours: 24, resolutionHours: 72 },
  ];

  for (const policy of defaults) {
    await prisma.slaPolicy.create({ data: { ...policy, isActive: true } });
  }

  console.log("🌱  Seeded default SLA policies.");
}
