-- AlterTable
ALTER TABLE "crm_domains" ADD COLUMN     "registered_with" TEXT NOT NULL DEFAULT 'Others';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "escalated_at" TIMESTAMP(3),
ADD COLUMN     "escalated_by_id" TEXT,
ADD COLUMN     "escalation_reason" TEXT,
ADD COLUMN     "is_escalated" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_escalated_by_id_fkey" FOREIGN KEY ("escalated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
