-- CreateTable
CREATE TABLE "RedeemCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "batch" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNUSED',
    "expiresAt" DATETIME,
    "usedBy" TEXT,
    "usedAt" DATETIME,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedeemCode_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RedeemCode_code_key" ON "RedeemCode"("code");

-- CreateIndex
CREATE INDEX "RedeemCode_batch_idx" ON "RedeemCode"("batch");

-- CreateIndex
CREATE INDEX "RedeemCode_status_idx" ON "RedeemCode"("status");

