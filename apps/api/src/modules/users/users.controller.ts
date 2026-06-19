import type { Request, Response, NextFunction } from "express";
import { createUserSchema, updateUserSchema } from "./users.schemas.js";
import * as UsersService from "./users.service.js";
import { DEFAULT_PERMISSIONS } from "../../middleware/role.middleware.js";
import { Role } from "../../generated/prisma/enums.js";


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
    let credits = await prisma.customerCredits.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!credits) {
      credits = await prisma.customerCredits.create({
        data: {
          customerId,
          allocatedHours: 20.0,
          usedHours: 0.0,
          remainingHours: 20.0,
          billableHours: 0.0,
        },
        include: {
          transactions: true,
        },
      });
    }

    ok(res, { credits });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerCreditsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string; // customer user ID
    const { allocatedHours, usedHours, remainingHours, billableHours, description } = req.body;

    const currentCredits = await prisma.customerCredits.findUnique({
      where: { customerId: id },
    });

    const oldAllocated = currentCredits?.allocatedHours ?? 0;
    const diff = (allocatedHours ?? oldAllocated) - oldAllocated;

    const credits = await prisma.customerCredits.upsert({
      where: { customerId: id },
      update: {
        ...(allocatedHours !== undefined ? { allocatedHours } : {}),
        ...(usedHours !== undefined ? { usedHours } : {}),
        ...(remainingHours !== undefined ? { remainingHours } : {}),
        ...(billableHours !== undefined ? { billableHours } : {}),
      },
      create: {
        customerId: id,
        allocatedHours: allocatedHours ?? 20.0,
        usedHours: usedHours ?? 0.0,
        remainingHours: remainingHours ?? 20.0,
        billableHours: billableHours ?? 0.0,
      },
    });

    if (diff !== 0) {
      // Record transaction
      await prisma.creditTransaction.create({
        data: {
          customerCreditsId: credits.id,
          hours: diff,
          type: "ALLOCATION",
          description: description || `Credits adjusted by administrator. Change: ${diff > 0 ? "+" : ""}${diff} hours.`,
        },
      });
    }

    ok(res, { credits });
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
    const rolesList = Object.values(Role);
    const permissions = rolesList.map(role => {
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
    if (!role || !Object.values(Role).includes(role)) {
      res.status(400).json({ success: false, error: { message: "Invalid role specified" } });
      return;
    }
    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, error: { message: "Permissions must be an array of strings" } });
      return;
    }

    const record = await prisma.rolePermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    });

    ok(res, { record });
  } catch (err) {
    next(err);
  }
}

