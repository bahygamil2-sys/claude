-- AlterTable
ALTER TABLE "AdminRefreshToken" ADD COLUMN     "replacedByTokenId" TEXT;

-- AlterTable
ALTER TABLE "BrandUserRefreshToken" ADD COLUMN     "replacedByTokenId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminRefreshToken_tokenHash_key" ON "AdminRefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "BrandUserRefreshToken_tokenHash_key" ON "BrandUserRefreshToken"("tokenHash");

