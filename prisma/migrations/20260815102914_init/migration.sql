-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "balance" BIGINT NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundNo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "basePrice" BIGINT NOT NULL DEFAULT 1000000,
    "returnRate" INTEGER NOT NULL DEFAULT 80,
    "betCloseAt" DATETIME NOT NULL,
    "drawAt" DATETIME NOT NULL,
    "winningCode" TEXT,
    "salt" TEXT,
    "codeHash" TEXT NOT NULL,
    "totalSales" BIGINT NOT NULL DEFAULT 0,
    "prizePool" BIGINT NOT NULL DEFAULT 0,
    "rolloverFrom" BIGINT NOT NULL DEFAULT 0,
    "rolloverTo" BIGINT NOT NULL DEFAULT 0,
    "rolloverDone" BOOLEAN NOT NULL DEFAULT false,
    "platformProfit" BIGINT NOT NULL DEFAULT 0,
    "drawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "stake" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "winLevel" INTEGER,
    "prize" BIGINT NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tx" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "balanceAfter" BIGINT NOT NULL,
    "refId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tx_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Round_roundNo_key" ON "Round"("roundNo");

-- CreateIndex
CREATE INDEX "Bet_userId_idx" ON "Bet"("userId");

-- CreateIndex
CREATE INDEX "Bet_roundId_idx" ON "Bet"("roundId");

-- CreateIndex
CREATE INDEX "Tx_userId_idx" ON "Tx"("userId");
