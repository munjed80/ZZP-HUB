-- CreateTable
CREATE TABLE "AccountantSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountantSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountantSession_sessionToken_key" ON "AccountantSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AccountantSession_sessionToken_idx" ON "AccountantSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AccountantSession_userId_idx" ON "AccountantSession"("userId");

-- CreateIndex
CREATE INDEX "AccountantSession_companyId_idx" ON "AccountantSession"("companyId");

-- CreateIndex
CREATE INDEX "AccountantSession_expiresAt_idx" ON "AccountantSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "AccountantSession" ADD CONSTRAINT "AccountantSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountantSession" ADD CONSTRAINT "AccountantSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
