import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

// Seed grows through the project's phases — Phase 2 seeds only the platform
// admin (enough to log in and confirm the schema works end to end). The full
// multi-brand/branch/survey/response dataset lands in the polish phase.
async function main() {
  console.log("Wiping existing data...");
  await prisma.answer.deleteMany();
  await prisma.response.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.surveyBranchLink.deleteMany();
  await prisma.surveyBranch.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.brandUserBranch.deleteMany();
  await prisma.restaurantBranch.deleteMany();
  await prisma.brandUserRefreshToken.deleteMany();
  await prisma.brandUser.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.adminRefreshToken.deleteMany();
  await prisma.platformAdmin.deleteMany();

  console.log("Hashing demo password...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("Seeding platform admin...");
  const admin = await prisma.platformAdmin.create({
    data: {
      email: "admin@rai.demo",
      passwordHash,
      name: "Ra'y Admin",
    },
  });

  console.log(`Seed complete. Platform admin: ${admin.email}`);
  console.log(`Demo login password for all seeded accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
