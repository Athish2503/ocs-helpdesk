/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[crm_customer_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPERVISOR';
ALTER TYPE "Role" ADD VALUE 'SUPPORT_L1';
ALTER TYPE "Role" ADD VALUE 'SUPPORT_L2';
ALTER TYPE "Role" ADD VALUE 'BILLING';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "credits" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "affected_domain" TEXT,
ADD COLUMN     "created_by_secondary_email" TEXT,
ADD COLUMN     "crm_customer_id" TEXT,
ADD COLUMN     "domain_id" TEXT,
ADD COLUMN     "first_response_at" TIMESTAMP(3),
ADD COLUMN     "issue_category" TEXT,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "service_id" TEXT,
ADD COLUMN     "subscription_id" TEXT,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "ttr_hours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "crm_customer_id" TEXT,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "phone_number" TEXT;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "author_id" TEXT NOT NULL,
    "category_id" TEXT,
    "meta_title" VARCHAR(60),
    "meta_description" VARCHAR(160),
    "keywords" TEXT,
    "canonical_url" VARCHAR(255),
    "og_image" VARCHAR(500),
    "total_reads" INTEGER NOT NULL DEFAULT 0,
    "unique_reads" INTEGER NOT NULL DEFAULT 0,
    "last_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_versions" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_article_reads" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "session_fingerprint" VARCHAR(64) NOT NULL,
    "ip_hash" VARCHAR(64) NOT NULL,
    "user_agent" TEXT,
    "referrer" VARCHAR(500),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "read_duration" INTEGER NOT NULL DEFAULT 0,
    "scroll_depth" INTEGER NOT NULL DEFAULT 0,
    "is_unique" BOOLEAN NOT NULL DEFAULT true,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_article_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_article_access_log" (
    "id" TEXT NOT NULL,
    "article_id" TEXT,
    "article_slug" VARCHAR(255),
    "ip_address" VARCHAR(45) NOT NULL,
    "ip_hash" VARCHAR(64) NOT NULL,
    "user_agent" TEXT,
    "request_method" VARCHAR(10) NOT NULL DEFAULT 'GET',
    "request_path" VARCHAR(500),
    "query_params" TEXT,
    "response_status" INTEGER,
    "response_time_ms" INTEGER,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspicious_reason" VARCHAR(255),
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_article_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_rate_limits" (
    "id" TEXT NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "endpoint" VARCHAR(100) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 1,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "window_end" TIMESTAMP(3),
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "violation_count" INTEGER NOT NULL DEFAULT 0,
    "last_request_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_ip_blacklist" (
    "id" TEXT NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "blocked_by" VARCHAR(32) NOT NULL DEFAULT 'SYSTEM',
    "is_permanent" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "unblocked_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "knowledge_ip_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_security_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "request_path" VARCHAR(500),
    "request_payload" TEXT,
    "description" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" VARCHAR(32),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_article_attachments" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploaded_by" VARCHAR(36) NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_article_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id" TEXT,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_status_histories" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "from_status" "TicketStatus",
    "to_status" "TicketStatus" NOT NULL,
    "changed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_rules" (
    "id" TEXT NOT NULL,
    "issue_category" TEXT NOT NULL,
    "assignee_id" TEXT,
    "team_id" TEXT,
    "secondary_assignee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credits" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "allocated_hours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "used_hours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remaining_hours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "billable_hours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "credit_category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "customer_credits_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "hours" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissions" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_customers" (
    "id" TEXT NOT NULL,
    "crm_customer_id" TEXT NOT NULL,
    "company_name" TEXT,
    "display_name" TEXT NOT NULL,
    "primary_email" TEXT NOT NULL,
    "secondary_email" TEXT,
    "primary_phone" TEXT,
    "secondary_phone" TEXT,
    "customer_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "crm_updated_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_domains" (
    "id" TEXT NOT NULL,
    "crm_domain_id" TEXT NOT NULL,
    "domain_name" TEXT NOT NULL,
    "crm_customer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_services" (
    "id" TEXT NOT NULL,
    "crm_service_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "crm_customer_id" TEXT NOT NULL,
    "domain_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_subscriptions" (
    "id" TEXT NOT NULL,
    "crm_subscription_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "crm_customer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "crm_customer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "temporary_password" TEXT,
    "setup_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "sent_by_admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload" TEXT,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeamMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeamMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArticleTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArticleTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_articles_slug_key" ON "knowledge_base_articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_tags_name_key" ON "knowledge_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_rate_limits_ip_address_endpoint_window_start_key" ON "knowledge_rate_limits"("ip_address", "endpoint", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "routing_rules_issue_category_key" ON "routing_rules"("issue_category");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credits_customer_id_key" ON "customer_credits"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_key" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "crm_customers_crm_customer_id_key" ON "crm_customers"("crm_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_customers_primary_email_key" ON "crm_customers"("primary_email");

-- CreateIndex
CREATE UNIQUE INDEX "crm_domains_crm_domain_id_key" ON "crm_domains"("crm_domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_services_crm_service_id_key" ON "crm_services"("crm_service_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_subscriptions_crm_subscription_id_key" ON "crm_subscriptions"("crm_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_setup_token_key" ON "invitations"("setup_token");

-- CreateIndex
CREATE INDEX "_TeamMembers_B_index" ON "_TeamMembers"("B");

-- CreateIndex
CREATE INDEX "_ArticleTags_B_index" ON "_ArticleTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_crm_customer_id_key" ON "users"("crm_customer_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_crm_customer_id_fkey" FOREIGN KEY ("crm_customer_id") REFERENCES "crm_customers"("crm_customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_crm_customer_id_fkey" FOREIGN KEY ("crm_customer_id") REFERENCES "crm_customers"("crm_customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "crm_domains"("crm_domain_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "crm_subscriptions"("crm_subscription_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "crm_services"("crm_service_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "knowledge_versions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "knowledge_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_reads" ADD CONSTRAINT "knowledge_article_reads_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_attachments" ADD CONSTRAINT "knowledge_article_attachments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_status_histories" ADD CONSTRAINT "ticket_status_histories_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_status_histories" ADD CONSTRAINT "ticket_status_histories_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_secondary_assignee_id_fkey" FOREIGN KEY ("secondary_assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_credit_category_id_fkey" FOREIGN KEY ("credit_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_customer_credits_id_fkey" FOREIGN KEY ("customer_credits_id") REFERENCES "customer_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_domains" ADD CONSTRAINT "crm_domains_crm_customer_id_fkey" FOREIGN KEY ("crm_customer_id") REFERENCES "crm_customers"("crm_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_services" ADD CONSTRAINT "crm_services_crm_customer_id_fkey" FOREIGN KEY ("crm_customer_id") REFERENCES "crm_customers"("crm_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_subscriptions" ADD CONSTRAINT "crm_subscriptions_crm_customer_id_fkey" FOREIGN KEY ("crm_customer_id") REFERENCES "crm_customers"("crm_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_crm_customer_id_fkey" FOREIGN KEY ("crm_customer_id") REFERENCES "crm_customers"("crm_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_sent_by_admin_id_fkey" FOREIGN KEY ("sent_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleTags" ADD CONSTRAINT "_ArticleTags_A_fkey" FOREIGN KEY ("A") REFERENCES "knowledge_base_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleTags" ADD CONSTRAINT "_ArticleTags_B_fkey" FOREIGN KEY ("B") REFERENCES "knowledge_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
