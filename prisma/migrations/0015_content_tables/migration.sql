-- CreateEnum for ContentStatus
DO $$ BEGIN
    CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for ProcedureType (for Knowledge Base)
DO $$ BEGIN
    CREATE TYPE "ProcedureType" AS ENUM ('IZA', 'IPK', 'IAA', 'ALL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable UserProfile (user_id is UUID to match User.id)
CREATE TABLE IF NOT EXISTS "UserProfile" (
    "user_id" UUID NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "default_sender_name" TEXT,
    "default_sender_country" TEXT,
    "default_recipient_name" TEXT,
    "default_recipient_country" TEXT,
    "preferred_countries" JSONB,
    "preferred_currencies" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey UserProfile
ALTER TABLE "UserProfile"
    ADD CONSTRAINT "UserProfile_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable BlogPost (id is UUID, user references are UUID)
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable FaqEntry
CREATE TABLE IF NOT EXISTS "FaqEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Allgemein',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "related_blog_post_id" UUID,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,

    CONSTRAINT "FaqEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable KnowledgeTopic
CREATE TABLE IF NOT EXISTS "KnowledgeTopic" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable KnowledgeEntry
CREATE TABLE IF NOT EXISTS "KnowledgeEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "applies_to" "ProcedureType" NOT NULL DEFAULT 'ALL',
    "related_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topic_id" UUID,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex BlogPost
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX IF NOT EXISTS "BlogPost_published_at_idx" ON "BlogPost"("published_at");
CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex FaqEntry
CREATE INDEX IF NOT EXISTS "FaqEntry_status_idx" ON "FaqEntry"("status");
CREATE INDEX IF NOT EXISTS "FaqEntry_category_idx" ON "FaqEntry"("category");
CREATE INDEX IF NOT EXISTS "FaqEntry_order_index_idx" ON "FaqEntry"("order_index");

-- CreateIndex KnowledgeTopic
CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeTopic_code_key" ON "KnowledgeTopic"("code");
CREATE INDEX IF NOT EXISTS "KnowledgeTopic_code_idx" ON "KnowledgeTopic"("code");
CREATE INDEX IF NOT EXISTS "KnowledgeTopic_order_index_idx" ON "KnowledgeTopic"("order_index");

-- CreateIndex KnowledgeEntry
CREATE INDEX IF NOT EXISTS "KnowledgeEntry_status_idx" ON "KnowledgeEntry"("status");
CREATE INDEX IF NOT EXISTS "KnowledgeEntry_applies_to_idx" ON "KnowledgeEntry"("applies_to");
CREATE INDEX IF NOT EXISTS "KnowledgeEntry_topic_id_idx" ON "KnowledgeEntry"("topic_id");

-- AddForeignKey BlogPost
ALTER TABLE "BlogPost"
    ADD CONSTRAINT "BlogPost_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BlogPost"
    ADD CONSTRAINT "BlogPost_updated_by_user_id_fkey"
    FOREIGN KEY ("updated_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey FaqEntry
ALTER TABLE "FaqEntry"
    ADD CONSTRAINT "FaqEntry_related_blog_post_id_fkey"
    FOREIGN KEY ("related_blog_post_id") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FaqEntry"
    ADD CONSTRAINT "FaqEntry_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FaqEntry"
    ADD CONSTRAINT "FaqEntry_updated_by_user_id_fkey"
    FOREIGN KEY ("updated_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey KnowledgeEntry
ALTER TABLE "KnowledgeEntry"
    ADD CONSTRAINT "KnowledgeEntry_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "KnowledgeTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
