-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "currentChallenge" TEXT
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialID" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Authentication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signature" TEXT NOT NULL,
    "authenticatorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Authentication_authenticatorId_fkey" FOREIGN KEY ("authenticatorId") REFERENCES "Authenticator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Authentication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
