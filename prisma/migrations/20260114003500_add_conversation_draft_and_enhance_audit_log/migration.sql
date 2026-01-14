-- AlterTable
ALTER TABLE "AiActionAuditLog" ADD COLUMN "payloadJson" TEXT,
ADD COLUMN "requestId" TEXT,
ADD COLUMN "entityType" TEXT,
ADD COLUMN "entityId" TEXT,
ADD COLUMN "status" TEXT;

-- CreateTable
CREATE TABLE "ConversationDraft" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "draftJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationDraft_conversationId_key" ON "ConversationDraft"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationDraft_userId_idx" ON "ConversationDraft"("userId");

-- CreateIndex
CREATE INDEX "ConversationDraft_conversationId_idx" ON "ConversationDraft"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationDraft_status_idx" ON "ConversationDraft"("status");

-- CreateIndex
CREATE INDEX "AiActionAuditLog_requestId_idx" ON "AiActionAuditLog"("requestId");
