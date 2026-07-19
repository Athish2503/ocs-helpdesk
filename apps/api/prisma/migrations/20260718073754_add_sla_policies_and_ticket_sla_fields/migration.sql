-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "sla_breached" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sla_resolution_deadline" TIMESTAMP(3),
ADD COLUMN     "sla_response_deadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sla_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "first_response_hours" DOUBLE PRECISION NOT NULL,
    "resolution_hours" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_priority_key" ON "sla_policies"("priority");
