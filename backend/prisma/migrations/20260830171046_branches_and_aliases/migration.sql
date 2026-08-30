-- CreateTable
CREATE TABLE "RestaurantBranch" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "openedAt" DATE NOT NULL,
    "closedAt" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchNameAlias" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "rawName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchNameAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestaurantBranch_brandId_isActive_idx" ON "RestaurantBranch"("brandId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantBranch_brandId_name_key" ON "RestaurantBranch"("brandId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BranchNameAlias_brandId_normalizedName_key" ON "BranchNameAlias"("brandId", "normalizedName");

-- AddForeignKey
ALTER TABLE "RestaurantBranch" ADD CONSTRAINT "RestaurantBranch_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchNameAlias" ADD CONSTRAINT "BranchNameAlias_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "RestaurantBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchNameAlias" ADD CONSTRAINT "BranchNameAlias_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
