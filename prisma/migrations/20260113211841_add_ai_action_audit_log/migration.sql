-- CreateTable
CREATE TABLE "AiActionAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "resultId" TEXT,
    "resultType" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiActionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiActionAuditLog_userId_idx" ON "AiActionAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AiActionAuditLog_createdAt_idx" ON "AiActionAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiActionAuditLog_actionType_idx" ON "AiActionAuditLog"("actionType");
