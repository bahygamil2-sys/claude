import { prisma } from "../../lib/prisma";
import { bucketByDay } from "../../lib/dateBuckets";

export async function getStats() {
  const [brandsByStatus, totalBranches, surveysByStatus, totalResponses, brandCreatedAts] = await Promise.all([
    prisma.brand.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.restaurantBranch.count(),
    prisma.survey.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.response.count(),
    prisma.brand.findMany({ select: { createdAt: true } }),
  ]);

  const brandsTotal = brandsByStatus.reduce((sum, row) => sum + row._count._all, 0);
  const surveysTotal = surveysByStatus.reduce((sum, row) => sum + row._count._all, 0);

  return {
    brands: {
      total: brandsTotal,
      byStatus: Object.fromEntries(brandsByStatus.map((row) => [row.status, row._count._all])),
    },
    branches: { total: totalBranches },
    surveys: {
      total: surveysTotal,
      byStatus: Object.fromEntries(surveysByStatus.map((row) => [row.status, row._count._all])),
    },
    responses: { total: totalResponses },
    brandsCreatedOverTime: bucketByDay(brandCreatedAts.map((b) => b.createdAt)),
  };
}
