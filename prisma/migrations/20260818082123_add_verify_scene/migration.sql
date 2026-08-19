-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VerifyCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "scene" TEXT NOT NULL DEFAULT 'BIND',
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerifyCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VerifyCode" ("attempts", "code", "createdAt", "expiresAt", "id", "target", "type", "usedAt", "userId") SELECT "attempts", "code", "createdAt", "expiresAt", "id", "target", "type", "usedAt", "userId" FROM "VerifyCode";
DROP TABLE "VerifyCode";
ALTER TABLE "new_VerifyCode" RENAME TO "VerifyCode";
CREATE INDEX "VerifyCode_userId_idx" ON "VerifyCode"("userId");
CREATE INDEX "VerifyCode_type_target_idx" ON "VerifyCode"("type", "target");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
