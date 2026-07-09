export type Role = string;

export const SystemRoles = {
  CUSTOMER: "CUSTOMER",
  AGENT: "AGENT",
  SUPERVISOR: "SUPERVISOR",
  SUPPORT_L1: "SUPPORT_L1",
  SUPPORT_L2: "SUPPORT_L2",
  BILLING: "BILLING",
  ADMIN: "ADMIN",
} as const;

export type SystemRoleType = typeof SystemRoles[keyof typeof SystemRoles];
