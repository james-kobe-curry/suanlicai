-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "email" TEXT,
    "platformId" TEXT,
    "boundAt" DATETIME,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "usernameChangesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "usernameChangedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("balance", "boundAt", "createdAt", "email", "id", "passwordHash", "phone", "platformId", "role", "status", "username") SELECT "balance", "boundAt", "createdAt", "email", "id", "passwordHash", "phone", "platformId", "role", "status", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_platformId_key" ON "User"("platformId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

