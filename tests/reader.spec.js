import { test, expect } from "@playwright/test";
import { studySections, studySource } from "../src/study-content.js";
import {
  throwGroups,
  throwingTechniques,
  practiceRanks,
  filterTechniques,
  normalizeTechnique,
} from "../src/throw-content.js";
import { readFileSync } from "node:fs";

const officialVideos = JSON.parse(
  readFileSync(new URL("../src/throw-videos.json", import.meta.url), "utf8"),
);

async function openHandbook(page) {
  await page.getByRole("button", { name: /Throw Guide/ }).click();
  await page
    .getByRole("button", { name: "View handbook", exact: true })
    .click();
}

async function expectPage(page, number) {
  await expect(page.locator("#paper")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#pdf-canvas")).toHaveAttribute(
    "aria-label",
    new RegExp(`page ${number} of`),
  );
  await expect(page.locator("#paper")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#error")).toBeHidden();
}

function isPdfData(url) {
  return url.pathname.endsWith(".pdf") && !url.searchParams.has("import");
}

test("iOS home-screen icon and name resolve under the GitHub Pages path", async ({
  page,
}) => {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator('meta[name="apple-mobile-web-app-title"]'),
  ).toHaveAttribute("content", "Wichita Judo");
  const icon = page.locator('link[rel="apple-touch-icon"]');
  await expect(icon).toHaveAttribute("sizes", "180x180");
  await expect(icon).toHaveAttribute(
    "href",
    "/wj-study-guide/apple-touch-icon.png",
  );
  const url = await icon.getAttribute("href");
  const response = await page.request.get(url);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("image/png");
  const dimensions = await page.evaluate(
    (src) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
        image.onerror = () =>
          reject(new Error("Home-screen icon did not load"));
        image.src = src;
      }),
    url,
  );
  expect(dimensions).toEqual([180, 180]);
});

test("GitHub Pages subpath serves images, PDF references, fallback images, and the PDF viewer", async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL).origin;
  const localPaths = [];
  const failures = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === origin) localPaths.push(url.pathname);
  });
  page.on("response", (response) => {
    if (new URL(response.url()).origin === origin && response.status() >= 400)
      failures.push(response.url());
  });
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.route("https://i.ytimg.com/**", (route) => route.abort());
  await page.goto("./", { waitUntil: "domcontentloaded" });
  expect(new URL(page.url()).pathname).toBe("/wj-study-guide/");
  for (const selector of [
    ".brand img",
    '[data-book="guide"] img',
    '[data-book="handbook"] img',
  ]) {
    await expect
      .poll(() =>
        page.locator(selector).evaluate((image) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    expect(
      await page
        .locator(selector)
        .evaluate((image) => new URL(image.src).pathname),
    ).toMatch(/^\/wj-study-guide\//);
  }
  const guide = await page.locator("#open-original").getAttribute("href");
  expect(guide).toMatch(/^\/wj-study-guide\/assets\/.+\.pdf$/);
  const guideResponse = await page.request.head(guide);
  expect(guideResponse.ok()).toBeTruthy();
  expect(guideResponse.headers()["content-type"]).toContain("application/pdf");
  await page.getByRole("button", { name: /Throw Guide/ }).click();
  await expect(page.locator("#throw-detail img")).toHaveAttribute(
    "src",
    "/wj-study-guide/handbook-cover.webp",
  );
  await expect
    .poll(() =>
      page.locator("#throw-detail img").evaluate((image) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "View handbook", exact: true })
    .click();
  await expectPage(page, 33);
  expect(
    localPaths.every((path) => path.startsWith("/wj-study-guide/")),
  ).toBeTruthy();
  expect(failures).toEqual([]);
});

test("the transcription covers every source page and preserves structured source content", () => {
  const pages = studySections.flatMap((section) => section.pages);
  expect(pages.map((page) => page.number)).toEqual(
    Array.from({ length: studySource.pageCount }, (_, index) => index + 1),
  );
  expect(new Set(studySections.map((section) => section.id)).size).toBe(10);
  for (const page of pages) {
    expect(page.blocks.length).toBeGreaterThan(0);
    for (const block of page.blocks) {
      expect(block.heading).toBeTruthy();
      for (const row of block.rows ?? [])
        expect(row).toHaveLength(block.columns.length);
      for (const question of block.questions ?? [])
        expect(question).toHaveLength(3);
    }
  }
  const rules = pages.find((page) => page.number === 3);
  expect(rules.blocks[0].items).toHaveLength(9);
  expect(rules.blocks[1].items).toHaveLength(24);
  expect(
    pages.flatMap((page) =>
      page.blocks.flatMap((block) => block.questions ?? []),
    ),
  ).toHaveLength(37);
  expect(
    pages.find((page) => page.number === 10).blocks[0].questions[2],
  ).toEqual([3, "", ""]);
  expect(pages.find((page) => page.number === 6).blocks[2].rows).toContainEqual(
    ["Ikkyu", "12 months (48 months total in Judo)"],
  );
  expect(
    pages.find((page) => page.number === 19).blocks[1].rows,
  ).toContainEqual([
    "Ikkyu (1st Brown)",
    "30",
    "18 months (54 total)",
    "",
    "",
    "",
  ]);
});

test("all study content is native HTML and works without loading a PDF", async ({
  page,
}) => {
  const requests = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (isPdfData(new URL(request.url()))) requests.push(request.url());
  });
  await page.route(isPdfData, (route) => route.abort());
  await page.goto("./");
  await expect(page.locator("#study-guide")).toBeVisible();
  await expect(page.locator(".reader")).toBeHidden();
  await expect(
    page.getByRole("toolbar", { name: "PDF controls" }),
  ).toBeHidden();
  await expect(page.locator("#open-original")).toHaveText("View reference PDF");
  await expect(page.locator("#open-original")).toHaveAttribute(
    "href",
    /WJ-Student-Guide.*pdf/,
  );
  await expect(page.locator("#study-previous")).toBeDisabled();
  const covered = [];
  for (const section of studySections) {
    await page
      .getByRole("navigation", { name: "Document sections" })
      .getByRole("button", { name: section.title, exact: true })
      .click();
    await expect(page.locator("#study-section-title")).toHaveText(
      section.title,
    );
    await expect(page.locator("#study-guide")).toHaveAttribute(
      "data-section",
      section.id,
    );
    for (const source of section.pages) {
      const content = page.locator(`[data-source-page="${source.number}"]`);
      await expect(content).toBeVisible();
      await expect(
        content.getByRole("link", {
          name: `View PDF page ${source.number} for reference`,
        }),
      ).toHaveAttribute("href", new RegExp(`#page=${source.number}$`));
      for (const block of source.blocks) {
        await expect(
          content.getByRole("heading", { name: block.heading, exact: true }),
        ).toBeVisible();
        if (block.rows)
          await expect(
            content.getByRole("table", { name: block.heading }),
          ).toHaveCount(1);
      }
      covered.push(source.number);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  expect(covered).toHaveLength(20);
  await expect(page.locator("#study-next")).toBeDisabled();
  await expect(page.locator("#study-content")).toContainText(
    "18 months (54 total)",
  );
  await expect(page.locator("#study-content")).toContainText(
    "Confirm with Sensei",
  );
  await page.getByRole("button", { name: "Rokyu", exact: true }).click();
  await expect(page.locator("#study-content")).toContainText(
    "O Soto Gari - Major Outside Reap",
  );
  await expect(page.locator("#study-content")).toContainText("Jigoro Kano");
  await expect(
    page.getByRole("cell", { name: "Kyotsuke", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-study.png`,
    fullPage: true,
  });
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("study section navigation and reading position persist independently from the handbook", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Rokyu", exact: true }).click();
  await page.getByRole("button", { name: "Next section" }).click();
  await expect(page.locator("#study-section-title")).toHaveText("Gokyu");
  await page.getByRole("button", { name: "Previous section" }).click();
  await page.reload();
  await expect(page.locator("#study-section-title")).toHaveText("Rokyu");
  await openHandbook(page);
  await expectPage(page, 33);
  await expect(page.locator("#study-guide")).toBeHidden();
  await page
    .getByRole("button", { name: "Gokyo no Waza, page 34", exact: true })
    .click();
  await expectPage(page, 34);
  await page
    .getByRole("button", { name: "Bookmark page", exact: true })
    .click();
  await page.locator("#zoom").selectOption("1.25");
  await expectPage(page, 34);
  await page.locator("#zoom").selectOption("fit");
  await page.locator("#page-number").fill("70");
  await page.locator("#page-number").press("Enter");
  await expectPage(page, 70);
  await page.locator("#page-number").fill("999");
  await page.locator("#page-number").press("Enter");
  await expectPage(page, 74);
  await expect(page.locator("#next")).toBeDisabled();
  await page.getByRole("button", { name: /Study Guide Ranks/ }).click();
  await expect(page.locator("#study-section-title")).toHaveText("Rokyu");
  await expect(page.locator(".reader")).toBeHidden();
  await openHandbook(page);
  await expectPage(page, 74);
  await page.getByRole("button", { name: "Saved page 34" }).click();
  await expectPage(page, 34);
});

test("study tables stay within narrow-phone, tablet, and wide-screen layouts", async ({
  page,
}) => {
  await page.goto("./");
  for (const width of [320, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "Promotion records", exact: true })
      .click();
    await expect(page.locator("#study-section-title")).toHaveText(
      "Promotion records",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const table = page.getByRole("region", {
      name: "Rank Requirements & Promotion History",
    });
    await expect(table).toBeVisible();
    expect(
      await table.evaluate((element) => element.clientWidth <= innerWidth),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/${test.info().project.name}-study-${width}.png`,
      fullPage: false,
    });
  }
});

test("the throwing catalog contains all source groups, exact rank mappings, and verified official videos", () => {
  expect(throwingTechniques).toHaveLength(68);
  expect(
    new Set(throwingTechniques.map((technique) => technique.id)).size,
  ).toBe(68);
  expect(throwGroups.map((group) => group.throws.length)).toEqual([
    8, 8, 8, 8, 8, 8, 20,
  ]);
  expect(practiceRanks).toHaveLength(6);
  expect(
    practiceRanks.map((rank) => filterTechniques({ rank: rank.id }).length),
  ).toEqual([6, 6, 6, 4, 2, 2]);
  expect(filterTechniques({ query: "SASAE" })[0].ranks).toEqual(["gokyu"]);
  expect(filterTechniques({ query: "o soto gari" })[0].id).toBe("osotogari");
  expect(filterTechniques({ query: "o soto gari" })).toHaveLength(1);
  for (const technique of throwingTechniques) {
    expect([34, 35, 36]).toContain(technique.page);
    const video = officialVideos.videos[technique.id];
    expect(video.channelId).toBe("UCtF6tu7GuZYkZzht5MIv8UQ");
    expect(video.id).toMatch(/^[a-zA-Z0-9_-]{11}$/);
    expect(normalizeTechnique(video.title.split("/").at(-1))).toBe(
      technique.id,
    );
  }
});

test("the native throw catalog filters, handles empty results, and plays the matching official video", async ({
  page,
}) => {
  await page.route(isPdfData, (route) => route.abort());
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Video frame test</title>",
    }),
  );
  await page.goto("./");
  await page.getByRole("button", { name: /Throw Guide/ }).click();
  await expect(page.locator("#throw-guide")).toBeVisible();
  await expect(page.locator(".reader")).toBeHidden();
  await expect(page.locator("#throw-results button")).toHaveCount(68);
  await expect(page.locator("#throw-detail iframe")).toHaveCount(0);
  await page
    .getByRole("searchbox", { name: "Search throws" })
    .fill("O SOTO GARI");
  await expect(page.locator("#throw-results button")).toHaveCount(1);
  await expect(page.locator("#throw-detail h3")).toHaveText("O-soto-gari");
  await expect(
    page.getByRole("link", { name: "Watch on YouTube" }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=c-A_nP7mKAc");
  await page
    .getByRole("button", { name: "Play official demonstration of O-soto-gari" })
    .click();
  await expect(page.locator("#throw-detail iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\/c-A_nP7mKAc/,
  );
  await page.locator("#throw-clear").click();
  await expect(page.locator("#throw-detail iframe")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Throw group", exact: true })
    .selectOption("shinmeisho");
  await expect(page.locator("#throw-results button")).toHaveCount(20);
  await page
    .getByRole("combobox", { name: "Throw rank", exact: true })
    .selectOption("rokyu");
  await expect(page.locator("#throw-results button")).toHaveCount(1);
  await expect(page.locator("#throw-detail h3")).toHaveText("Ippon-seoi-nage");
  await page
    .getByRole("combobox", { name: "Throw rank", exact: true })
    .selectOption("gokyu");
  await expect(page.locator("#throw-empty")).toBeVisible();
  await expect(page.locator("#throw-detail")).toBeHidden();
  await page.locator("#throw-empty-reset").click();
  await page
    .getByRole("searchbox", { name: "Search throws" })
    .fill("Kani basami");
  await expect(page.locator("#throw-detail")).toContainText(
    "prohibited in IJF competition",
  );
  await page.locator("#throw-clear").click();
  await page
    .getByRole("navigation", { name: "Document sections" })
    .getByRole("button", { name: "Dai Ikkyo", exact: true })
    .click();
  await expect(page.locator("#throw-results button")).toHaveCount(8);
  await page.locator('[data-technique="osotogari"]').click();
  await expect(page.locator("#throw-detail img")).toHaveAttribute(
    "src",
    /i\.ytimg\.com/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-throws.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /Study Guide Ranks/ }).click();
  await expect(page.locator("#throw-detail iframe")).toHaveCount(0);
});

test("rank practice preserves source tasks and independent local progress", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Throw Guide/ }).click();
  await page.getByRole("tab", { name: "Catalog", exact: true }).focus();
  await page.getByRole("tab", { name: "Catalog", exact: true }).press("End");
  await expect(page.locator("#practice-requirements input")).toHaveCount(6);
  await page
    .getByRole("checkbox", {
      name: "O Soto Gari - Major Outside Reap",
      exact: true,
    })
    .check();
  await expect(page.locator("#practice-progress")).toHaveText(
    "1 / 6 practiced",
  );
  await page
    .getByRole("combobox", { name: "Practice rank" })
    .selectOption("sankyu");
  await expect(page.locator("#practice-requirements input")).toHaveCount(11);
  await expect(page.locator("#practice-requirements")).toContainText(
    "First two sets of Nage No Kata",
  );
  await expect(
    page.getByRole("checkbox", {
      name: "Teach one forward throw",
      exact: true,
    }),
  ).not.toBeChecked();
  await page
    .getByRole("combobox", { name: "Practice rank" })
    .selectOption("rokyu");
  await expect(page.locator("#practice-progress")).toHaveText(
    "1 / 6 practiced",
  );
  await page.reload();
  await page.getByRole("button", { name: /Throw Guide/ }).click();
  await expect(
    page.getByRole("tab", { name: "Rank practice" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("checkbox", {
      name: "O Soto Gari - Major Outside Reap",
      exact: true,
    }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "View O-soto-gari", exact: true })
    .click();
  await expect(page.locator("#throw-detail h3")).toHaveText("O-soto-gari");
  await expect(page.locator("#throw-results button")).toHaveCount(6);
  await page.getByRole("tab", { name: "Rank practice" }).click();
  await page.getByRole("button", { name: "Clear checks" }).click();
  await expect(page.locator("#practice-progress")).toHaveText(
    "0 / 6 practiced",
  );
  await expect(
    page.getByRole("button", { name: "Clear checks" }),
  ).toBeDisabled();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-practice.png`,
    fullPage: true,
  });
});

test("throw catalog and practice fit narrow phones, tablets, and desktops", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Throw Guide/ }).click();
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("tab", { name: "Catalog", exact: true }).click();
    await expect(page.locator("#throw-results button")).toHaveCount(68);
    await expect
      .poll(() =>
        page
          .locator("#throw-detail img")
          .evaluate((image) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/${test.info().project.name}-throws-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("tab", { name: "Rank practice" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await expect(
      page.getByRole("checkbox", {
        name: "O Soto Gari - Major Outside Reap",
        exact: true,
      }),
    ).toBeVisible();
  }
});

test("an idle PDF stays visible without resize-driven redraws", async ({
  page,
}) => {
  await page.goto("./");
  await openHandbook(page);
  await expectPage(page, 33);
  expect(
    await page.evaluate(() => {
      document.getElementById("next").click();
      return !document.getElementById("paper").hidden;
    }),
  ).toBeTruthy();
  await expectPage(page, 34);
  expect(
    await page.locator("#pdf-canvas").evaluate((canvas) => {
      const pixels = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let dark = 0;
      for (let index = 0; index < pixels.length; index += 64)
        if (pixels[index] < 160) dark++;
      return dark > 100;
    }),
  ).toBeTruthy();
  const originalWidth = await page
    .locator("#pdf-canvas")
    .evaluate((canvas) => canvas.clientWidth);
  await page.setViewportSize({
    width: test.info().project.name === "mobile" ? 430 : 900,
    height: 900,
  });
  await expect
    .poll(() =>
      page.locator("#pdf-canvas").evaluate((canvas) => canvas.clientWidth),
    )
    .not.toBe(originalWidth);
  await expectPage(page, 34);
  const resets = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0;
        let changes = 0;
        const observer = new MutationObserver((records) => {
          changes += records.length;
        });
        observer.observe(document.getElementById("paper"), {
          attributes: true,
          attributeFilter: ["hidden", "aria-busy"],
        });
        observer.observe(document.getElementById("pdf-canvas"), {
          attributes: true,
          attributeFilter: ["width", "height"],
        });
        function inspect() {
          if (++frames < 120) requestAnimationFrame(inspect);
          else {
            observer.disconnect();
            resolve(changes);
          }
        }
        requestAnimationFrame(inspect);
      }),
  );
  expect(resets).toBe(0);
});

test("the handbook still recovers from a failed PDF request", async ({
  page,
}) => {
  await page.route(isPdfData, (route) => route.abort());
  await page.goto("./");
  await openHandbook(page);
  await expect(page.locator("#error")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#loading")).toBeHidden();
  await page.unrouteAll();
  await page.getByRole("button", { name: "Try again" }).click();
  await expectPage(page, 33);
});
