import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    team: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    ticket: {
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "../../config/prisma.js";
import {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} from "./teams.service.js";

describe("Teams Service - Business Logic & Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createTeam should throw 409 if team name already exists", async () => {
    (prisma.team.findUnique as any).mockResolvedValue({ id: "t1", name: "L1 Support" });

    await expect(createTeam({ name: "L1 Support" })).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("already exists"),
    });
  });

  it("createTeam should connect members when memberIds are provided", async () => {
    (prisma.team.findUnique as any).mockResolvedValue(null);
    (prisma.team.create as any).mockResolvedValue({ id: "t1", name: "Billing Team", members: [] });

    await createTeam({ name: "Billing Team", memberIds: ["user1", "user2"] });

    expect(prisma.team.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: {
            connect: [{ id: "user1" }, { id: "user2" }],
          },
        }),
      })
    );
  });

  it("deleteTeam should unassign tickets from the team before deleting", async () => {
    (prisma.team.findUnique as any).mockResolvedValue({ id: "t1", name: "Level 1" });
    (prisma.team.delete as any).mockResolvedValue({ id: "t1" });

    await deleteTeam("t1");

    expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
      where: { teamId: "t1" },
      data: { teamId: null },
    });
    expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });
});
