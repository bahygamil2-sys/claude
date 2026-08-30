import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeBranchName } from "../src/lib/branchName";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

// Mirrors branches.service.ts's ensureAlias: every branch's own current name
// is also its first alias row, so the (future) import matcher only ever has
// to check one table.
async function createBranch(brandId: string, name: string, openedAt: string) {
  const branch = await prisma.restaurantBranch.create({ data: { brandId, name, openedAt: new Date(openedAt) } });
  await prisma.branchNameAlias.create({
    data: { branchId: branch.id, brandId, rawName: name, normalizedName: normalizeBranchName(name) },
  });
  return branch;
}

// Seed grows through the project's phases (see the plan file). This pass —
// auth/users + brands/branches — creates the platform admin, the two real
// brands the actual Excel workbooks belong to (El Reem, Kufta), a real subset
// of each brand's actual branches (full import lands in the real-data-seeding
// phase), and one Editor/Viewer each so RBAC scoping has something real to
// verify against. Sales data lands in a later phase.
async function main() {
  console.log("Wiping existing data...");
  await prisma.branchNameAlias.deleteMany();
  await prisma.restaurantBranch.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userBrandAccess.deleteMany();
  await prisma.user.deleteMany();
  await prisma.brand.deleteMany();

  console.log("Hashing demo password...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("Seeding admin...");
  const admin = await prisma.user.create({
    data: { email: "admin@bsd.demo", name: "Platform Admin", passwordHash, role: "ADMIN", mustChangePassword: false },
  });

  console.log("Seeding brands...");
  const elReem = await prisma.brand.create({
    data: { name: "El Reem", nameAr: "الريم", slug: "el-reem" },
  });
  const kufta = await prisma.brand.create({
    data: { name: "Kufta", nameAr: "كفتة", slug: "kufta" },
  });

  console.log("Seeding a real subset of each brand's branches...");
  await Promise.all([
    createBranch(elReem.id, "مصر الجديدة", "2020-01-01"),
    createBranch(elReem.id, "الاهلى", "2020-01-01"),
    createBranch(elReem.id, "شيراتون", "2020-01-01"),
  ]);
  await Promise.all([
    createBranch(kufta.id, "شيراتون", "2019-01-01"),
    createBranch(kufta.id, "التجمع", "2019-01-01"),
    // Real mid-year opener from the source data — exercises "no rows before openedAt".
    createBranch(kufta.id, "مول طنطا", "2026-06-01"),
  ]);

  console.log("Seeding scoped Editor/Viewer...");
  const editor = await prisma.user.create({
    data: {
      email: "editor.elreem@bsd.demo",
      name: "El Reem Editor",
      passwordHash,
      role: "EDITOR",
      mustChangePassword: false,
      brandAccess: { create: [{ brandId: elReem.id }] },
    },
  });
  const viewer = await prisma.user.create({
    data: {
      email: "viewer.kufta@bsd.demo",
      name: "Kufta Viewer",
      passwordHash,
      role: "VIEWER",
      mustChangePassword: false,
      brandAccess: { create: [{ brandId: kufta.id }] },
    },
  });

  console.log("\nSeed complete.\n");
  console.log(`Admin:  ${admin.email} / ${DEMO_PASSWORD}`);
  console.log(`Editor: ${editor.email} / ${DEMO_PASSWORD} (scoped to El Reem)`);
  console.log(`Viewer: ${viewer.email} / ${DEMO_PASSWORD} (scoped to Kufta)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
