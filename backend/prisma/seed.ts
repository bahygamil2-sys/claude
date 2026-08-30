import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { generateLinkToken } from "../src/lib/linkToken";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

// ---------------------------------------------------------------------------
// Deterministic randomness — every `npm run db:seed` produces the same
// "random" demo data (mulberry32, fixed seed), so aggregate numbers documented
// in the README (average rating, NPS score) stay stable across reseeds.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260829);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function weightedPick<T>(weighted: ReadonlyArray<readonly [T, number]>): T {
  const total = weighted.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [item, w] of weighted) {
    if (r < w) return item;
    r -= w;
  }
  return weighted[weighted.length - 1][0];
}

function maybe(probability: number): boolean {
  return rng() < probability;
}

function dateDaysBack(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(8 + Math.floor(rng() * 14), Math.floor(rng() * 60), 0, 0); // 08:00–22:00
  return { date, isoDay: date.toISOString().slice(0, 10) };
}

// ---------------------------------------------------------------------------
// Shared realistic response shape: a 1–5 rating drives everything else
// (NPS, "would visit/order again", how much free text gets left) so the
// generated dataset tells one coherent story rather than independent noise.
// ---------------------------------------------------------------------------
const RATING_WEIGHTS = [
  [5, 40],
  [4, 33],
  [3, 13],
  [2, 8],
  [1, 6],
] as const;

// Promoter/passive share per rating tier (detractor share is the remainder).
// Tuned so the aggregate NPS score lands comfortably positive in the
// mid-20s for a ~3.9-average dataset — matching how rating and NPS actually
// correlate in real feedback (a chain rated ~4/5 reads as "well-liked", so
// its NPS shouldn't be negative).
const NPS_BAND_BY_RATING: Record<number, { promoter: number; passive: number }> = {
  5: { promoter: 0.78, passive: 0.2 },
  4: { promoter: 0.4, passive: 0.48 },
  3: { promoter: 0.08, passive: 0.57 },
  2: { promoter: 0, passive: 0.2 },
  1: { promoter: 0, passive: 0.05 },
};
const DETRACTOR_VALUE_WEIGHTS = [[6, 20], [5, 20], [4, 20], [3, 15], [2, 10], [1, 8], [0, 7]] as const;
function npsForRating(rating: number): number {
  const band = NPS_BAND_BY_RATING[rating];
  const r = rng();
  if (r < band.promoter) return maybe(0.5) ? 10 : 9;
  if (r < band.promoter + band.passive) return maybe(0.5) ? 8 : 7;
  return weightedPick(DETRACTOR_VALUE_WEIGHTS);
}

const AGAIN_PROB_BY_RATING: Record<number, number> = { 5: 0.97, 4: 0.9, 3: 0.65, 2: 0.25, 1: 0.08 };

type Comment = { en: string; ar: string };
const POSITIVE_COMMENTS: Comment[] = [
  { en: "Amazing food and friendly staff!", ar: "طعام رائع وموظفين ودودين!" },
  { en: "Best meal I've had in months.", ar: "أفضل وجبة تناولتها منذ شهور." },
  { en: "Consistently great every time!", ar: "ممتاز باستمرار في كل مرة!" },
  { en: "Loved the atmosphere and the service was quick.", ar: "أحببت الأجواء والخدمة كانت سريعة." },
  { en: "Will definitely be back with my family.", ar: "بالتأكيد هرجع تاني مع عيلتي." },
  { en: "Everything was fresh and beautifully presented.", ar: "كل حاجة كانت طازة ومقدمة بشكل جميل." },
  { en: "Staff went above and beyond, really impressed.", ar: "الموظفين بذلوا مجهود إضافي، انبهرت فعلاً." },
  { en: "Great value for the quality you get.", ar: "قيمة ممتازة مقابل الجودة اللي بتاخدها." },
  { en: "Clean, cozy, and the food was delicious.", ar: "نظيف ومريح والأكل كان لذيذ." },
  { en: "Best breakfast in town, hands down.", ar: "أفضل إفطار في المدينة من غير منازع." },
];
const NEUTRAL_COMMENTS: Comment[] = [
  { en: "Food was fine, nothing special.", ar: "الأكل كان عادي، مفيش حاجة مميزة." },
  { en: "Service was a bit slow but the meal was good.", ar: "الخدمة كانت شوية بطيئة بس الأكل كان كويس." },
  { en: "Decent experience overall, might come back.", ar: "تجربة مقبولة بشكل عام، ممكن أرجع." },
  { en: "It's okay for the price, could be better.", ar: "مقبول بالنسبة للسعر، ممكن يتحسن." },
  { en: "Average visit, staff were polite though.", ar: "زيارة عادية، بس الموظفين كانوا مهذبين." },
  { en: "Some dishes were great, others just okay.", ar: "بعض الأطباق كانت رائعة والباقي عادي." },
];
const NEGATIVE_COMMENTS: Comment[] = [
  { en: "Food was cold when it arrived.", ar: "الأكل وصل بارد." },
  { en: "Waited far too long to be seated.", ar: "استنيت وقت طويل جدًا عشان أقعد." },
  { en: "Not worth the price, honestly.", ar: "بصراحة مش يستاهل السعر." },
  { en: "Order came out wrong and no one apologized.", ar: "الطلب جه غلط وحد ما اعتذرش." },
  { en: "Disappointing compared to last time.", ar: "محبط بالمقارنة بالمرة اللي فاتت." },
  { en: "Too noisy and the table was sticky.", ar: "زحمة ودوشة والترابيزة كانت مش نضيفة." },
];
const LONG_POSITIVE: string[] = [
  "Loved the grilled chicken, will definitely be back with my family. The staff remembered our order from last time which was a nice touch.",
  "Great sea view from our table, food was good too. Perfect spot for a relaxed evening with friends.",
  "We celebrated a birthday here and the team made it really special without us even asking in advance.",
];
const LONG_NEGATIVE: string[] = [
  "Ordered late and the food took over 40 minutes and arrived lukewarm. Disappointing experience overall, expected better given the price point.",
  "The place was clearly understaffed on a weekend night — long wait for menus, then for the food, then for the check.",
];
function pickComment(rating: number): string {
  const pool = rating >= 4 ? POSITIVE_COMMENTS : rating === 3 ? NEUTRAL_COMMENTS : NEGATIVE_COMMENTS;
  const c = pick(pool);
  return maybe(0.55) ? c.ar : c.en;
}
function pickLongText(rating: number): string {
  return rating >= 4 ? pick(LONG_POSITIVE) : pick(LONG_NEGATIVE);
}

// ---------------------------------------------------------------------------

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

  // ==========================================================================
  // Brand 1: Zeitoun Kitchen — Mediterranean chain, 6 branches across
  // Cairo/Giza/Alexandria
  // ==========================================================================
  console.log("Seeding Zeitoun Kitchen...");
  const zeitoun = await prisma.brand.create({
    data: {
      name: "Zeitoun Kitchen",
      nameAr: "مطبخ زيتون",
      description: "A modern Mediterranean restaurant chain.",
      descriptionAr: "سلسلة مطاعم متوسطية عصرية.",
    },
  });

  const zeitounOwner = await prisma.brandUser.create({
    data: { brandId: zeitoun.id, email: "owner@zeitoun.demo", passwordHash, name: "Youssef Zeitoun", role: "OWNER" },
  });

  const [zDowntown, zNasrCity, zAlexCorniche, zMaadi, zOctober, zNewCairo] = await Promise.all([
    prisma.restaurantBranch.create({
      data: {
        brandId: zeitoun.id,
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
        brandId: zeitoun.id,
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
        brandId: zeitoun.id,
        name: "Alexandria Corniche",
        nameAr: "كورنيش الإسكندرية",
        address: "40 Al Corniche Rd",
        addressAr: "40 طريق الكورنيش",
        city: "Alexandria",
        cityAr: "الإسكندرية",
        phone: "+201000000003",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: zeitoun.id,
        name: "Maadi",
        nameAr: "المعادي",
        address: "9 Road 9",
        addressAr: "9 شارع 9",
        city: "Cairo",
        cityAr: "القاهرة",
        phone: "+201000000004",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: zeitoun.id,
        name: "6th of October",
        nameAr: "السادس من أكتوبر",
        address: "Central Axis, Sector 3",
        addressAr: "المحور المركزي، القطاع 3",
        city: "Giza",
        cityAr: "الجيزة",
        phone: "+201000000005",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: zeitoun.id,
        name: "New Cairo",
        nameAr: "القاهرة الجديدة",
        address: "90th Street, Fifth Settlement",
        addressAr: "شارع التسعين، التجمع الخامس",
        city: "Cairo",
        cityAr: "القاهرة",
        phone: "+201000000006",
      },
    }),
  ]);
  const zeitounBranches = [zDowntown, zNasrCity, zAlexCorniche, zMaadi, zOctober, zNewCairo];

  const zeitounManager = await prisma.brandUser.create({
    data: {
      brandId: zeitoun.id,
      email: "manager@zeitoun.demo",
      passwordHash,
      name: "Mona Adel",
      role: "MANAGER",
      branchAccess: { create: [{ branchId: zDowntown.id }, { branchId: zNasrCity.id }] },
    },
  });

  console.log("Seeding Zeitoun surveys...");

  // --- Flagship: Post-Visit Feedback (PUBLISHED, ALL_BRANCHES, all 9 types) ---
  const postVisit = await prisma.survey.create({
    data: {
      brandId: zeitoun.id,
      title: "Post-Visit Feedback",
      titleAr: "تقييم الزيارة",
      description: "Help us improve — it only takes a minute.",
      descriptionAr: "ساعدنا في التحسين — يستغرق الأمر دقيقة واحدة فقط.",
      thankYouMessage: "Thank you for your feedback!",
      thankYouMessageAr: "شكرًا لملاحظاتك!",
      status: "PUBLISHED",
      scopeType: "ALL_BRANCHES",
      createdByUserId: zeitounOwner.id,
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
          { type: "SHORT_TEXT", label: "Any comments?", labelAr: "أي ملاحظات؟", isRequired: false, sortOrder: 6 },
          {
            type: "LONG_TEXT",
            label: "Tell us more about your experience",
            labelAr: "أخبرنا المزيد عن تجربتك",
            isRequired: false,
            sortOrder: 7,
          },
          { type: "DATE", label: "When did you visit?", labelAr: "متى زرتنا؟", isRequired: true, sortOrder: 8 },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });

  // --- Draft: Loyalty Program Interest (DRAFT, ALL_BRANCHES, no responses) ---
  await prisma.survey.create({
    data: {
      brandId: zeitoun.id,
      title: "Loyalty Program Interest",
      titleAr: "الاهتمام ببرنامج الولاء",
      description: "We're exploring a rewards program and want your input.",
      descriptionAr: "بنفكر في برنامج مكافآت وحابين نعرف رأيك.",
      status: "DRAFT",
      scopeType: "ALL_BRANCHES",
      createdByUserId: zeitounOwner.id,
      questions: {
        create: [
          {
            type: "SINGLE_CHOICE",
            label: "How interested are you in a loyalty rewards program?",
            labelAr: "ما مدى اهتمامك ببرنامج مكافآت الولاء؟",
            isRequired: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Very interested", labelAr: "مهتم جدًا", value: nanoid(8), sortOrder: 0 },
                { label: "Somewhat interested", labelAr: "مهتم إلى حد ما", value: nanoid(8), sortOrder: 1 },
                { label: "Not interested", labelAr: "غير مهتم", value: nanoid(8), sortOrder: 2 },
              ],
            },
          },
          {
            type: "MULTI_CHOICE",
            label: "Which perks would matter most to you?",
            labelAr: "ما هي المزايا الأهم بالنسبة لك؟",
            isRequired: false,
            sortOrder: 1,
            options: {
              create: [
                { label: "Points on every visit", labelAr: "نقاط في كل زيارة", value: nanoid(8), sortOrder: 0 },
                { label: "Birthday rewards", labelAr: "مكافآت عيد الميلاد", value: nanoid(8), sortOrder: 1 },
                { label: "Early access to new items", labelAr: "وصول مبكر للأصناف الجديدة", value: nanoid(8), sortOrder: 2 },
                { label: "Exclusive events", labelAr: "فعاليات حصرية", value: nanoid(8), sortOrder: 3 },
              ],
            },
          },
          {
            type: "SHORT_TEXT",
            label: "Anything else you'd like to see in a loyalty program?",
            labelAr: "أي شيء آخر تود رؤيته في برنامج الولاء؟",
            isRequired: false,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // --- Closed: Summer Menu Tasting (CLOSED, SPECIFIC_BRANCHES) ---
  const summerMenu = await prisma.survey.create({
    data: {
      brandId: zeitoun.id,
      title: "Summer Menu Tasting",
      titleAr: "تذوق قائمة الصيف",
      description: "A short trial run of our summer specials at two branches.",
      descriptionAr: "تجربة قصيرة لأصناف الصيف الجديدة في فرعين.",
      status: "CLOSED",
      scopeType: "SPECIFIC_BRANCHES",
      createdByUserId: zeitounOwner.id,
      branchScopes: { create: [{ branchId: zDowntown.id }, { branchId: zAlexCorniche.id }] },
      questions: {
        create: [
          {
            type: "RATING",
            label: "How would you rate the summer menu items you tried?",
            labelAr: "كيف تقيّم أصناف قائمة الصيف التي جربتها؟",
            isRequired: true,
            sortOrder: 0,
            config: { max: 5, inputStyle: "stars" } as Prisma.InputJsonValue,
          },
          {
            type: "SINGLE_CHOICE",
            label: "Which new dish was your favorite?",
            labelAr: "ما هو طبقك المفضل الجديد؟",
            isRequired: true,
            sortOrder: 1,
            options: {
              create: [
                { label: "Grilled Halloumi Salad", labelAr: "سلطة الحلوم المشوي", value: nanoid(8), sortOrder: 0 },
                { label: "Watermelon Feta Salad", labelAr: "سلطة البطيخ والفيتا", value: nanoid(8), sortOrder: 1 },
                { label: "Lemon Sorbet", labelAr: "شربات الليمون", value: nanoid(8), sortOrder: 2 },
                { label: "Iced Hibiscus Tea", labelAr: "كركديه مثلج", value: nanoid(8), sortOrder: 3 },
              ],
            },
          },
          {
            type: "YES_NO",
            label: "Would you like to see these items on the regular menu?",
            labelAr: "هل تحب أن ترى هذه الأصناف في القائمة الدائمة؟",
            isRequired: true,
            sortOrder: 2,
          },
          {
            type: "SHORT_TEXT",
            label: "Any feedback on the summer menu?",
            labelAr: "أي ملاحظات عن قائمة الصيف؟",
            isRequired: false,
            sortOrder: 3,
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });

  // ==========================================================================
  // Brand 2: Qishta Café — breakfast/coffee chain, 4 branches, no manager
  // (demonstrates the platform works fine for an Owner-only brand)
  // ==========================================================================
  console.log("Seeding Qishta Café...");
  const qishta = await prisma.brand.create({
    data: {
      name: "Qishta Café",
      nameAr: "كافيه قشطة",
      description: "All-day Egyptian breakfast and specialty coffee.",
      descriptionAr: "إفطار مصري طوال اليوم وقهوة مختصة.",
    },
  });

  const qishtaOwner = await prisma.brandUser.create({
    data: { brandId: qishta.id, email: "owner@qishta.demo", passwordHash, name: "Laila Fahmy", role: "OWNER" },
  });

  const [qZamalek, qHeliopolis, qSheikhZayed, qMansoura] = await Promise.all([
    prisma.restaurantBranch.create({
      data: {
        brandId: qishta.id,
        name: "Zamalek",
        nameAr: "الزمالك",
        address: "26th of July St",
        addressAr: "شارع 26 يوليو",
        city: "Cairo",
        cityAr: "القاهرة",
        phone: "+201000000011",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: qishta.id,
        name: "Heliopolis",
        nameAr: "مصر الجديدة",
        address: "Baghdad St",
        addressAr: "شارع بغداد",
        city: "Cairo",
        cityAr: "القاهرة",
        phone: "+201000000012",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: qishta.id,
        name: "Sheikh Zayed",
        nameAr: "الشيخ زايد",
        address: "Beverly Hills Mall",
        addressAr: "مول بيفرلي هيلز",
        city: "Giza",
        cityAr: "الجيزة",
        phone: "+201000000013",
      },
    }),
    prisma.restaurantBranch.create({
      data: {
        brandId: qishta.id,
        name: "Mansoura",
        nameAr: "المنصورة",
        address: "El Gomhoria St",
        addressAr: "شارع الجمهورية",
        city: "Mansoura",
        cityAr: "المنصورة",
        phone: "+201000000014",
      },
    }),
  ]);
  const qishtaBranches = [qZamalek, qHeliopolis, qSheikhZayed, qMansoura];

  console.log("Seeding Qishta surveys...");

  // --- Flagship: Breakfast Experience Survey (PUBLISHED, ALL_BRANCHES) ---
  const breakfastSurvey = await prisma.survey.create({
    data: {
      brandId: qishta.id,
      title: "Breakfast Experience Survey",
      titleAr: "استبيان تجربة الإفطار",
      description: "Two minutes to help us serve you better.",
      descriptionAr: "دقيقتين تساعدنا نخدمك أحسن.",
      thankYouMessage: "Thanks for your time — see you again soon!",
      thankYouMessageAr: "شكرًا لوقتك — نشوفك قريب!",
      status: "PUBLISHED",
      scopeType: "ALL_BRANCHES",
      createdByUserId: qishtaOwner.id,
      questions: {
        create: [
          {
            type: "RATING",
            label: "How would you rate your breakfast experience?",
            labelAr: "كيف تقيّم تجربة الإفطار لديك؟",
            isRequired: true,
            sortOrder: 0,
            config: { max: 5, inputStyle: "stars" } as Prisma.InputJsonValue,
          },
          {
            type: "SINGLE_CHOICE",
            label: "What did you order?",
            labelAr: "ماذا طلبت؟",
            isRequired: true,
            sortOrder: 1,
            options: {
              create: [
                { label: "Fetir", labelAr: "فطير", value: nanoid(8), sortOrder: 0 },
                { label: "Kunafa & Qishta", labelAr: "كنافة وقشطة", value: nanoid(8), sortOrder: 1 },
                { label: "Coffee & Croissant", labelAr: "قهوة وكرواسون", value: nanoid(8), sortOrder: 2 },
                { label: "Full Egyptian Breakfast", labelAr: "إفطار مصري كامل", value: nanoid(8), sortOrder: 3 },
              ],
            },
          },
          {
            type: "MULTI_CHOICE",
            label: "What would you like to see more of?",
            labelAr: "ما الذي تود رؤيته أكثر؟",
            isRequired: false,
            sortOrder: 2,
            options: {
              create: [
                { label: "More seating", labelAr: "مقاعد أكثر", value: nanoid(8), sortOrder: 0 },
                { label: "Faster service", labelAr: "خدمة أسرع", value: nanoid(8), sortOrder: 1 },
                { label: "More vegan options", labelAr: "خيارات نباتية أكثر", value: nanoid(8), sortOrder: 2 },
                { label: "Later hours", labelAr: "مواعيد أطول", value: nanoid(8), sortOrder: 3 },
                { label: "Outdoor seating", labelAr: "جلسات خارجية", value: nanoid(8), sortOrder: 4 },
              ],
            },
          },
          {
            type: "YES_NO",
            label: "Was your order ready on time?",
            labelAr: "هل كان طلبك جاهزًا في الوقت المحدد؟",
            isRequired: true,
            sortOrder: 3,
          },
          {
            type: "NPS",
            label: "How likely are you to recommend Qishta Café to a friend?",
            labelAr: "ما مدى احتمال أن تنصح صديقًا بزيارة كافيه قشطة؟",
            isRequired: true,
            sortOrder: 4,
          },
          { type: "SHORT_TEXT", label: "Any feedback for us?", labelAr: "أي ملاحظات لنا؟", isRequired: false, sortOrder: 5 },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });

  // --- Closed: Ramadan Suhoor Menu Feedback (CLOSED, SPECIFIC_BRANCHES) ---
  const suhoorSurvey = await prisma.survey.create({
    data: {
      brandId: qishta.id,
      title: "Ramadan Suhoor Menu Feedback",
      titleAr: "ملاحظات قائمة السحور في رمضان",
      status: "CLOSED",
      scopeType: "SPECIFIC_BRANCHES",
      createdByUserId: qishtaOwner.id,
      branchScopes: { create: [{ branchId: qZamalek.id }, { branchId: qHeliopolis.id }] },
      questions: {
        create: [
          {
            type: "RATING",
            label: "How would you rate our Suhoor menu?",
            labelAr: "كيف تقيّم قائمة السحور لدينا؟",
            isRequired: true,
            sortOrder: 0,
            config: { max: 5, inputStyle: "stars" } as Prisma.InputJsonValue,
          },
          {
            type: "SINGLE_CHOICE",
            label: "What did you order most?",
            labelAr: "ماذا طلبت في الأغلب؟",
            isRequired: true,
            sortOrder: 1,
            options: {
              create: [
                { label: "Fatteh", labelAr: "فتة", value: nanoid(8), sortOrder: 0 },
                { label: "Qatayef", labelAr: "قطايف", value: nanoid(8), sortOrder: 1 },
                { label: "Cheese Fetir", labelAr: "فطير بالجبنة", value: nanoid(8), sortOrder: 2 },
                { label: "Beans and Falafel", labelAr: "فول وفلافل", value: nanoid(8), sortOrder: 3 },
              ],
            },
          },
          {
            type: "SHORT_TEXT",
            label: "Any comments about Suhoor service hours?",
            labelAr: "أي ملاحظات عن مواعيد خدمة السحور؟",
            isRequired: false,
            sortOrder: 2,
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });

  // ==========================================================================
  // Links — pre-created for every eligible branch (mirrors the API's own
  // get-or-create scoping: all active branches for ALL_BRANCHES, only the
  // scoped subset for SPECIFIC_BRANCHES) so the QR/links page is populated
  // the moment a demo user opens it.
  // ==========================================================================
  console.log("Seeding branch links...");
  async function createLinks(surveyId: string, branches: { id: string }[]) {
    await Promise.all(
      branches.map((branch) => prisma.surveyBranchLink.create({ data: { surveyId, branchId: branch.id, token: generateLinkToken() } }))
    );
  }
  await createLinks(postVisit.id, zeitounBranches);
  await createLinks(summerMenu.id, [zDowntown, zAlexCorniche]);
  await createLinks(breakfastSurvey.id, qishtaBranches);
  await createLinks(suhoorSurvey.id, [qZamalek, qHeliopolis]);

  // ==========================================================================
  // Responses
  // ==========================================================================

  function questionLookup(survey: { questions: { id: string; label: string; options: { id: string; label: string }[] }[] }) {
    const byLabel = new Map(survey.questions.map((q) => [q.label, q]));
    return {
      qid: (label: string) => {
        const q = byLabel.get(label);
        if (!q) throw new Error(`Seed data error: no question "${label}"`);
        return q.id;
      },
      optionId: (questionLabel: string, optionLabel: string) => {
        const q = byLabel.get(questionLabel);
        const option = q?.options.find((o) => o.label === optionLabel);
        if (!option) throw new Error(`Seed data error: no option "${optionLabel}" on question "${questionLabel}"`);
        return option.id;
      },
    };
  }

  // --- Zeitoun flagship: 135 responses over 90 days, weighted across 6 branches ---
  console.log("Seeding Post-Visit Feedback responses...");
  const { qid: pvQid, optionId: pvOptionId } = questionLookup(postVisit);
  const RATING_Q = "How would you rate your overall experience?";
  const NPS_Q = "How likely are you to recommend us to a friend?";
  const PURPOSE_Q = "What was the purpose of your visit?";
  const ENJOYED_Q = "What did you enjoy most?";
  const FREQUENCY_Q = "How often do you visit us?";
  const AGAIN_Q = "Would you visit us again?";
  const COMMENT_Q = "Any comments?";
  const LONG_Q = "Tell us more about your experience";
  const DATE_Q = "When did you visit?";

  const ZEITOUN_BRANCH_WEIGHTS = [
    [zDowntown, 25],
    [zNasrCity, 20],
    [zAlexCorniche, 15],
    [zMaadi, 15],
    [zOctober, 15],
    [zNewCairo, 10],
  ] as const;
  const PURPOSE_WEIGHTS = [
    ["Dinner", 35],
    ["Lunch", 30],
    ["Breakfast", 20],
    ["Late night", 15],
  ] as const;
  const FREQUENCY_WEIGHTS = [
    ["Regular", 30],
    ["Occasionally", 30],
    ["First time", 25],
    ["Frequently", 15],
  ] as const;
  const ENJOYED_POOL = ["Food quality", "Service", "Ambiance", "Price", "Cleanliness"];
  function enjoyedForRating(rating: number): string[] {
    const chance = { 5: 0.55, 4: 0.4, 3: 0.25, 2: 0.15, 1: 0.1 }[rating] ?? 0.2;
    return ENJOYED_POOL.filter(() => maybe(chance));
  }

  await Promise.all(
    Array.from({ length: 135 }, async () => {
      const rating = weightedPick(RATING_WEIGHTS);
      const branch = weightedPick(ZEITOUN_BRANCH_WEIGHTS);
      const { date, isoDay } = dateDaysBack(Math.floor(rng() * 90));
      const purpose = weightedPick(PURPOSE_WEIGHTS);
      const frequency = weightedPick(FREQUENCY_WEIGHTS);
      const enjoyed = enjoyedForRating(rating);

      const answers: Prisma.AnswerCreateManyResponseInput[] = [
        { questionId: pvQid(RATING_Q), value: { rating } },
        { questionId: pvQid(NPS_Q), value: { nps: npsForRating(rating) } },
        { questionId: pvQid(PURPOSE_Q), value: { optionId: pvOptionId(PURPOSE_Q, purpose) }, optionId: pvOptionId(PURPOSE_Q, purpose) },
        {
          questionId: pvQid(FREQUENCY_Q),
          value: { optionId: pvOptionId(FREQUENCY_Q, frequency) },
          optionId: pvOptionId(FREQUENCY_Q, frequency),
        },
        { questionId: pvQid(AGAIN_Q), value: { boolean: maybe(AGAIN_PROB_BY_RATING[rating]) } },
        { questionId: pvQid(DATE_Q), value: { date: isoDay } },
      ];
      if (enjoyed.length > 0) {
        answers.push({ questionId: pvQid(ENJOYED_Q), value: { optionIds: enjoyed.map((label) => pvOptionId(ENJOYED_Q, label)) } });
      }
      if (maybe(0.5)) answers.push({ questionId: pvQid(COMMENT_Q), value: { text: pickComment(rating) } });
      if (maybe(0.15)) answers.push({ questionId: pvQid(LONG_Q), value: { text: pickLongText(rating) } });

      await prisma.response.create({
        data: {
          surveyId: postVisit.id,
          branchId: branch.id,
          submittedAt: date,
          userAgent: "Mozilla/5.0 (seed data)",
          answers: { createMany: { data: answers } },
        },
      });
    })
  );

  // --- Zeitoun Summer Menu Tasting: 16 hand-crafted responses, older/closed ---
  console.log("Seeding Summer Menu Tasting responses...");
  const { qid: smQid, optionId: smOptionId } = questionLookup(summerMenu);
  const SM_RATING_Q = "How would you rate the summer menu items you tried?";
  const SM_DISH_Q = "Which new dish was your favorite?";
  const SM_REGULAR_Q = "Would you like to see these items on the regular menu?";
  const SM_COMMENT_Q = "Any feedback on the summer menu?";
  const SUMMER_DISHES = ["Grilled Halloumi Salad", "Watermelon Feta Salad", "Lemon Sorbet", "Iced Hibiscus Tea"];
  const SUMMER_BRANCHES = [zDowntown, zAlexCorniche];

  await Promise.all(
    Array.from({ length: 16 }, async () => {
      const rating = weightedPick(RATING_WEIGHTS);
      const dish = pick(SUMMER_DISHES);
      const { date } = dateDaysBack(150 + Math.floor(rng() * 40));
      const answers: Prisma.AnswerCreateManyResponseInput[] = [
        { questionId: smQid(SM_RATING_Q), value: { rating } },
        { questionId: smQid(SM_DISH_Q), value: { optionId: smOptionId(SM_DISH_Q, dish) }, optionId: smOptionId(SM_DISH_Q, dish) },
        { questionId: smQid(SM_REGULAR_Q), value: { boolean: maybe(AGAIN_PROB_BY_RATING[rating]) } },
      ];
      if (maybe(0.4)) answers.push({ questionId: smQid(SM_COMMENT_Q), value: { text: pickComment(rating) } });

      await prisma.response.create({
        data: {
          surveyId: summerMenu.id,
          branchId: pick(SUMMER_BRANCHES).id,
          submittedAt: date,
          userAgent: "Mozilla/5.0 (seed data)",
          answers: { createMany: { data: answers } },
        },
      });
    })
  );

  // --- Qishta flagship: 105 responses over 60 days, weighted across 4 branches ---
  console.log("Seeding Breakfast Experience Survey responses...");
  const { qid: bfQid, optionId: bfOptionId } = questionLookup(breakfastSurvey);
  const BF_RATING_Q = "How would you rate your breakfast experience?";
  const BF_ORDER_Q = "What did you order?";
  const BF_MOREOF_Q = "What would you like to see more of?";
  const BF_ONTIME_Q = "Was your order ready on time?";
  const BF_NPS_Q = "How likely are you to recommend Qishta Café to a friend?";
  const BF_COMMENT_Q = "Any feedback for us?";

  const QISHTA_BRANCH_WEIGHTS = [
    [qZamalek, 35],
    [qHeliopolis, 30],
    [qSheikhZayed, 20],
    [qMansoura, 15],
  ] as const;
  const ORDER_WEIGHTS = [
    ["Full Egyptian Breakfast", 30],
    ["Fetir", 25],
    ["Coffee & Croissant", 25],
    ["Kunafa & Qishta", 20],
  ] as const;
  const MOREOF_POOL = ["More seating", "Faster service", "More vegan options", "Later hours", "Outdoor seating"];
  function moreOfForRating(rating: number): string[] {
    const chance = { 5: 0.2, 4: 0.3, 3: 0.35, 2: 0.4, 1: 0.45 }[rating] ?? 0.3;
    return MOREOF_POOL.filter(() => maybe(chance));
  }
  const ONTIME_PROB_BY_RATING: Record<number, number> = { 5: 0.95, 4: 0.85, 3: 0.6, 2: 0.35, 1: 0.15 };

  await Promise.all(
    Array.from({ length: 105 }, async () => {
      const rating = weightedPick(RATING_WEIGHTS);
      const branch = weightedPick(QISHTA_BRANCH_WEIGHTS);
      const { date } = dateDaysBack(Math.floor(rng() * 60));
      const order = weightedPick(ORDER_WEIGHTS);
      const moreOf = moreOfForRating(rating);

      const answers: Prisma.AnswerCreateManyResponseInput[] = [
        { questionId: bfQid(BF_RATING_Q), value: { rating } },
        { questionId: bfQid(BF_ORDER_Q), value: { optionId: bfOptionId(BF_ORDER_Q, order) }, optionId: bfOptionId(BF_ORDER_Q, order) },
        { questionId: bfQid(BF_ONTIME_Q), value: { boolean: maybe(ONTIME_PROB_BY_RATING[rating]) } },
        { questionId: bfQid(BF_NPS_Q), value: { nps: npsForRating(rating) } },
      ];
      if (moreOf.length > 0) {
        answers.push({ questionId: bfQid(BF_MOREOF_Q), value: { optionIds: moreOf.map((label) => bfOptionId(BF_MOREOF_Q, label)) } });
      }
      if (maybe(0.45)) answers.push({ questionId: bfQid(BF_COMMENT_Q), value: { text: pickComment(rating) } });

      await prisma.response.create({
        data: {
          surveyId: breakfastSurvey.id,
          branchId: branch.id,
          submittedAt: date,
          userAgent: "Mozilla/5.0 (seed data)",
          answers: { createMany: { data: answers } },
        },
      });
    })
  );

  // --- Qishta Ramadan Suhoor: 12 hand-crafted responses, older/closed ---
  console.log("Seeding Ramadan Suhoor Menu Feedback responses...");
  const { qid: suQid, optionId: suOptionId } = questionLookup(suhoorSurvey);
  const SU_RATING_Q = "How would you rate our Suhoor menu?";
  const SU_ORDER_Q = "What did you order most?";
  const SU_COMMENT_Q = "Any comments about Suhoor service hours?";
  const SUHOOR_ITEMS = ["Fatteh", "Qatayef", "Cheese Fetir", "Beans and Falafel"];
  const SUHOOR_BRANCHES = [qZamalek, qHeliopolis];

  await Promise.all(
    Array.from({ length: 12 }, async () => {
      const rating = weightedPick(RATING_WEIGHTS);
      const { date } = dateDaysBack(200 + Math.floor(rng() * 30));
      const order = pick(SUHOOR_ITEMS);
      const answers: Prisma.AnswerCreateManyResponseInput[] = [
        { questionId: suQid(SU_RATING_Q), value: { rating } },
        { questionId: suQid(SU_ORDER_Q), value: { optionId: suOptionId(SU_ORDER_Q, order) }, optionId: suOptionId(SU_ORDER_Q, order) },
      ];
      if (maybe(0.35)) answers.push({ questionId: suQid(SU_COMMENT_Q), value: { text: pickComment(rating) } });

      await prisma.response.create({
        data: {
          surveyId: suhoorSurvey.id,
          branchId: pick(SUHOOR_BRANCHES).id,
          submittedAt: date,
          userAgent: "Mozilla/5.0 (seed data)",
          answers: { createMany: { data: answers } },
        },
      });
    })
  );

  // ==========================================================================
  // Summary
  // ==========================================================================
  const [postVisitCount, summerCount, breakfastCount, suhoorCount] = await Promise.all([
    prisma.response.count({ where: { surveyId: postVisit.id } }),
    prisma.response.count({ where: { surveyId: summerMenu.id } }),
    prisma.response.count({ where: { surveyId: breakfastSurvey.id } }),
    prisma.response.count({ where: { surveyId: suhoorSurvey.id } }),
  ]);

  console.log("\nSeed complete.\n");
  console.log(`Platform admin:  ${admin.email} / ${DEMO_PASSWORD}`);
  console.log(`\nZeitoun Kitchen (${zeitounBranches.length} branches):`);
  console.log(`  Owner:   ${zeitounOwner.email} / ${DEMO_PASSWORD}`);
  console.log(`  Manager: ${zeitounManager.email} / ${DEMO_PASSWORD} (scoped to Downtown Cairo + Nasr City)`);
  console.log(`  Post-Visit Feedback (PUBLISHED, all branches): ${postVisitCount} responses`);
  console.log(`  Loyalty Program Interest (DRAFT): 0 responses`);
  console.log(`  Summer Menu Tasting (CLOSED, Downtown Cairo + Alexandria Corniche): ${summerCount} responses`);
  console.log(`\nQishta Café (${qishtaBranches.length} branches):`);
  console.log(`  Owner: ${qishtaOwner.email} / ${DEMO_PASSWORD}`);
  console.log(`  Breakfast Experience Survey (PUBLISHED, all branches): ${breakfastCount} responses`);
  console.log(`  Ramadan Suhoor Menu Feedback (CLOSED, Zamalek + Heliopolis): ${suhoorCount} responses`);
  console.log(`\nTotal responses seeded: ${postVisitCount + summerCount + breakfastCount + suhoorCount}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
