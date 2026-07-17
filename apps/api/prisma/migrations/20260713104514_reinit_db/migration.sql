/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `role` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "role_permissions" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'CUSTOMER';

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "crm_sync_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "errors" TEXT,

    CONSTRAINT "crm_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_event_queue" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_event_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_usages" (
    "id" TEXT NOT NULL,
    "crm_customer_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "hours_consumed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "adjustments" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_sync_logs_event_id_key" ON "crm_sync_logs"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_event_queue_event_id_key" ON "crm_event_queue"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_key" ON "role_permissions"("role");

-- AddForeignKey
ALTER TABLE "credit_usages" ADD CONSTRAINT "credit_usages_crm_customer_id_fkey" FOREIGN KEY ("crm_customer_id") REFERENCES "crm_customers"("crm_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_usages" ADD CONSTRAINT "credit_usages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
