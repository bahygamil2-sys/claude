import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

// Seed grows through the project's phases (see the plan file). This first
// pass — auth/users foundation only — creates the platform admin and the two
// real brands the actual Excel workbooks belong to (El Reem, Kufta), plus one
// Editor/Viewer each so RBAC scoping has something real to verify against.
// Branches and sales data land in later phases.
async function main() {
  console.log("Wiping existing data...");
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
