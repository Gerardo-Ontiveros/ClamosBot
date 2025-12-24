-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresIn" INTEGER,
    "obtainmentTimestamp" BIGINT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomCommand" (
    "id" SERIAL NOT NULL,
    "trigger" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomCommand_userId_trigger_key" ON "CustomCommand"("userId", "trigger");

-- AddForeignKey
ALTER TABLE "CustomCommand" ADD CONSTRAINT "CustomCommand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
