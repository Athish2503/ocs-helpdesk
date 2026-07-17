import type { Request, Response, NextFunction } from "express";
import { createUserSchema, updateUserSchema } from "./users.schemas.js";
import * as UsersService from "./users.service.js";
import * as crmService from "../../services/crm.service.js";
import * as AuthService from "../auth/auth.service.js";
import { DEFAULT_PERMISSIONS } from "../../middleware/role.middleware.js";
import type { Role } from "../../types/role.js";
import { getOrFetchDomains, getOrFetchServices, getOrFetchSubscriptions, syncUserCredits } from "../../services/crm-cache.service.js";


function ok(res: Response, data: unknown) {
  res.status(200).json({ success: true, data });
}

export async function createUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createUserSchema.parse(req.body);
    const user = await UsersService.createUser(input);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function listUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, role, isActive } = req.query;
    const users = await UsersService.listUsers({
      search: search as string,
      role: role as string,
      isActive: isActive as string,
    });
    ok(res, { users });
  } catch (err) {
    next(err);
  }
}

export async function getAgentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const agents = await UsersService.getAgents();
    ok(res, { agents });
  } catch (err) {
    next(err);
  }
}

export async function getUserByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await UsersService.getUserById(id as string);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateUserSchema.parse(req.body);
    const user = await UsersService.updateUser(id as string, input);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { name, password } = req.body;
    const user = await UsersService.updateProfile(userId, { name, password });
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}

import { prisma } from "../../config/prisma.js";

export async function getMyCreditsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: { crmCustomerId: true }
    });

    await syncUserCredits(customerId, user?.crmCustomerId || null).catch(err => {
      console.error(`[Users Controller] Error syncing user credits:`, err);
    });

    const credits = await prisma.customerCredits.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    ok(res, { credits });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerCreditsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string; // customer user ID
    const { allocatedHours, description } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { crmCustomerId: true }
    });

    if (!user) {
      const error = new Error("User not found") as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const crmCustomerId = user.crmCustomerId;
    if (!crmCustomerId) {
      const error = new Error("User does not have a CRM customer ID") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    // Sync first to get the most updated base allocated credits from CRM
    const syncedCredits = await syncUserCredits(id, crmCustomerId);
    const oldAllocated = syncedCredits.allocatedHours;
    const diff = (allocatedHours ?? oldAllocated) - oldAllocated;

    if (diff !== 0) {
      // Retain manual adjustments as separate audit entries only
      await prisma.creditUsage.create({
        data: {
          crmCustomerId,
          hoursConsumed: 0.0,
          adjustments: diff,
          reason: description || `Credits adjusted by administrator. Change: ${diff > 0 ? "+" : ""}${diff} hours.`,
        }
      });
    }

    // Recalculate everything and sync to database
    const credits = await syncUserCredits(id, crmCustomerId);

    if (diff !== 0) {
      // Record transaction for backward compatibility/history
      await prisma.creditTransaction.create({
        data: {
          customerCreditsId: credits.id,
          hours: diff,
          type: "ALLOCATION",
          description: description || `Credits adjusted by administrator. Change: ${diff > 0 ? "+" : ""}${diff} hours.`,
        },
      });
    }

    const updatedCredits = await prisma.customerCredits.findUnique({
      where: { id: credits.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    ok(res, { credits: updatedCredits });
  } catch (err) {
    next(err);
  }
}

export async function listRoutingRulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await prisma.routingRule.findMany({
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        secondaryAssignee: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { issueCategory: "asc" },
    });
    ok(res, { rules });
  } catch (err) {
    next(err);
  }
}

export async function updateRoutingRuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { assigneeId, teamId, secondaryAssigneeId } = req.body;

    const rule = await prisma.routingRule.update({
      where: { id },
      data: {
        assigneeId: assigneeId !== undefined ? assigneeId : undefined,
        teamId: teamId !== undefined ? teamId : undefined,
        secondaryAssigneeId: secondaryAssigneeId !== undefined ? secondaryAssigneeId : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        secondaryAssignee: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });

    ok(res, { rule });
  } catch (err) {
    next(err);
  }
}

export async function createRoutingRuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { issueCategory, assigneeId, teamId, secondaryAssigneeId } = req.body;
    if (!issueCategory || !issueCategory.trim()) {
      res.status(400).json({ success: false, error: { message: "Issue category name is required" } });
      return;
    }

    const rule = await prisma.routingRule.create({
      data: {
        issueCategory: issueCategory.trim(),
        assigneeId: assigneeId || null,
        teamId: teamId || null,
        secondaryAssigneeId: secondaryAssigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        secondaryAssignee: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });

    ok(res, { rule });
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(409).json({ success: false, error: { message: "A routing rule for this category already exists" } });
      return;
    }
    next(err);
  }
}

export async function deleteRoutingRuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.routingRule.delete({
      where: { id },
    });
    ok(res, { message: "Routing rule deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function listRolePermissionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const dbPermissions = await prisma.rolePermission.findMany();
    const systemRoles = ["ADMIN", "CUSTOMER", "AGENT", "SUPERVISOR", "SUPPORT_L1", "SUPPORT_L2", "BILLING"];
    // Get unique list of all roles in DB + system roles
    const allRoles = Array.from(new Set([...systemRoles, ...dbPermissions.map(p => p.role)]));
    const permissions = allRoles.map(role => {
      const dbRecord = dbPermissions.find(p => p.role === role);
      return {
        role,
        permissions: dbRecord?.permissions ?? DEFAULT_PERMISSIONS[role] ?? [],
      };
    });

    ok(res, { permissions });
  } catch (err) {
    next(err);
  }
}

export async function updateRolePermissionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, permissions } = req.body;
    if (!role || typeof role !== "string" || role.trim() === "") {
      res.status(400).json({ success: false, error: { message: "Invalid role specified" } });
      return;
    }
    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, error: { message: "Permissions must be an array of strings" } });
      return;
    }

    const trimmedRole = role.trim();

    const record = await prisma.rolePermission.upsert({
      where: { role: trimmedRole },
      update: { permissions },
      create: { role: trimmedRole, permissions },
    });

    ok(res, { record });
  } catch (err) {
    next(err);
  }
}

export async function deleteRolePermissionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.params.role as string;
    if (!role) {
      res.status(400).json({ success: false, error: { message: "Role is required" } });
      return;
    }

    const systemRoles = ["ADMIN", "CUSTOMER", "AGENT", "SUPERVISOR", "SUPPORT_L1", "SUPPORT_L2", "BILLING"];
    if (systemRoles.includes(role)) {
      res.status(400).json({ success: false, error: { message: "Cannot delete system roles" } });
      return;
    }

    // Delete role permission record
    await prisma.rolePermission.delete({
      where: { role },
    });

    // Fall back all users with this role to 'AGENT'
    await prisma.user.updateMany({
      where: { role },
      data: { role: "AGENT" },
    });

    ok(res, { message: `Role ${role} deleted successfully. Affected staff fell back to AGENT.` });
  } catch (err) {
    next(err);
  }
}

export async function inviteUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const { generateTempPassword } = req.body;
    const result = await AuthService.sendInvitation(id as string, currentUserId, !!generateTempPassword);
    ok(res, { invitation: result });
  } catch (err) {
    next(err);
  }
}

export async function resendInviteUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const result = await AuthService.resendInvitation(id as string, currentUserId);
    ok(res, { invitation: result });
  } catch (err) {
    next(err);
  }
}

export async function sendResetPasswordLinkHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await UsersService.getUserById(id as string);
    const result = await AuthService.forgotPassword({ email: user.email });
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getCrmCustomersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const search = (req.query.search as string) || "";
    const limitQuery = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000;
    const crmData = await crmService.getCustomers({ search, limit: limitQuery });
    ok(res, crmData);
  } catch (err) {
    next(err);
  }
}

export async function getMyCrmDetailsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { crmCustomerId: true },
    });

    if (!user || !user.crmCustomerId) {
      ok(res, { customer: null, domains: [], subscriptions: [], services: [] });
      return;
    }

    const crmCustomerId = user.crmCustomerId;

    const [customer, domains, subscriptions, services] = await Promise.all([
      prisma.crmCustomer.findUnique({ where: { crmCustomerId } }),
      getOrFetchDomains(crmCustomerId),
      getOrFetchSubscriptions(crmCustomerId),
      getOrFetchServices(crmCustomerId),
    ]);

    ok(res, { customer, domains, subscriptions, services });
  } catch (err) {
    next(err);
  }
}



