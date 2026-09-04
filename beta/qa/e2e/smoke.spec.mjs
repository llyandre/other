import { test,expect } from "@playwright/test";

test.beforeEach(async({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem("wikaru_mascot_v1_onboarding_completed","completed");
    localStorage.setItem("wikaru_mascot_v1_last_visit_at",String(Date.now()));
    sessionStorage.setItem("wikaru_category_cue_seen","true");
  });
});

test("shell, profil, backup, dan panduan kuis dapat digunakan",async({page}) => {
  const pageErrors=[];
  page.on("pageerror",error => pageErrors.push(error.message));
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(() => Boolean(window.WIKARU_APP && window.WikaruBackup && window.WikaruUpdateManager && window.WikaruQuizGuide));
  await expect(page.locator("#loadingScreen")).toBeHidden();
  await expect(page.locator("#homePage")).toBeVisible();
  await expect(page.locator("#userMenuBtn")).toBeVisible();

  await page.locator("#userMenuBtn").click();
  await expect(page.locator("#userDropdown")).toHaveClass(/show/);
  await expect(page.locator("#wikaruBackupBtn")).toBeVisible();
  await page.locator("#wikaruBackupBtn").click();
  await expect(page.locator("#wikaruBackupModal")).toBeVisible();
  await expect(page.locator("[data-backup-export]")).toBeEnabled();
  await page.locator("[data-backup-close]").click();

  await page.evaluate(() => window.WikaruQuizGuide.open("study"));
  await expect(page.locator("#wikaruQuizGuide")).toBeVisible();
  await expect(page.locator(".wk-quiz-guide-step")).toHaveCount(3);
  await page.locator("[data-qg-close]").click();
  expect(pageErrors).toEqual([]);
});

test("tidak ada overflow horizontal dan profil memiliki target sentuh aman",async({page}) => {
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(() => Boolean(window.WIKARU_APP && window.WikaruBackup));
  const layout=await page.evaluate(() => {
    const button=document.getElementById("userMenuBtn")?.getBoundingClientRect();
    return {
      viewport:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth,
      profileWidth:button?.width || 0,
      profileHeight:button?.height || 0
    };
  });
  expect(layout.scroll).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.profileWidth).toBeGreaterThanOrEqual(44);
  expect(layout.profileHeight).toBeGreaterThanOrEqual(44);
});

