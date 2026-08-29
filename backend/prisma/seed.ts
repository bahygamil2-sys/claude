import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus, Role, VehicleType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Cairo: { lat: 30.0444, lng: 31.2357 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Riyadh: { lat: 24.7136, lng: 46.6753 },
};

function jitter(center: { lat: number; lng: number }, maxDeltaDeg = 0.035) {
  return {
    lat: center.lat + (Math.random() * 2 - 1) * maxDeltaDeg,
    lng: center.lng + (Math.random() * 2 - 1) * maxDeltaDeg,
  };
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function bearingDegrees(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ---------- Static catalog data ----------

const CATEGORY_DEFS = [
  { slug: "pizza", name: "Pizza", nameAr: "بيتزا", icon: "🍕" },
  { slug: "burgers", name: "Burgers", nameAr: "برجر", icon: "🍔" },
  { slug: "asian", name: "Asian", nameAr: "آسيوي", icon: "🍱" },
  { slug: "desserts", name: "Desserts", nameAr: "حلويات", icon: "🍰" },
  { slug: "cafe-drinks", name: "Cafe & Drinks", nameAr: "مشروبات وكافيه", icon: "☕" },
  { slug: "breakfast", name: "Breakfast", nameAr: "فطور", icon: "🍳" },
  { slug: "healthy", name: "Healthy", nameAr: "أكل صحي", icon: "🥗" },
  { slug: "grills", name: "Shawarma & Grills", nameAr: "شاورما ومشويات", icon: "🌯" },
] as const;

type MenuItemSeed = {
  name: string;
  nameAr: string;
  price: number;
  isVegetarian?: boolean;
  sizeOptions?: { name: string; nameAr: string; priceDelta: number }[];
  spiceOptions?: boolean;
};

type MenuSectionSeed = {
  name: string;
  nameAr: string;
  items: MenuItemSeed[];
};

const SIZE_OPTIONS = [
  { name: "Small", nameAr: "صغير", priceDelta: 0 },
  { name: "Medium", nameAr: "وسط", priceDelta: 20 },
  { name: "Large", nameAr: "كبير", priceDelta: 35 },
];

const MENU_TEMPLATES: Record<string, MenuSectionSeed[]> = {
  pizza: [
    {
      name: "Pizza",
      nameAr: "بيتزا",
      items: [
        { name: "Margherita Pizza", nameAr: "بيتزا مارجريتا", price: 95, sizeOptions: SIZE_OPTIONS },
        { name: "Pepperoni Pizza", nameAr: "بيتزا ببروني", price: 110, sizeOptions: SIZE_OPTIONS },
        { name: "Four Cheese Pizza", nameAr: "بيتزا أربع أجبان", price: 120, sizeOptions: SIZE_OPTIONS },
        { name: "Vegetable Pizza", nameAr: "بيتزا خضار", price: 90, isVegetarian: true },
        { name: "BBQ Chicken Pizza", nameAr: "بيتزا دجاج باربكيو", price: 115 },
      ],
    },
    {
      name: "Sides",
      nameAr: "أطباق جانبية",
      items: [
        { name: "Garlic Bread", nameAr: "خبز بالثوم", price: 35, isVegetarian: true },
        { name: "Cheese Fries", nameAr: "بطاطس بالجبنة", price: 40, isVegetarian: true },
        { name: "Chicken Wings", nameAr: "أجنحة دجاج", price: 55 },
      ],
    },
    {
      name: "Drinks",
      nameAr: "مشروبات",
      items: [
        { name: "Soft Drink", nameAr: "مشروب غازي", price: 15, isVegetarian: true },
        { name: "Iced Tea", nameAr: "شاي مثلج", price: 18, isVegetarian: true },
      ],
    },
  ],
  burgers: [
    {
      name: "Burgers",
      nameAr: "برجر",
      items: [
        { name: "Classic Beef Burger", nameAr: "برجر لحم كلاسيك", price: 85 },
        { name: "Cheese Burger", nameAr: "تشيز برجر", price: 95 },
        { name: "Double Smash Burger", nameAr: "دبل سماش برجر", price: 120 },
        { name: "Chicken Burger", nameAr: "برجر دجاج", price: 80 },
        { name: "Veggie Burger", nameAr: "برجر خضار", price: 75, isVegetarian: true },
      ],
    },
    {
      name: "Sides",
      nameAr: "أطباق جانبية",
      items: [
        { name: "French Fries", nameAr: "بطاطس مقلية", price: 30, isVegetarian: true },
        { name: "Onion Rings", nameAr: "حلقات بصل", price: 35, isVegetarian: true },
        { name: "Coleslaw", nameAr: "سلطة كول سلو", price: 20, isVegetarian: true },
      ],
    },
    {
      name: "Drinks",
      nameAr: "مشروبات",
      items: [
        { name: "Milkshake", nameAr: "ميلك شيك", price: 45, isVegetarian: true },
        { name: "Soft Drink", nameAr: "مشروب غازي", price: 15, isVegetarian: true },
      ],
    },
  ],
  asian: [
    {
      name: "Sushi",
      nameAr: "سوشي",
      items: [
        { name: "California Roll", nameAr: "كاليفورنيا رول", price: 75 },
        { name: "Salmon Nigiri (6pc)", nameAr: "نيجيري سالمون", price: 90 },
        { name: "Dragon Roll", nameAr: "دراجون رول", price: 100 },
      ],
    },
    {
      name: "Noodles & Rice",
      nameAr: "نودلز وأرز",
      items: [
        { name: "Chicken Fried Rice", nameAr: "أرز مقلي بالدجاج", price: 65 },
        { name: "Beef Noodles", nameAr: "نودلز باللحم", price: 75 },
        { name: "Vegetable Spring Rolls", nameAr: "سبرينج رول خضار", price: 40, isVegetarian: true },
      ],
    },
    {
      name: "Drinks",
      nameAr: "مشروبات",
      items: [
        { name: "Green Tea", nameAr: "شاي أخضر", price: 15, isVegetarian: true },
        { name: "Mango Smoothie", nameAr: "سموذي مانجو", price: 30, isVegetarian: true },
      ],
    },
  ],
  desserts: [
    {
      name: "Cakes",
      nameAr: "كيك",
      items: [
        { name: "Chocolate Fudge Cake", nameAr: "كيك الشوكولاتة", price: 55, isVegetarian: true },
        { name: "Cheesecake", nameAr: "تشيز كيك", price: 60, isVegetarian: true },
        { name: "Red Velvet Cake", nameAr: "كيك رد فيلفت", price: 58, isVegetarian: true },
      ],
    },
    {
      name: "Ice Cream",
      nameAr: "آيس كريم",
      items: [
        { name: "Vanilla Ice Cream Cup", nameAr: "آيس كريم فانيليا", price: 25, isVegetarian: true },
        { name: "Chocolate Sundae", nameAr: "سنداي شوكولاتة", price: 35, isVegetarian: true },
      ],
    },
    {
      name: "Pastries",
      nameAr: "معجنات",
      items: [
        { name: "Kunafa", nameAr: "كنافة", price: 45, isVegetarian: true },
        { name: "Baklava (6pc)", nameAr: "بقلاوة", price: 40, isVegetarian: true },
      ],
    },
  ],
  "cafe-drinks": [
    {
      name: "Hot Drinks",
      nameAr: "مشروبات ساخنة",
      items: [
        { name: "Espresso", nameAr: "إسبريسو", price: 20, isVegetarian: true },
        { name: "Cappuccino", nameAr: "كابتشينو", price: 28, isVegetarian: true },
        { name: "Arabic Coffee", nameAr: "قهوة عربية", price: 22, isVegetarian: true },
      ],
    },
    {
      name: "Cold Drinks",
      nameAr: "مشروبات باردة",
      items: [
        { name: "Iced Latte", nameAr: "آيس لاتيه", price: 32, isVegetarian: true },
        { name: "Fresh Orange Juice", nameAr: "عصير برتقال طازج", price: 25, isVegetarian: true },
      ],
    },
    {
      name: "Snacks",
      nameAr: "سناكس",
      items: [
        { name: "Croissant", nameAr: "كرواسون", price: 20, isVegetarian: true },
        { name: "Muffin", nameAr: "مافن", price: 22, isVegetarian: true },
      ],
    },
  ],
  breakfast: [
    {
      name: "Breakfast Plates",
      nameAr: "أطباق فطور",
      items: [
        { name: "Foul & Falafel Plate", nameAr: "طبق فول وفلافل", price: 45, isVegetarian: true },
        { name: "Eggs Benedict", nameAr: "إيجز بينديكت", price: 60 },
        { name: "Cheese & Jam Plate", nameAr: "طبق جبنة ومربى", price: 40, isVegetarian: true },
      ],
    },
    {
      name: "Pancakes & Waffles",
      nameAr: "بان كيك ووافل",
      items: [
        { name: "Pancake Stack", nameAr: "بان كيك", price: 50, isVegetarian: true },
        { name: "Belgian Waffle", nameAr: "وافل بلجيكي", price: 55, isVegetarian: true },
      ],
    },
    {
      name: "Drinks",
      nameAr: "مشروبات",
      items: [
        { name: "Fresh Juice", nameAr: "عصير طازج", price: 25, isVegetarian: true },
        { name: "Coffee", nameAr: "قهوة", price: 20, isVegetarian: true },
      ],
    },
  ],
  healthy: [
    {
      name: "Salads",
      nameAr: "سلطات",
      items: [
        { name: "Grilled Chicken Salad", nameAr: "سلطة دجاج مشوي", price: 55 },
        { name: "Quinoa Bowl", nameAr: "طبق كينوا", price: 60, isVegetarian: true },
        { name: "Greek Salad", nameAr: "سلطة يونانية", price: 45, isVegetarian: true },
      ],
    },
    {
      name: "Bowls",
      nameAr: "بولز",
      items: [
        { name: "Buddha Bowl", nameAr: "بودا بول", price: 65, isVegetarian: true },
        { name: "Protein Power Bowl", nameAr: "بروتين باور بول", price: 70 },
      ],
    },
    {
      name: "Drinks",
      nameAr: "مشروبات",
      items: [
        { name: "Detox Juice", nameAr: "عصير ديتوكس", price: 28, isVegetarian: true },
        { name: "Protein Shake", nameAr: "بروتين شيك", price: 35, isVegetarian: true },
      ],
    },
  ],
  grills: [
    {
      name: "Shawarma",
      nameAr: "شاورما",
      items: [
        { name: "Chicken Shawarma Sandwich", nameAr: "سندوتش شاورما دجاج", price: 35, spiceOptions: true },
        { name: "Meat Shawarma Sandwich", nameAr: "سندوتش شاورما لحمة", price: 45, spiceOptions: true },
        { name: "Shawarma Plate", nameAr: "طبق شاورما", price: 65, spiceOptions: true },
      ],
    },
    {
      name: "Grills",
      nameAr: "مشويات",
      items: [
        { name: "Mixed Grill Plate", nameAr: "مشاوي مشكلة", price: 130 },
        { name: "Chicken Kebab", nameAr: "كباب دجاج", price: 85 },
        { name: "Kofta Plate", nameAr: "طبق كفتة", price: 90 },
      ],
    },
    {
      name: "Sides",
      nameAr: "أطباق جانبية",
      items: [
        { name: "Hummus", nameAr: "حمص", price: 25, isVegetarian: true },
        { name: "Garlic Sauce", nameAr: "صوص ثوم", price: 10, isVegetarian: true },
        { name: "Rice", nameAr: "أرز", price: 20, isVegetarian: true },
      ],
    },
  ],
};

const SPICE_OPTIONS = [
  { name: "Mild", nameAr: "خفيف", priceDelta: 0 },
  { name: "Medium", nameAr: "متوسط", priceDelta: 0 },
  { name: "Spicy", nameAr: "حار", priceDelta: 0 },
];

type RestaurantSeed = {
  name: string;
  nameAr: string;
  slug: string;
  city: keyof typeof CITY_CENTERS;
  categorySlugs: string[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  addressLine: string;
  description: string;
  descriptionAr: string;
};

const RESTAURANTS: RestaurantSeed[] = [
  {
    name: "Pizza Bros",
    nameAr: "بيتزا براذرز",
    slug: "pizza-bros",
    city: "Cairo",
    categorySlugs: ["pizza"],
    status: "APPROVED",
    addressLine: "12 Tahrir St, Downtown",
    description: "Stone-baked pizza made fresh every order.",
    descriptionAr: "بيتزا طازجة تُخبز على الحجر مع كل طلب.",
  },
  {
    name: "Burger Yard",
    nameAr: "برجر يارد",
    slug: "burger-yard",
    city: "Cairo",
    categorySlugs: ["burgers"],
    status: "APPROVED",
    addressLine: "34 Nasr St, Nasr City",
    description: "Juicy smash burgers and hand-cut fries.",
    descriptionAr: "برجر سماش طازج وبطاطس مقطعة يدويًا.",
  },
  {
    name: "Sweet Corner",
    nameAr: "ركن الحلا",
    slug: "sweet-corner",
    city: "Cairo",
    categorySlugs: ["desserts"],
    status: "APPROVED",
    addressLine: "8 Zamalek St, Zamalek",
    description: "Cakes, pastries, and ice cream made daily.",
    descriptionAr: "كيك ومعجنات وآيس كريم طازج يوميًا.",
  },
  {
    name: "Cairo Grills",
    nameAr: "مشاوي القاهرة",
    slug: "cairo-grills",
    city: "Cairo",
    categorySlugs: ["grills"],
    status: "APPROVED",
    addressLine: "56 Maadi Corniche, Maadi",
    description: "Charcoal-grilled classics and shawarma.",
    descriptionAr: "مشويات على الفحم وشاورما بطعم أصيل.",
  },
  {
    name: "Morning Cup",
    nameAr: "كوب الصباح",
    slug: "morning-cup",
    city: "Cairo",
    categorySlugs: ["breakfast", "cafe-drinks"],
    status: "PENDING",
    addressLine: "3 Heliopolis Ave, Heliopolis",
    description: "All-day breakfast and specialty coffee.",
    descriptionAr: "فطور طوال اليوم وقهوة مختصة.",
  },
  {
    name: "Sushi Go",
    nameAr: "سوشي جو",
    slug: "sushi-go",
    city: "Dubai",
    categorySlugs: ["asian"],
    status: "APPROVED",
    addressLine: "Marina Walk, Dubai Marina",
    description: "Fresh sushi and pan-Asian bowls.",
    descriptionAr: "سوشي طازج وأطباق آسيوية متنوعة.",
  },
  {
    name: "Green Bowl",
    nameAr: "الوعاء الأخضر",
    slug: "green-bowl",
    city: "Dubai",
    categorySlugs: ["healthy"],
    status: "APPROVED",
    addressLine: "JBR Walk, Jumeirah Beach Residence",
    description: "Salads, bowls, and cold-pressed juices.",
    descriptionAr: "سلطات وبولز وعصائر طبيعية.",
  },
  {
    name: "Al Bait Kitchen",
    nameAr: "مطبخ البيت",
    slug: "al-bait-kitchen",
    city: "Dubai",
    categorySlugs: ["grills", "breakfast"],
    status: "SUSPENDED",
    addressLine: "Al Muraqqabat St, Deira",
    description: "Home-style grills and breakfast.",
    descriptionAr: "مشويات وفطور على الطريقة البيتي.",
  },
  {
    name: "Noor's Kitchen",
    nameAr: "مطبخ نور",
    slug: "noors-kitchen",
    city: "Riyadh",
    categorySlugs: ["asian", "healthy"],
    status: "APPROVED",
    addressLine: "King Fahd Rd, Olaya",
    description: "Asian-fusion bowls with healthy options.",
    descriptionAr: "أطباق آسيوية متنوعة مع خيارات صحية.",
  },
  {
    name: "Golden Crust",
    nameAr: "القشرة الذهبية",
    slug: "golden-crust",
    city: "Riyadh",
    categorySlugs: ["pizza", "desserts"],
    status: "APPROVED",
    addressLine: "Al Takhassusi St, Al Sulimaniyah",
    description: "Wood-fired pizza and fresh desserts.",
    descriptionAr: "بيتزا مخبوزة على الحطب وحلويات طازجة.",
  },
];

const REVIEW_COMMENTS = [
  { en: "Great food, arrived fast and hot.", ar: "أكل ممتاز ووصل سريع وساخن." },
  { en: "Really enjoyed it, will order again.", ar: "استمتعت بيها فعلاً هاطلب تاني." },
  { en: "Good portion size and taste.", ar: "الكمية والطعم كويسين." },
  { en: "Delivery took a bit long but food was good.", ar: "التوصيل اتأخر شوية بس الأكل كان حلو." },
  { en: "Exactly as described, thank you!", ar: "بالظبط زي الوصف، شكرًا!" },
  { en: "One of the best in the area.", ar: "من أحسن الأماكن في المنطقة." },
];

const DRIVER_NAMES = [
  { name: "Ahmed Samir", phone: "+201001234567" },
  { name: "Mohamed Adel", phone: "+201002345678" },
  { name: "Youssef Khaled", phone: "+201003456789" },
  { name: "Omar Farouk", phone: "+201004567890" },
  { name: "Karim Hassan", phone: "+201005678901" },
];

async function wipeDatabase() {
  await prisma.orderStatusHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItemOption.deleteMany();
  await prisma.menuItemOptionGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();
}

async function seedCategories() {
  const categories = [];
  for (const def of CATEGORY_DEFS) {
    categories.push(
      await prisma.category.create({
        data: { name: def.name, nameAr: def.nameAr, slug: def.slug, icon: def.icon, sortOrder: CATEGORY_DEFS.indexOf(def) },
      })
    );
  }
  return categories;
}

async function seedUsers(passwordHash: string) {
  const admin = await prisma.user.create({
    data: { email: "admin@sufra.demo", passwordHash, name: "Sufra Admin", role: Role.ADMIN, phone: "+201000000000" },
  });

  const owners = [];
  for (let i = 1; i <= 8; i++) {
    owners.push(
      await prisma.user.create({
        data: {
          email: `owner${i}@sufra.demo`,
          passwordHash,
          name: `Restaurant Owner ${i}`,
          role: Role.RESTAURANT_OWNER,
          phone: `+2010100000${String(i).padStart(2, "0")}`,
        },
      })
    );
  }

  const cityForCustomer = (i: number) => (i < 4 ? "Cairo" : i < 7 ? "Dubai" : "Riyadh");
  const customers = [];
  for (let i = 0; i < 10; i++) {
    const city = cityForCustomer(i);
    const customer = await prisma.user.create({
      data: {
        email: `customer${i + 1}@sufra.demo`,
        passwordHash,
        name: `Customer ${i + 1}`,
        role: Role.CUSTOMER,
        phone: `+2011200000${String(i + 1).padStart(2, "0")}`,
      },
    });
    const addressCount = randomInt(1, 2);
    for (let a = 0; a < addressCount; a++) {
      const coords = jitter(CITY_CENTERS[city], 0.06);
      await prisma.address.create({
        data: {
          userId: customer.id,
          label: a === 0 ? "Home" : "Work",
          city,
          street: faker.location.streetAddress(),
          isDefault: a === 0,
          ...coords,
        },
      });
    }
    customers.push({ ...customer, city });
  }

  return { admin, owners, customers };
}

async function seedDrivers() {
  const drivers = [];
  const vehicleTypes = [VehicleType.MOTORCYCLE, VehicleType.MOTORCYCLE, VehicleType.CAR, VehicleType.BICYCLE, VehicleType.MOTORCYCLE];
  for (let i = 0; i < DRIVER_NAMES.length; i++) {
    drivers.push(
      await prisma.driver.create({
        data: { name: DRIVER_NAMES[i].name, phone: DRIVER_NAMES[i].phone, vehicleType: vehicleTypes[i] },
      })
    );
  }
  return drivers;
}

async function seedRestaurants(owners: { id: string }[], categories: { id: string; slug: string }[]) {
  const restaurants = [];
  for (let i = 0; i < RESTAURANTS.length; i++) {
    const def = RESTAURANTS[i];
    const owner = owners[i % owners.length];
    const coords = jitter(CITY_CENTERS[def.city]);
    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: owner.id,
        name: def.name,
        nameAr: def.nameAr,
        slug: def.slug,
        description: def.description,
        descriptionAr: def.descriptionAr,
        city: def.city,
        addressLine: def.addressLine,
        phone: `+20122${String(1000000 + i).slice(-7)}`,
        status: def.status,
        isOpen: def.status === "APPROVED",
        deliveryFee: randomInt(10, 25),
        minOrderAmount: randomInt(40, 80),
        avgPreparationTimeMinutes: randomInt(20, 45),
        ratingAvg: Number((3.6 + Math.random() * 1.3).toFixed(2)),
        ratingCount: randomInt(15, 250),
        ...coords,
        categories: { connect: def.categorySlugs.map((slug) => ({ id: categories.find((c) => c.slug === slug)!.id })) },
      },
    });

    const menuItems: {
      id: string;
      name: string;
      nameAr: string;
      price: number;
      optionGroups: { id: string; name: string; nameAr: string; isRequired: boolean; options: { id: string; name: string; nameAr: string; priceDelta: number }[] }[];
    }[] = [];
    let sectionOrder = 0;
    for (const categorySlug of def.categorySlugs) {
      for (const section of MENU_TEMPLATES[categorySlug]) {
        const menuCategory = await prisma.menuCategory.create({
          data: { restaurantId: restaurant.id, name: section.name, nameAr: section.nameAr, sortOrder: sectionOrder++ },
        });
        let itemOrder = 0;
        for (const item of section.items) {
          const optionGroups = item.sizeOptions
            ? [{ name: "Size", nameAr: "الحجم", isRequired: true, minSelect: 1, maxSelect: 1, sortOrder: 0, options: item.sizeOptions }]
            : item.spiceOptions
              ? [{ name: "Spice Level", nameAr: "درجة الحرارة", isRequired: false, minSelect: 0, maxSelect: 1, sortOrder: 0, options: SPICE_OPTIONS }]
              : [];

          const created = await prisma.menuItem.create({
            data: {
              restaurantId: restaurant.id,
              menuCategoryId: menuCategory.id,
              name: item.name,
              nameAr: item.nameAr,
              price: item.price,
              isVegetarian: item.isVegetarian ?? false,
              sortOrder: itemOrder++,
              optionGroups: optionGroups.length
                ? {
                    create: optionGroups.map((g) => ({
                      name: g.name,
                      nameAr: g.nameAr,
                      isRequired: g.isRequired,
                      minSelect: g.minSelect,
                      maxSelect: g.maxSelect,
                      sortOrder: g.sortOrder,
                      options: { create: g.options.map((o, idx) => ({ name: o.name, nameAr: o.nameAr, priceDelta: o.priceDelta, sortOrder: idx })) },
                    })),
                  }
                : undefined,
            },
            include: { optionGroups: { include: { options: true } } },
          });
          menuItems.push({
            id: created.id,
            name: created.name,
            nameAr: created.nameAr,
            price: Number(created.price),
            optionGroups: created.optionGroups.map((g) => ({
              id: g.id,
              name: g.name,
              nameAr: g.nameAr,
              isRequired: g.isRequired,
              options: g.options.map((o) => ({ id: o.id, name: o.name, nameAr: o.nameAr, priceDelta: Number(o.priceDelta) })),
            })),
          });
        }
      }
    }

    restaurants.push({ ...restaurant, deliveryFee: Number(restaurant.deliveryFee), menuItems });
  }
  return restaurants;
}

type SeededRestaurant = Awaited<ReturnType<typeof seedRestaurants>>[number];
type SeededCustomer = { id: string; city: string };

async function seedOrders(
  restaurants: SeededRestaurant[],
  customers: SeededCustomer[],
  drivers: { id: string }[],
  admin: { id: string }
) {
  const approvedByCity = new Map<string, SeededRestaurant[]>();
  for (const r of restaurants) {
    if (r.status !== "APPROVED") continue;
    const list = approvedByCity.get(r.city) ?? [];
    list.push(r);
    approvedByCity.set(r.city, list);
  }

  const TOTAL_HISTORICAL = 60;
  const TOTAL_TODAY = 10;
  let orderSeq = 1;
  let reviewCount = 0;

  async function createOneOrder(dayOffset: number, forcedStatus?: OrderStatus) {
    const city = pick(customers).city;
    const cityRestaurants = approvedByCity.get(city);
    if (!cityRestaurants || cityRestaurants.length === 0) return;
    const restaurant = pick(cityRestaurants);
    const customerPool = customers.filter((c) => c.city === city);
    const customer = pick(customerPool);
    const address = await prisma.address.findFirst({ where: { userId: customer.id } });

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - dayOffset);
    createdAt.setHours(randomInt(9, 22), randomInt(0, 59), 0, 0);

    const itemCount = randomInt(1, 4);
    const chosenItems = pickMany(restaurant.menuItems, itemCount);
    let subtotal = 0;
    const orderItemsData = chosenItems.map((mi) => {
      const quantity = randomInt(1, 3);
      let unitPrice = mi.price;
      const selectedOptions: { groupName: string; groupNameAr: string; optionName: string; optionNameAr: string; priceDelta: number }[] = [];
      for (const group of mi.optionGroups) {
        if (group.isRequired || Math.random() > 0.5) {
          const option = pick(group.options);
          unitPrice += option.priceDelta;
          selectedOptions.push({
            groupName: group.name,
            groupNameAr: group.nameAr,
            optionName: option.name,
            optionNameAr: option.nameAr,
            priceDelta: option.priceDelta,
          });
        }
      }
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      return {
        menuItemId: mi.id,
        nameSnapshot: mi.name,
        nameArSnapshot: mi.nameAr,
        priceSnapshot: unitPrice,
        quantity,
        lineTotal,
        selectedOptionsSnapshot: selectedOptions.length ? selectedOptions : undefined,
      };
    });

    const deliveryFee = restaurant.deliveryFee;
    const total = subtotal + deliveryFee;
    const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `ORD-${dateStr}-${String(orderSeq++).padStart(4, "0")}`;

    let status: OrderStatus = forcedStatus ?? OrderStatus.DELIVERED;
    if (!forcedStatus) {
      const roll = Math.random();
      status = roll < 0.87 ? OrderStatus.DELIVERED : OrderStatus.CANCELLED;
    }

    const deliveryCoords = address ? { lat: address.lat, lng: address.lng } : jitter(CITY_CENTERS[city]);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        restaurantId: restaurant.id,
        addressId: address?.id,
        deliveryAddressLine: address?.street ?? "Delivery address",
        deliveryCity: city,
        deliveryLat: deliveryCoords.lat,
        deliveryLng: deliveryCoords.lng,
        status,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: Math.random() < 0.6 ? PaymentMethod.CASH : PaymentMethod.CARD_MOCK,
        paymentStatus: status === OrderStatus.CANCELLED ? PaymentStatus.FAILED : PaymentStatus.PAID,
        createdAt,
        updatedAt: createdAt,
        items: { create: orderItemsData },
      },
    });

    const history: { status: OrderStatus; changedAt: Date; note?: string }[] = [{ status: OrderStatus.PENDING, changedAt: createdAt }];
    const addMinutes = (base: Date, mins: number) => new Date(base.getTime() + mins * 60000);

    if (status === OrderStatus.CANCELLED) {
      history.push({ status: OrderStatus.CANCELLED, changedAt: addMinutes(createdAt, randomInt(2, 15)), note: "Cancelled by customer" });
    } else {
      const progressionTimes = [
        { status: OrderStatus.CONFIRMED, mins: randomInt(1, 4) },
        { status: OrderStatus.PREPARING, mins: randomInt(5, 10) },
        { status: OrderStatus.READY_FOR_PICKUP, mins: randomInt(15, 25) },
        { status: OrderStatus.OUT_FOR_DELIVERY, mins: randomInt(20, 30) },
        { status: OrderStatus.DELIVERED, mins: randomInt(30, 45) },
      ];
      for (const step of progressionTimes) {
        if (statusRank(step.status) > statusRank(status)) break;
        history.push({ status: step.status, changedAt: addMinutes(createdAt, step.mins) });
      }
    }

    await prisma.orderStatusHistory.createMany({
      data: history.map((h) => ({ orderId: order.id, status: h.status, changedAt: h.changedAt, note: h.note })),
    });

    const lastHistoryTime = history[history.length - 1].changedAt;
    const patch: Record<string, unknown> = {};
    if (status === OrderStatus.DELIVERED) patch.deliveredAt = lastHistoryTime;
    if (status === OrderStatus.CANCELLED) {
      patch.cancelledAt = lastHistoryTime;
      patch.cancelReason = "Cancelled by customer";
    }
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      const driver = pick(drivers);
      const restaurantCoords = { lat: Number(restaurant.lat), lng: Number(restaurant.lng) };
      const fraction = 0.3 + Math.random() * 0.4;
      const driverPos = {
        lat: restaurantCoords.lat + (deliveryCoords.lat - restaurantCoords.lat) * fraction,
        lng: restaurantCoords.lng + (deliveryCoords.lng - restaurantCoords.lng) * fraction,
      };
      patch.driverId = driver.id;
      patch.driverLat = driverPos.lat;
      patch.driverLng = driverPos.lng;
      patch.driverHeading = bearingDegrees(restaurantCoords, deliveryCoords);
      patch.driverUpdatedAt = new Date();
    }
    if (Object.keys(patch).length) {
      await prisma.order.update({ where: { id: order.id }, data: patch });
    }

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: order.paymentMethod,
        status: order.paymentStatus,
        amount: total,
        transactionRef: `MOCK-${order.id.slice(0, 8)}`,
        createdAt,
      },
    });

    if (status === OrderStatus.DELIVERED && Math.random() < 0.4) {
      const comment = pick(REVIEW_COMMENTS);
      await prisma.review.create({
        data: {
          orderId: order.id,
          customerId: customer.id,
          restaurantId: restaurant.id,
          rating: randomInt(3, 5),
          comment: Math.random() < 0.5 ? comment.en : comment.ar,
          createdAt: addMinutes(lastHistoryTime, randomInt(10, 600)),
        },
      });
      reviewCount++;
    }
  }

  function statusRank(status: OrderStatus) {
    const order = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];
    return order.indexOf(status);
  }

  for (let i = 0; i < TOTAL_HISTORICAL; i++) {
    await createOneOrder(randomInt(1, 42));
  }

  const todayStatuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
  ];
  for (let i = 0; i < TOTAL_TODAY; i++) {
    await createOneOrder(0, todayStatuses[i % todayStatuses.length]);
  }

  // Restaurant.ratingAvg/ratingCount were seeded with plausible placeholder numbers before any
  // Review rows existed; recompute them from the reviews actually created above so the two stay
  // consistent (the app itself keeps them in sync this way on every new review — see
  // orders.service.ts createReview).
  for (const restaurant of restaurants) {
    const agg = await prisma.review.aggregate({ where: { restaurantId: restaurant.id }, _avg: { rating: true }, _count: true });
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }

  console.log(`Seeded ${orderSeq - 1} orders (${reviewCount} with reviews) for admin ${admin.id}`);
}

async function main() {
  console.log("Wiping existing data...");
  await wipeDatabase();

  console.log("Hashing demo password...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("Seeding categories...");
  const categories = await seedCategories();

  console.log("Seeding users (admin, owners, customers)...");
  const { admin, owners, customers } = await seedUsers(passwordHash);

  console.log("Seeding drivers...");
  const drivers = await seedDrivers();

  console.log("Seeding restaurants and menus...");
  const restaurants = await seedRestaurants(owners, categories);

  console.log("Seeding orders...");
  await seedOrders(restaurants, customers, drivers, admin);

  console.log("Seed complete.");
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
