import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { generateLinkToken } from "../src/lib/linkToken";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

function daysAgo(n: number) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return { date, isoDay: date.toISOString().slice(0, 10) };
}

// Seed grows through the project's phases — this thin pass (Phase 6 of the
// plan) adds just enough real data — 1 brand, 3 branches, 1 published survey
// covering all 9 question types, ~10 responses — for the reporting API and
// frontend phases to build against. The rich, backdated, multi-brand dataset
// lands in the final polish phase.
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
    data: { email: "admin@rai.demo", passwordHash, name: "Ra'y Admin" },
  });

  console.log("Seeding brand, owner, manager...");
  const brand = await prisma.brand.create({
    data: {
      name: "Zeitoun Kitchen",
      nameAr: "مطبخ زيتون",
      description: "A modern Mediterranean restaurant chain.",
      descriptionAr: "سلسلة مطاعم متوسطية عصرية.",
    },
  });

  const owner = await prisma.brandUser.create({
    data: { brandId: brand.id, email: "owner@zeitoun.demo", passwordHash, name: "Youssef Zeitoun", role: "OWNER" },
  });

  const [branch1, branch2, branch3] = await Promise.all([
    prisma.restaurantBranch.create({
      data: {
        brandId: brand.id,
        name: "Downtown Cairo",
        nameAr: "وسط البلد",
        address: "12 Talaat Harb St",
        addressAr: "12 شارع طلعت حرب",
        city: "Cairo",
        cityAr: "القاهرة",
        phone: "+201000000001",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: brand.id,
        name: "Nasr City",
        nameAr: "مدينة نصر",
        address: "5 Abbas El Akkad St",
        addressAr: "5 شارع عباس العقاد",
        city: "Cairo",
        cityAr: "القاهرة",
        phone: "+201000000002",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: brand.id,
        name: "Alexandria Corniche",
        nameAr: "كورنيش الإسكندرية",
        address: "40 Al Corniche Rd",
        addressAr: "40 طريق الكورنيش",
        city: "Alexandria",
        cityAr: "الإسكندرية",
        phone: "+201000000003",
      },
    }),
  ]);

  const manager = await prisma.brandUser.create({
    data: {
      brandId: brand.id,
      email: "manager@zeitoun.demo",
      passwordHash,
      name: "Mona Adel",
      role: "MANAGER",
      branchAccess: { create: [{ branchId: branch1.id }, { branchId: branch2.id }] },
    },
  });

  console.log("Seeding survey (all 9 question types)...");
  const survey = await prisma.survey.create({
    data: {
      brandId: brand.id,
      title: "Post-Visit Feedback",
      titleAr: "تقييم الزيارة",
      description: "Help us improve — it only takes a minute.",
      descriptionAr: "ساعدنا في التحسين — يستغرق الأمر دقيقة واحدة فقط.",
      thankYouMessage: "Thank you for your feedback!",
      thankYouMessageAr: "شكرًا لملاحظاتك!",
      status: "PUBLISHED",
      scopeType: "ALL_BRANCHES",
      createdByUserId: owner.id,
      questions: {
        create: [
          {
            type: "RATING",
            label: "How would you rate your overall experience?",
            labelAr: "كيف تقيّم تجربتك بشكل عام؟",
            isRequired: true,
            sortOrder: 0,
            config: { max: 5, inputStyle: "stars" } as Prisma.InputJsonValue,
          },
          {
            type: "NPS",
            label: "How likely are you to recommend us to a friend?",
            labelAr: "ما مدى احتمال أن تنصح صديقًا بزيارتنا؟",
            isRequired: true,
            sortOrder: 1,
          },
          {
            type: "SINGLE_CHOICE",
            label: "What was the purpose of your visit?",
            labelAr: "ما هو الغرض من زيارتك؟",
            isRequired: true,
            sortOrder: 2,
            options: {
              create: [
                { label: "Breakfast", labelAr: "فطار", value: nanoid(8), sortOrder: 0 },
                { label: "Lunch", labelAr: "غداء", value: nanoid(8), sortOrder: 1 },
                { label: "Dinner", labelAr: "عشاء", value: nanoid(8), sortOrder: 2 },
                { label: "Late night", labelAr: "سهرة", value: nanoid(8), sortOrder: 3 },
              ],
            },
          },
          {
            type: "MULTI_CHOICE",
            label: "What did you enjoy most?",
            labelAr: "ما الذي أعجبك أكثر؟",
            isRequired: false,
            sortOrder: 3,
            options: {
              create: [
                { label: "Food quality", labelAr: "جودة الطعام", value: nanoid(8), sortOrder: 0 },
                { label: "Service", labelAr: "الخدمة", value: nanoid(8), sortOrder: 1 },
                { label: "Ambiance", labelAr: "الأجواء", value: nanoid(8), sortOrder: 2 },
                { label: "Price", labelAr: "السعر", value: nanoid(8), sortOrder: 3 },
                { label: "Cleanliness", labelAr: "النظافة", value: nanoid(8), sortOrder: 4 },
              ],
            },
          },
          {
            type: "DROPDOWN",
            label: "How often do you visit us?",
            labelAr: "كم مرة تزورنا؟",
            isRequired: true,
            sortOrder: 4,
            options: {
              create: [
                { label: "First time", labelAr: "أول مرة", value: nanoid(8), sortOrder: 0 },
                { label: "Occasionally", labelAr: "أحيانًا", value: nanoid(8), sortOrder: 1 },
                { label: "Frequently", labelAr: "كثيرًا", value: nanoid(8), sortOrder: 2 },
                { label: "Regular", labelAr: "دائم", value: nanoid(8), sortOrder: 3 },
              ],
            },
          },
          {
            type: "YES_NO",
            label: "Would you visit us again?",
            labelAr: "هل ستزورنا مرة أخرى؟",
            isRequired: true,
            sortOrder: 5,
          },
          {
            type: "SHORT_TEXT",
            label: "Any comments?",
            labelAr: "أي ملاحظات؟",
            isRequired: false,
            sortOrder: 6,
          },
          {
            type: "LONG_TEXT",
            label: "Tell us more about your experience",
            labelAr: "أخبرنا المزيد عن تجربتك",
            isRequired: false,
            sortOrder: 7,
          },
          {
            type: "DATE",
            label: "When did you visit?",
            labelAr: "متى زرتنا؟",
            isRequired: true,
            sortOrder: 8,
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });

  console.log("Seeding branch links...");
  await Promise.all(
    [branch1, branch2, branch3].map((branch) =>
      prisma.surveyBranchLink.create({ data: { surveyId: survey.id, branchId: branch.id, token: generateLinkToken() } })
    )
  );

  console.log("Seeding responses...");
  const questionByLabel = new Map(survey.questions.map((q) => [q.label, q]));
  const optionId = (questionLabel: string, optionLabel: string) => {
    const question = questionByLabel.get(questionLabel);
    const option = question?.options.find((o) => o.label === optionLabel);
    if (!option) throw new Error(`Seed data error: no option "${optionLabel}" on question "${questionLabel}"`);
    return option.id;
  };
  const qid = (label: string) => {
    const question = questionByLabel.get(label);
    if (!question) throw new Error(`Seed data error: no question "${label}"`);
    return question.id;
  };

  const RATING_Q = "How would you rate your overall experience?";
  const NPS_Q = "How likely are you to recommend us to a friend?";
  const PURPOSE_Q = "What was the purpose of your visit?";
  const ENJOYED_Q = "What did you enjoy most?";
  const FREQUENCY_Q = "How often do you visit us?";
  const AGAIN_Q = "Would you visit us again?";
  const COMMENT_Q = "Any comments?";
  const LONG_Q = "Tell us more about your experience";
  const DATE_Q = "When did you visit?";

  type ResponseSeed = {
    branchId: string;
    daysBack: number;
    rating: number;
    nps: number;
    purpose: string;
    enjoyed: string[];
    frequency: string;
    again: boolean;
    comment?: string;
    longText?: string;
  };

  const responses: ResponseSeed[] = [
    {
      branchId: branch1.id,
      daysBack: 6,
      rating: 5,
      nps: 10,
      purpose: "Dinner",
      enjoyed: ["Food quality", "Service"],
      frequency: "Regular",
      again: true,
      comment: "Amazing food and friendly staff!",
    },
    {
      branchId: branch1.id,
      daysBack: 5,
      rating: 4,
      nps: 8,
      purpose: "Lunch",
      enjoyed: ["Food quality"],
      frequency: "Frequently",
      again: true,
      longText: "Loved the grilled chicken, will definitely be back with my family.",
    },
    {
      branchId: branch1.id,
      daysBack: 5,
      rating: 3,
      nps: 6,
      purpose: "Breakfast",
      enjoyed: [],
      frequency: "Occasionally",
      again: true,
      comment: "Service was a bit slow",
    },
    {
      branchId: branch1.id,
      daysBack: 3,
      rating: 5,
      nps: 9,
      purpose: "Dinner",
      enjoyed: ["Ambiance", "Cleanliness"],
      frequency: "First time",
      again: true,
      comment: "Beautiful place!",
    },
    {
      branchId: branch2.id,
      daysBack: 4,
      rating: 2,
      nps: 3,
      purpose: "Late night",
      enjoyed: ["Price"],
      frequency: "Occasionally",
      again: false,
      comment: "Food was cold when it arrived",
      longText: "Ordered late and the food took over 40 minutes and arrived lukewarm. Disappointing experience overall.",
    },
    {
      branchId: branch2.id,
      daysBack: 2,
      rating: 4,
      nps: 7,
      purpose: "Lunch",
      enjoyed: ["Food quality", "Price"],
      frequency: "Regular",
      again: true,
    },
    {
      branchId: branch2.id,
      daysBack: 1,
      rating: 5,
      nps: 10,
      purpose: "Breakfast",
      enjoyed: ["Food quality", "Service", "Cleanliness"],
      frequency: "Frequently",
      again: true,
      comment: "Best breakfast in town",
    },
    {
      branchId: branch3.id,
      daysBack: 6,
      rating: 4,
      nps: 8,
      purpose: "Dinner",
      enjoyed: ["Ambiance"],
      frequency: "First time",
      again: true,
      longText: "Great sea view from our table, food was good too.",
    },
    {
      branchId: branch3.id,
      daysBack: 3,
      rating: 1,
      nps: 2,
      purpose: "Lunch",
      enjoyed: [],
      frequency: "Occasionally",
      again: false,
      comment: "Not worth the price",
    },
    {
      branchId: branch3.id,
      daysBack: 0,
      rating: 5,
      nps: 9,
      purpose: "Dinner",
      enjoyed: ["Food quality", "Ambiance", "Service"],
      frequency: "Regular",
      again: true,
      comment: "Consistently great every time!",
    },
  ];

  for (const r of responses) {
    const { date, isoDay } = daysAgo(r.daysBack);

    const answers: Prisma.AnswerCreateManyResponseInput[] = [
      { questionId: qid(RATING_Q), value: { rating: r.rating } },
      { questionId: qid(NPS_Q), value: { nps: r.nps } },
      { questionId: qid(PURPOSE_Q), value: { optionId: optionId(PURPOSE_Q, r.purpose) }, optionId: optionId(PURPOSE_Q, r.purpose) },
      { questionId: qid(FREQUENCY_Q), value: { optionId: optionId(FREQUENCY_Q, r.frequency) }, optionId: optionId(FREQUENCY_Q, r.frequency) },
      { questionId: qid(AGAIN_Q), value: { boolean: r.again } },
      { questionId: qid(DATE_Q), value: { date: isoDay } },
    ];
    if (r.enjoyed.length > 0) {
      answers.push({ questionId: qid(ENJOYED_Q), value: { optionIds: r.enjoyed.map((label) => optionId(ENJOYED_Q, label)) } });
    }
    if (r.comment) answers.push({ questionId: qid(COMMENT_Q), value: { text: r.comment } });
    if (r.longText) answers.push({ questionId: qid(LONG_Q), value: { text: r.longText } });

    await prisma.response.create({
      data: {
        surveyId: survey.id,
        branchId: r.branchId,
        submittedAt: date,
        userAgent: "Mozilla/5.0 (seed data)",
        answers: { createMany: { data: answers } },
      },
    });
  }

  console.log(`Seed complete.`);
  console.log(`Platform admin: ${admin.email}`);
  console.log(`Brand owner:    owner@zeitoun.demo`);
  console.log(`Brand manager:  ${manager.email} (scoped to Downtown Cairo + Nasr City)`);
  console.log(`Demo login password for all seeded accounts: ${DEMO_PASSWORD}`);
  console.log(`Seeded ${responses.length} responses across 3 branches for survey "${survey.title}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
