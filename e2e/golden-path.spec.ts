import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "Passw0rd!";

function unique(label: string) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return { stamp, email: `${label}.${stamp}@e2e.demo` };
}

async function switchLanguage(page: Page, lang: "EN" | "عربي") {
  await page.locator(`button:text-is("${lang}")`).first().click();
}

// Waiting for the browser 'load' event (Playwright's page.goto default) is
// unreliable against Vite's dev server on a full page navigation, so this
// helper uses 'domcontentloaded' instead. But the bigger fix is using this
// only where a real full navigation is unavoidable (first load, a fresh
// incognito context, or after a logout resets the session) — everywhere else
// below clicks a real nav link, exactly as a user would move around an
// already-authenticated SPA, since the app's access token lives in memory
// only (never localStorage) and a full reload forces a refresh-token
// round-trip on every single page change.
async function goto(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
}

// Every button-name lookup below is exact: this app shows transient toasts
// ("Branch saved", "Questions saved", ...) whose text can otherwise satisfy a
// non-exact getByRole substring match (e.g. "Branch saved" contains "Save"),
// causing a strict-mode collision with the real form button.
test.describe("golden path", () => {
  test("signup → branches → survey → publish → anonymous response → analytics → export → admin suspend", async ({ page, browser }) => {
    const { stamp, email } = unique("owner");
    const brandName = `E2E Bistro ${stamp}`;

    await test.step("brand signup lands on the dashboard", async () => {
      await goto(page, "/signup");
      await switchLanguage(page, "EN");
      await page.getByLabel("Brand name", { exact: true }).fill(brandName);
      await page.getByLabel("Brand name (Arabic)").fill(`مطعم اختبار ${stamp}`);
      await page.getByLabel("Your name").fill("E2E Owner");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(DEMO_PASSWORD);
      await page.getByRole("button", { name: "Create Account", exact: true }).click();
      await page.waitForURL(/\/dashboard/);
    });

    await test.step("create two branches", async () => {
      await page.getByRole("link", { name: "Branches", exact: true }).click();
      await page.waitForURL(/\/branches/);
      for (const [name, nameAr] of [
        ["Branch One", "الفرع الأول"],
        ["Branch Two", "الفرع الثاني"],
      ]) {
        await page.getByRole("button", { name: "Add Branch", exact: true }).click();
        await page.getByLabel("Name", { exact: true }).fill(name);
        await page.getByLabel("Name (Arabic)").fill(nameAr);
        await page.getByLabel("Address", { exact: true }).fill("1 Test St");
        await page.getByLabel("Address (Arabic)").fill("١ شارع الاختبار");
        await page.getByLabel("City", { exact: true }).fill("Cairo");
        await page.getByLabel("City (Arabic)").fill("القاهرة");
        await page.getByRole("button", { name: "Save", exact: true }).click();
        await expect(page.getByText(name)).toBeVisible();
      }
    });

    let surveyId = "";
    await test.step("build a survey with a mix of question types", async () => {
      await page.getByRole("link", { name: "Surveys", exact: true }).click();
      await page.waitForURL(/\/surveys$/);
      await page.getByRole("button", { name: "Create Survey", exact: true }).click();
      await page.getByLabel("Title", { exact: true }).fill("Table Feedback");
      await page.getByLabel("Title (Arabic)").fill("تقييم الطاولة");
      await page.getByRole("button", { name: "Create", exact: true }).click();
      await page.waitForURL(/\/surveys\/.+\/edit/);
      surveyId = new URL(page.url()).pathname.split("/")[2];

      await page.getByRole("button", { name: "Questions", exact: true }).click();

      for (const type of ["Rating", "Yes / No", "Short Text"]) {
        await page.getByRole("button", { name: "Add Question", exact: true }).click();
        await page.getByRole("button", { name: type, exact: true }).click();
        await page.locator('input[placeholder="Title"]').last().fill(`${type} question`);
        await page.locator('input[placeholder="Title (Arabic)"]').last().fill(`سؤال ${type}`);
      }
      await page.getByRole("button", { name: "Save Questions", exact: true }).click();
      await expect(page.getByText("Questions saved")).toBeVisible();

      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.getByText("Survey published")).toBeVisible();
    });

    let publicUrl = "";
    let branchOneName = "";
    await test.step("get the first branch's QR link", async () => {
      await page.getByRole("link", { name: "Links & QR Codes", exact: true }).click();
      await page.waitForURL(/\/surveys\/.+\/links/);
      const firstCard = page.locator(".rounded-xl.border").filter({ has: page.locator('p[dir="ltr"]') }).first();
      branchOneName = (await firstCard.locator("p").first().textContent()) ?? "";
      publicUrl = ((await firstCard.locator('p[dir="ltr"]').textContent()) ?? "").trim();
      expect(publicUrl).toContain("/r/");
    });

    await test.step("submit a response anonymously, with no auth at all", async () => {
      const anonContext = await browser.newContext();
      const anonPage = await anonContext.newPage();
      await goto(anonPage, publicUrl);
      await switchLanguage(anonPage, "EN");

      await anonPage.getByRole("button", { name: "5", exact: true }).click(); // rating star
      await anonPage.getByRole("button", { name: "Yes", exact: true }).click();
      await anonPage.locator('input[type="text"]').fill("Great table service, e2e test comment.");
      await anonPage.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(anonPage.getByText("Thank you!")).toBeVisible();

      await test.step("mobile-viewport pass on the same /r/:token link", async () => {
        const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const mobilePage = await mobileContext.newPage();
        await goto(mobilePage, publicUrl);
        await switchLanguage(mobilePage, "EN"); // fresh context: defaults to Arabic like any other
        await expect(mobilePage.getByRole("button", { name: "Submit", exact: true })).toBeVisible();
        const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(overflow).toBe(false);
        await mobileContext.close();
      });

      await anonContext.close();
    });

    await test.step("confirm the response shows up in analytics with correct branch attribution", async () => {
      await page.getByRole("link", { name: "Analytics", exact: true }).click();
      await page.waitForURL(/\/surveys\/.+\/analytics/);
      await expect(page.getByText("Total Responses")).toBeVisible();
      await expect(page.locator("text=Total Responses").locator("..").locator("p.text-xl")).toHaveText("1");
      await expect(page.getByRole("cell", { name: branchOneName.trim() })).toBeVisible();
    });

    await test.step("export CSV", async () => {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Export CSV", exact: true }).click(),
      ]);
      expect(download.suggestedFilename()).toBe("survey-responses.csv");
    });

    await test.step("platform admin suspends the brand", async () => {
      await page.getByRole("button", { name: "Log Out", exact: true }).click();
      await page.waitForURL(/\/login/);

      await goto(page, "/admin/login");
      await page.getByLabel("Email").fill("admin@rai.demo");
      await page.getByLabel("Password").fill(DEMO_PASSWORD);
      await page.getByRole("button", { name: "Log In", exact: true }).click();
      await page.waitForURL(/\/admin\/dashboard/);

      await page.getByRole("link", { name: "Brands", exact: true }).click();
      await page.waitForURL(/\/admin\/brands/);
      await page.getByPlaceholder("Search brands…").fill(brandName);
      await page.getByText(brandName, { exact: true }).click();
      await page.waitForURL(/\/admin\/brands\/.+/);

      await page.getByRole("button", { name: "Suspend Brand", exact: true }).click();
      await page.getByRole("button", { name: "Confirm", exact: true }).click();
      await expect(page.getByText("Brand suspended")).toBeVisible();
    });

    await test.step("suspended brand's owner can no longer log in", async () => {
      await page.getByRole("button", { name: "Log Out", exact: true }).click();
      await goto(page, "/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(DEMO_PASSWORD);
      await page.getByRole("button", { name: "Log In", exact: true }).click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator("p.text-red-600")).toHaveText("This account no longer has access");
    });
  });
});

test.describe("bilingual / RTL", () => {
  test("Arabic is the default direction, EN toggle flips it", async ({ page }) => {
    await goto(page, "/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await switchLanguage(page, "EN");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
