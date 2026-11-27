import { test, expect } from "@playwright/test";
import {
  testRanks,
  testQuestionBank,
  getQuestionPool,
  createTestQuestions,
  summarizeTest,
  checkPracticeAnswer,
  getChoiceExplanation,
} from "../src/practice-test-content.js";
import { getMissedQuestions, sanitizeMissed, updateMissed } from "../src/review-history.js";
import { getFlashcards, getPronunciation, shuffleFlashcards } from "../src/flashcards-content.js";
import {
  createQuestionChoices,
  createChoiceSets,
  validQuestionChoices,
  getMultiSelectAnswers,
  gradeMultiSelect,
} from "../src/practice-test-choices.js";
import { getMultiSelectDefinition } from "../src/practice-test-multiselect.js";
import { studySections } from "../src/study-content.js";

async function openTest(page) {
  await page.getByRole("button", { name: /Practice Test Vocabulary/ }).click();
  await expect(page.locator("#practice-test")).toBeVisible();
}

async function seedQuestions(
  page,
  ids,
  rank = "rokyu",
  multipleChoice = false,
  format = "mixed",
) {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.addInitScript(
    ({ questionIds, target, choiceSets, answerFormat }) => {
      if (!localStorage.getItem("wj:test:session"))
        localStorage.setItem(
          "wj:test:session",
          JSON.stringify({
            config: {
              rank: target,
              categories: ["vocabulary", "general"],
              count: "all",
              format: answerFormat,
            },
            questionIds,
            choiceSets,
            answers: {},
            index: 0,
            stage: "active",
          }),
        );
    },
    {
      questionIds: ids,
      target: rank,
      answerFormat: format,
      choiceSets: multipleChoice
        ? createChoiceSets(
            ids.map((id) =>
              testQuestionBank.find((question) => question.id === id),
            ),
          )
        : undefined,
    },
  );
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await openTest(page);
}

test("flashcards retain cumulative vocabulary, correct language direction, and shuffle membership", () => {
  const counts = [30, 58, 84, 116, 136, 166];
  for (const [index, rank] of testRanks.entries()) {
    const cards = getFlashcards(rank.id);
    expect(cards).toHaveLength(counts[index]);
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
    expect(new Set(shuffleFlashcards(cards, () => 0).map((card) => card.id))).toEqual(new Set(cards.map((card) => card.id)));
    expect(cards.every((card) => card.english && card.japanese)).toBeTruthy();
  }
  const cards = getFlashcards("sankyu");
  expect(cards.find((card) => card.english === "Left").japanese).toBe("Hidari");
  expect(cards.find((card) => card.english === "Right").japanese).toBe("Migi");
  expect(cards.find((card) => card.japanese === "Shintai").english).toBe("Body movement/locomotion");
  expect(cards.find((card) => card.japanese === "Debana").english).toBe("The instant an opportunity for attack appears");
  expect(getPronunciation("Hajime")).toBe("HA-JEE-MEH");
  expect(getPronunciation("Dojo")).toBe("DOH-JOH");
  expect(getPronunciation("Tsugi Ashi")).toBe("SOO-GEE AH-SHEE");
  expect(getPronunciation("Ayumi Ashi")).toBe("AH-YOO-MEE AH-SHEE");
  const excluded = new Set(["Body movement/locomotion", "The instant an opportunity for attack appears"]);
  const japaneseAnswers = new Set(testQuestionBank.filter((question) => question.category === "vocabulary").map((question) => question.answer));
  for (const answer of japaneseAnswers) {
    if (!excluded.has(answer)) expect(getPronunciation(answer)).not.toBe("");
  }
});

test("flashcards support rank, both directions, flipping, shuffle, and saved position", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Flashcards Vocabulary practice" }).click();
  await expect(page.getByRole("region", { name: "Vocabulary flashcards" })).toBeVisible();
  await expect(page.locator("#cards-position")).toHaveText("1 / 30");
  await expect(page.locator("#cards-text")).toHaveText("Kyotsuke");
  await expect(page.locator("#cards-language")).toHaveText("JAPANESE");
  await expect(page.locator("#cards-source")).toBeHidden();
  await expect(page.locator("#cards-answer-pronunciation")).toBeHidden();
  await page.getByRole("button", { name: "Kyotsuke. Show answer" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#cards-face")).toHaveClass(/flipped/);
  await expect(page.locator("#cards-answer")).toHaveText("Attention");
  await expect(page.locator("#cards-answer-japanese")).toHaveText("Kyotsuke");
  await expect(page.locator("#cards-answer-pronunciation")).toBeVisible();
  await expect(page.locator("#cards-source")).toHaveAttribute("href", /#page=7$/);
  await page.getByRole("button", { name: "English to Japanese" }).click();
  await expect(page.locator("#cards-text")).toHaveText("Attention");
  await page.locator("#cards-face").click();
  await expect(page.locator("#cards-answer")).toHaveText("Kyotsuke");
  await expect(page.locator("#cards-answer-pronunciation")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("#cards-position")).toHaveText("2 / 30");
  await expect(page.locator("#cards-text")).toHaveText("Bow");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.locator("#cards-position")).toHaveText("1 / 30");
  await page.getByRole("combobox", { name: "Target rank" }).selectOption("gokyu");
  await expect(page.locator("#cards-position")).toHaveText("1 / 58");
  await page.getByRole("button", { name: "Shuffle", exact: true }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("wj:cards:state")));
  expect(new Set(saved.order).size).toBe(58);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const text = await page.locator("#cards-text").textContent();
  await page.getByRole("button", { name: "Study Guide Ranks & requirements" }).click();
  await page.getByRole("button", { name: "Flashcards Vocabulary practice" }).click();
  await expect(page.locator("#cards-text")).toHaveText(text);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Flashcards Vocabulary practice" }).click();
  await expect(page.locator("#cards-position")).toHaveText("2 / 58");
  await expect(page.locator("#cards-text")).toHaveText(text);
  await expect(page.getByRole("button", { name: "English to Japanese" })).toHaveAttribute("aria-pressed", "true");
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => {
      const app = document.querySelector(".app-layout")?.getBoundingClientRect();
      return Boolean(app && app.left >= -0.5 && app.right <= innerWidth + 0.5);
    })).toBeTruthy();
    await page.screenshot({ path: `test-results/${test.info().project.name}-flashcards-${width}.png`, fullPage: true });
  }
});

test("flashcards swipe left for next and right for previous without flipping", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Flashcards Vocabulary practice" }).click();
  const face = page.locator("#cards-face");
  await face.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 280, clientY: 300 });
  await face.dispatchEvent("pointerup", { pointerType: "touch", clientX: 180, clientY: 302 });
  await expect(page.locator("#cards-position")).toHaveText("2 / 30");
  await expect(face).not.toHaveClass(/flipped/);
  await face.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 180, clientY: 300 });
  await face.dispatchEvent("pointerup", { pointerType: "touch", clientX: 280, clientY: 302 });
  await expect(page.locator("#cards-position")).toHaveText("1 / 30");
  await expect(face).not.toHaveClass(/flipped/);
});

test("flashcards print a mirrored Japanese-front and English-back duplex layout", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Flashcards Vocabulary practice" }).click();
  await page.evaluate(() => { window.print = () => { window.__flashcardsPrinted = true; }; });
  await expect(page.getByRole("button", { name: "Print flashcards" })).toBeVisible();
  await page.getByRole("button", { name: "Print flashcards" }).click();
  expect(await page.evaluate(() => window.__flashcardsPrinted)).toBeTruthy();
  await expect(page.locator(".print-sheet")).toHaveCount(8);
  await expect(page.locator(".print-front")).toHaveCount(4);
  await expect(page.locator(".print-back")).toHaveCount(4);
  await expect(page.locator(".print-front").first().locator(".print-card:not(.print-card-spacer)")).toHaveCount(8);
  await expect(page.locator(".print-back").first().locator(".print-card-language").first()).toHaveText("ENGLISH");
  await expect(page.locator(".print-front").first().locator(".print-card-pronunciation")).toHaveCount(0);
  await expect(page.locator(".print-back").first().locator(".print-card-pronunciation").first()).toBeAttached();
  await expect(page.locator(".print-back").first().locator(".print-card-japanese").first()).not.toBeEmpty();
  await expect(page.locator(".print-back").first().locator(".print-card-rank").first()).toContainText("Rank:");
});

test("flashcard reset is confirmed and preserves missed-question history", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.goto("./", { waitUntil: "domcontentloaded" });
  const missed = testQuestionBank.find((question) => question.answer === "Kyotsuke").id;
  await page.evaluate((id) => localStorage.setItem("wj:test:missed", JSON.stringify([id])), missed);
  await page.getByRole("button", { name: "Flashcards Vocabulary practice" }).click();
  await page.getByRole("combobox", { name: "Target rank" }).selectOption("sankyu");
  await page.getByRole("button", { name: "Reset Flashcards" }).click();
  const dialog = page.getByRole("dialog", { name: "Reset Flashcards?" });
  await expect(dialog).toContainText("saved direction, order, and position");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#cards-position")).toHaveText("1 / 116");
  await page.getByRole("button", { name: "Reset Flashcards" }).click();
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("#cards-position")).toHaveText("1 / 30");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wj:test:missed")))).toEqual([missed]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Flashcards Vocabulary practice" }).click();
  await expect(page.locator("#cards-position")).toHaveText("1 / 30");
});

test("missed history ignores unknown and open questions and respects rank/category boundaries", () => {
  const low = testQuestionBank.find((question) => question.answer === "Kyotsuke");
  const high = testQuestionBank.find((question) => question.rank === "sankyu" && question.category === "general" && question.hasAnswer);
  const open = testQuestionBank.find((question) => !question.hasAnswer);
  let history = updateMissed([], low.id, "review");
  history = updateMissed(history, high.id, "review");
  expect(sanitizeMissed([low.id, low.id, "missing", null])).toEqual([low.id]);
  expect(getMissedQuestions(history, "gokyu").map((question) => question.id)).toEqual([low.id]);
  expect(getMissedQuestions(history, "sankyu", ["general"]).map((question) => question.id)).toEqual([high.id]);
  expect(updateMissed(history, open.id, "review")).toEqual(history);
  expect(updateMissed(history, low.id, "correct")).toEqual([high.id]);
});

test("missed questions persist across attempts and leave review after a correct answer", async ({ page }) => {
  const vocabulary = testQuestionBank.find((question) => question.answer === "Kyotsuke");
  await seedQuestions(page, [vocabulary.id]);
  await page.getByRole("textbox", { name: "Your answer" }).fill("wrong");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wj:test:missed")))).toEqual([vocabulary.id]);
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await page.getByRole("button", { name: "New test", exact: true }).click();
  await page.getByRole("combobox", { name: "Target rank" }).selectOption("gokyu");
  await expect(page.locator("#test-review-count")).toHaveText("1 missed question available");
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.locator("#test-review-count")).toHaveText("1 missed question available");
  await page.getByRole("button", { name: "Review missed questions" }).click();
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 1");
  await expect(page.locator("#test-question-prompt")).toHaveText(vocabulary.prompt);
  const radio = page.getByRole("radio", { name: vocabulary.answer, exact: true });
  await radio.check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wj:test:missed")))).toEqual([]);
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await page.getByRole("button", { name: "New test", exact: true }).click();
  await expect(page.getByRole("button", { name: "Review missed questions" })).toBeDisabled();
});

test("manual rating changes update missed history without including unassessed questions", async ({ page }) => {
  const question = testQuestionBank.find((entry) => entry.answer === "Kyotsuke");
  await seedQuestions(page, [question.id]);
  await page.getByRole("textbox", { name: "Your answer" }).fill("wrong");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wj:test:missed")))).toEqual([]);
  await page.getByRole("button", { name: "Needs review", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wj:test:missed")))).toEqual([question.id]);
});

test("incorrect selections show source-backed explanations and an honest fallback", async ({
  page,
}) => {
  const founder = testQuestionBank.find(
    (question) => question.answer === "Jigoro Kano",
  );
  const uniform = testQuestionBank.find(
    (question) => question.answer === "Obi",
  );
  const year = testQuestionBank.find((question) => question.answer === "1882");
  expect(getChoiceExplanation("Yoshitsugu Yamishita", founder.id)).toEqual({
    text: "The guide lists this person as one of the Four Heavenly Lords of Judo.",
    page: 12,
  });
  expect(getChoiceExplanation("Uwagi", uniform.id)).toEqual({
    text: "The guide defines this as: Judo Uniform Jacket.",
    prefix: "The guide defines this as: ",
    value: "Judo Uniform Jacket",
    page: 13,
  });
  const randori = testQuestionBank.find((question) => question.answer === "Randori");
  expect(getChoiceExplanation("Shumatsu Undo", randori.id)).toMatchObject({
    value: "Cool-down Exercises in Judo",
    page: 13,
  });
  expect(getChoiceExplanation("1984", year.id)).toBeNull();
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.addInitScript(
    ({ founderId, uniformId, yearId }) => {
      if (!localStorage.getItem("wj:test:session"))
        localStorage.setItem(
          "wj:test:session",
          JSON.stringify({
            config: {
              rank: "sankyu",
              categories: ["general", "vocabulary"],
              count: "all",
            },
            questionIds: [founderId, uniformId, yearId],
            answers: {},
            index: 0,
            stage: "active",
            choiceSets: {
              [founderId]: [
                "Jigoro Kano",
                "Yoshitsugu Yamishita",
                "Shiro Saigo",
                "Kyuzo Mifune",
              ],
              [uniformId]: ["Obi", "Uwagi", "Zubon", "Sode"],
              [yearId]: ["1882", "1964", "1984", "1992"],
            },
          }),
        );
    },
    { founderId: founder.id, uniformId: uniform.id, yearId: year.id },
  );
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await openTest(page);
  if (test.info().project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 900 });
  await expect(page.locator("#test-choice-explanations")).toBeHidden();
  await page
    .getByRole("radio", { name: "Yoshitsugu Yamishita", exact: true })
    .check();
  await expect(page.locator("#test-choice-explanations")).toBeHidden();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  const box = page.getByRole("region", { name: "About your selection" });
  await expect(box).toBeVisible();
  await expect(page.locator("#test-answer")).toHaveCSS("font-weight", "700");
  await expect(box).toHaveCSS("background-color", "rgb(255, 247, 223)");
  await expect(box).toHaveCSS("border-left-color", "rgb(174, 122, 22)");
  await expect(page.locator("#test-answer-panel")).toHaveCSS("background-color", "rgb(237, 242, 248)");
  await expect(
    box.getByRole("heading", { name: "Yoshitsugu Yamishita" }),
  ).toBeVisible();
  await expect(box).toContainText("one of the Four Heavenly Lords of Judo");
  await expect(
    box.getByRole("link", { name: "Student Guide - PDF page 12" }),
  ).toHaveAttribute("href", /#page=12$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-choice-explanation.png`,
    fullPage: true,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(
    page.getByRole("region", { name: "About your selection" }),
  ).toContainText("Yoshitsugu Yamishita");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(box).toBeHidden();
  await page.getByRole("radio", { name: "Uwagi", exact: true }).check();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(box).toContainText("Judo Uniform Jacket");
  await expect(box.locator("p strong")).toHaveText("Judo Uniform Jacket");
  await expect(box.locator("p strong")).toHaveCSS("font-weight", "700");
  await expect(box.locator("p").first()).toHaveCSS("font-weight", "400");
  await page.screenshot({ path: `test-results/${test.info().project.name}-bold-definition.png`, fullPage: true });
  await expect(
    box.getByRole("link", { name: "Student Guide - PDF page 13" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "1984", exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(box).toContainText(
    "No explanation for this selection is available in the study guide.",
  );
  await expect(box.getByRole("link")).toHaveCount(0);
});

test("multi-select explanations cover each wrong selection and stay hidden for a correct set", async ({
  page,
}) => {
  const question = testQuestionBank.find(
    (entry) => entry.prompt === "Name the Four Heavenly Lords of Judo.",
  );
  const correct = getMultiSelectAnswers(question);
  await seedQuestions(page, [question.id], "yonkyu", true);
  const options = await page
    .locator("#test-choices input")
    .evaluateAll((inputs) => inputs.map((input) => input.value));
  const wrong = options
    .filter((option) => !correct.includes(option))
    .slice(0, 2);
  for (const name of [...correct.slice(0, 2), ...wrong])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  const box = page.getByRole("region", { name: "About your selection" });
  await expect(box.locator(".test-choice-explanation")).toHaveCount(2);
  for (const name of wrong)
    await expect(box.getByRole("heading", { name, exact: true })).toBeVisible();
  for (const name of correct)
    await expect(box.getByRole("heading", { name, exact: true })).toHaveCount(
      0,
    );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await page.getByRole("button", { name: "Retry missed questions" }).click();
  await expect(page.locator("#test-choice-explanations")).toBeHidden();
  for (const name of correct)
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-choice-explanations")).toBeHidden();
});

test("vocabulary terms stand out without changing general-information headings or overflowing mobile", async ({
  page,
}) => {
  const short = testQuestionBank.find((question) =>
    question.prompt.endsWith(": No"),
  );
  const long = testQuestionBank.find(
    (question) => question.answer === "Happo No Kuzushi",
  );
  const general = testQuestionBank.find(
    (question) => question.answer === "Jigoro Kano",
  );
  await seedQuestions(page, [short.id, long.id, general.id], "yonkyu", true);
  if (test.info().project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 900 });
  await expect(page.locator(".test-question-term")).toHaveText("No");
  await expect(page.locator(".test-question-term")).toHaveCSS(
    "font-weight",
    "750",
  );
  await expect(page.locator(".test-question-term")).toHaveCSS(
    "font-style",
    "italic",
  );
  await expect(page.locator(".test-question-term")).toHaveCSS(
    "color",
    "rgb(160, 19, 53)",
  );
  await expect(page.locator(".test-question-instruction")).toHaveCSS(
    "font-weight",
    "400",
  );
  await expect(page.locator("#test-question-prompt")).toHaveText(short.prompt);
  await page.screenshot({
    path: `test-results/${test.info().project.name}-vocabulary-emphasis.png`,
    fullPage: true,
  });
  await page.getByRole("radio", { name: short.answer, exact: true }).check();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#test-question-prompt")).toHaveText(long.prompt);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("radio", { name: long.answer, exact: true }).check();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#test-question-prompt")).toHaveText(
    general.prompt,
  );
  await expect(page.locator(".test-question-term")).toHaveCount(0);
});

test("Four Heavenly Lords checkboxes require exactly all source names without extras", async ({
  page,
}) => {
  const question = testQuestionBank.find(
    (entry) => entry.prompt === "Name the Four Heavenly Lords of Judo.",
  );
  const correct = getMultiSelectAnswers(question);
  expect(correct).toEqual([
    "Shiro Saigo",
    "Tsunejiro Tomita",
    "Sakujiro Yokoyama",
    "Yoshitsugu Yamishita",
  ]);
  expect(gradeMultiSelect(question, correct.slice(0, 3)).rating).toBe("review");
  expect(gradeMultiSelect(question, [...correct, "Jigoro Kano"]).rating).toBe(
    "review",
  );
  expect(
    gradeMultiSelect(question, [correct[0], correct[0], correct[1], correct[2]])
      .rating,
  ).toBe("review");
  expect(gradeMultiSelect(question, [...correct].reverse()).rating).toBe(
    "correct",
  );
  const orders = new Set();
  for (let index = 0; index < 20; index++) {
    const choices = createQuestionChoices(question);
    expect(choices).toHaveLength(7);
    expect(validQuestionChoices(question, choices)).toBeTruthy();
    expect(gradeMultiSelect(question, choices).rating).toBe("review");
    orders.add(choices.join(","));
  }
  expect(orders.size).toBeGreaterThan(1);
  await seedQuestions(page, [question.id], "yonkyu");
  await expect(
    page.getByRole("group", { name: "Select 4 names" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(7);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Your answer" })).toBeHidden();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Select an answer before continuing.",
  );
  const order = await page
    .locator("#test-choices input")
    .evaluateAll((inputs) => inputs.map((input) => input.value));
  const wrong = order.find((name) => !correct.includes(name));
  for (const name of [...correct.slice(0, 3), wrong])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  expect(
    await page
      .locator("#test-choices input")
      .evaluateAll((inputs) => inputs.map((input) => input.value)),
  ).toEqual(order);
  await expect(page.locator("#test-choices input:checked")).toHaveCount(4);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Incorrect - select all four correct names, with no extras.",
  );
  await expect(page.locator('.test-choice[data-result="correct"]')).toHaveCount(
    4,
  );
  await expect(page.locator('.test-choice[data-result="review"]')).toHaveCount(
    1,
  );
  await expect(page.getByRole("checkbox").first()).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-four-lords-checkboxes.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("0%");
  await page.getByRole("button", { name: "Retry missed questions" }).click();
  for (const name of correct)
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - you selected all four names.",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - you selected all four names.",
  );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("ordered rank and number questions retain selection order, grade it, and support retry", async ({
  page,
}) => {
  const expected = [
    [
      "rokyu:general:8:0:6",
      [
        "Ichi",
        "Ni",
        "San",
        "Shi",
        "Go",
        "Roku",
        "Shichi",
        "Hachi",
        "Kyu",
        "Jyu",
      ],
    ],
    [
      "sankyu:general:14:1:4",
      [
        "Ikkyu - 1st Degree Brown",
        "Nikyu - 2nd Degree Brown",
        "Sankyu - 3rd Degree Brown",
        "Yonkyu - Green",
        "Gokyu - Orange",
        "Rokyu - Yellow",
      ],
    ],
    [
      "ikkyu:general:18:1:1",
      [
        "Ju Ichi",
        "Ju Ni",
        "Ju San",
        "Ju Shi",
        "Ju Go",
        "Ju Roku",
        "Ju Shichi",
        "Ju Hachi",
        "Ju Kyu",
        "Niju",
      ],
    ],
  ];
  for (const [id, sequence] of expected) {
    const question = testQuestionBank.find((item) => item.id === id);
    expect(getMultiSelectDefinition(question).answers).toEqual(sequence);
    expect(gradeMultiSelect(question, sequence).rating).toBe("correct");
    expect(gradeMultiSelect(question, [...sequence].reverse()).rating).toBe(
      "review",
    );
    expect(gradeMultiSelect(question, sequence.slice(1)).rating).toBe("review");
    expect(
      gradeMultiSelect(question, [...sequence.slice(0, -1), sequence[0]])
        .rating,
    ).toBe("review");
  }
  await seedQuestions(
    page,
    expected.map(([id]) => id),
    "ikkyu",
    true,
  );
  if (test.info().project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 900 });
  const first = expected[0][1];
  await expect(
    page.getByRole("group", { name: "Select 10 numbers in order" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(10);
  await page.getByRole("checkbox", { name: first[1], exact: true }).check();
  await page.getByRole("checkbox", { name: first[0], exact: true }).check();
  await expect(page.locator("#test-selection-order")).toHaveText(
    "Selected order: 1. Ni; 2. Ichi",
  );
  await page.getByRole("checkbox", { name: first[1], exact: true }).uncheck();
  await expect(page.locator("#test-selection-order")).toHaveText(
    "Selected order: 1. Ichi",
  );
  await page.getByRole("checkbox", { name: first[1], exact: true }).check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.locator("#test-selection-order")).toHaveText(
    "Selected order: 1. Ichi; 2. Ni",
  );
  for (const name of first.slice(2))
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - you selected every item in order.",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const ranks = expected[1][1];
  await expect(
    page.getByRole("group", { name: "Select 6 ranks in order" }),
  ).toBeVisible();
  for (const rank of [...ranks].reverse())
    await page.getByRole("checkbox", { name: rank, exact: true }).check();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Incorrect - select every item in the requested order.",
  );
  await expect(page.locator('.test-choice[data-result="review"]')).toHaveCount(
    6,
  );
  await expect(page.locator("#test-selection-order")).toContainText(
    "1. Rokyu - Yellow",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-ordered-practice.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (const name of expected[2][1])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - you selected every item in order.",
  );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("67%");
  await page.getByRole("button", { name: "Retry missed questions" }).click();
  for (const rank of ranks)
    await page.getByRole("checkbox", { name: rank, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - you selected every item in order.",
  );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("existing written drafts remain written while untouched ordered questions upgrade", async ({
  page,
}) => {
  const first = "rokyu:general:8:0:6";
  const second = "sankyu:general:14:1:4";
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.addInitScript(
    ({ firstId, secondId }) =>
      localStorage.setItem(
        "wj:test:session",
        JSON.stringify({
          config: {
            rank: "sankyu",
            categories: ["general"],
            count: "all",
            format: "mixed",
          },
          questionIds: [firstId, secondId],
          answers: {
            [firstId]: { text: "Ichi, Ni", revealed: false, rating: null },
          },
          index: 0,
          stage: "active",
        }),
      ),
    { firstId: first, secondId: second },
  );
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.getByRole("textbox", { name: "Your answer" })).toHaveValue(
    "Ichi, Ni",
  );
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("Ichi, Ni, San, Shi, Go, Roku, Shichi, Hachi, Kyu, Jyu");
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Select 6 ranks in order" }),
  ).toBeVisible();
});

test("list definitions cover source lists while demonstrations and personal responses stay written", () => {
  const lists = testQuestionBank.filter((question) =>
    getMultiSelectDefinition(question),
  );
  expect(lists).toHaveLength(18);
  for (const question of lists) {
    const definition = getMultiSelectDefinition(question);
    const choices = createQuestionChoices(question);
    expect(validQuestionChoices(question, choices)).toBeTruthy();
    expect(choices).toHaveLength(
      definition.answers.length + Math.min(3, definition.distractors.length),
    );
    expect(
      gradeMultiSelect(question, definition.answers.slice(0, definition.count))
        .rating,
    ).toBe("correct");
    expect(
      gradeMultiSelect(
        question,
        definition.answers.slice(0, definition.count - 1),
      ).rating,
    ).toBe("review");
    expect(
      gradeMultiSelect(
        question,
        definition.ordered ? [...definition.answers].reverse() : choices,
      ).rating,
    ).toBe("review");
  }
  for (const question of testQuestionBank.filter(
    (entry) =>
      entry.prompt.startsWith("Be able to demonstrate") ||
      entry.prompt === "Tell us about your judo journey.",
  )) {
    expect(getMultiSelectDefinition(question)).toBeNull();
    expect(createQuestionChoices(question)).toEqual([]);
  }
  const source = studySections
    .find((section) => section.id === "sankyu")
    .pages.find((page) => page.number === 14)
    .blocks.find((block) => block.questions)
    .questions.find(
      ([, prompt]) => prompt === "List three American Olympic Medalist.",
    );
  expect(source[2]).toBe("1.\n2.\n3.");
});

test("American Olympic medalists accept any three verified names, not an arbitrary fixed trio", async ({
  page,
}) => {
  const question = testQuestionBank.find(
    (entry) => entry.id === "sankyu:general:14:1:1",
  );
  const definition = getMultiSelectDefinition(question);
  expect(definition.count).toBe(3);
  expect(definition.answers).toHaveLength(4);
  expect(question.supplemental).toBeTruthy();
  expect(question.references).toHaveLength(4);
  expect(
    gradeMultiSelect(question, [
      "Kayla Harrison",
      "Travis Stevens",
      "Ronda Rousey",
    ]).rating,
  ).toBe("correct");
  expect(
    gradeMultiSelect(question, [
      "Kayla Harrison",
      "Marti Malloy",
      "Ronda Rousey",
    ]).rating,
  ).toBe("correct");
  expect(gradeMultiSelect(question, definition.answers).rating).toBe("review");
  await seedQuestions(page, [question.id], "sankyu");
  await expect(
    page.getByRole("group", { name: "Select 3 names" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(7);
  const order = await page
    .locator("#test-choices input")
    .evaluateAll((inputs) => inputs.map((input) => input.value));
  const wrong = order.find((name) => !definition.answers.includes(name));
  for (const name of ["Kayla Harrison", "Travis Stevens", wrong])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "review",
  );
  await expect(page.locator("#test-answer-title")).toHaveText(
    "Verified reference examples",
  );
  await expect(page.locator("#test-choices")).toContainText(
    "Also a valid answer",
  );
  await expect(page.locator("#test-source-note")).toContainText(
    "guide leaves this answer blank",
  );
  await expect(
    page.getByRole("link", { name: "Team USA - Kayla Harrison" }),
  ).toHaveAttribute("href", "https://www.teamusa.com/profiles/kayla-harrison");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-olympic-checkboxes.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("0%");
  await page.getByRole("button", { name: "Retry missed questions" }).click();
  for (const name of ["Kayla Harrison", "Marti Malloy", "Ronda Rousey"])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.locator("#test-choices input:checked")).toHaveCount(3);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - you selected three valid names.",
  );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("technique-list checkboxes use the appropriate two, three, and five answer counts", async ({
  page,
}) => {
  const ids = [
    "rokyu:general:8:0:5",
    "gokyu:general:10:0:0",
    "sankyu:general:14:1:3",
  ];
  await seedQuestions(page, ids, "sankyu");
  for (const id of ids) {
    const question = testQuestionBank.find((entry) => entry.id === id);
    const definition = getMultiSelectDefinition(question);
    await expect(
      page.getByRole("group", { name: `Select ${definition.count} answers` }),
    ).toBeVisible();
    for (const answer of definition.answers)
      await page.getByRole("checkbox", { name: answer, exact: true }).check();
    await page.locator("#test-next").click();
    await expect(page.locator("#test-active")).toHaveAttribute(
      "data-result",
      "correct",
    );
    await page.locator("#test-next").click();
  }
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("Shintai and Debana use related English-definition choices with correct grading", async ({
  page,
}) => {
  const questions = ["Shintai", "Debana"].map((term) =>
    testQuestionBank.find((question) => question.prompt.endsWith(`: ${term}`)),
  );
  const definitions = new Set([
    "Body movement/locomotion",
    "The instant an opportunity for attack appears",
    "Off Balance",
    "Entry into a Throw",
    "Execution of a Throw",
    "Forms of Gripping an Opponent",
    "Repetitive Attack Practice without Throwing",
    "Repetitive Throwing Practice without Resistance",
  ]);
  for (const question of questions) {
    const choices = createQuestionChoices(question);
    expect(choices).toHaveLength(4);
    expect(choices.every((choice) => definitions.has(choice))).toBeTruthy();
    expect(validQuestionChoices(question, choices)).toBeTruthy();
  }
  await seedQuestions(
    page,
    questions.map((question) => question.id),
    "sankyu",
    true,
  );
  await expect(page.getByRole("textbox", { name: "Your answer" })).toBeHidden();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await expect(page.locator(".test-question-term")).toHaveText("Shintai");
  await page
    .getByRole("radio", { name: questions[0].answer, exact: true })
    .check();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await page.screenshot({
    path: `test-results/${test.info().project.name}-shintai-choice.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".test-question-term")).toHaveText("Debana");
  const wrong = await page
    .locator("#test-choices input")
    .evaluateAll(
      (inputs, correct) =>
        inputs.map((input) => input.value).find((value) => value !== correct),
      questions[1].answer,
    );
  await page.getByRole("radio", { name: wrong, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "review",
  );
  await expect(page.locator("#test-answer")).toHaveText(questions[1].answer);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("multiple-choice distractors are related, unique, varied, and never an accepted alternative answer", () => {
  let seed = 9241;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let multipleChoice = 0;
  for (const question of testQuestionBank) {
    const choices = createQuestionChoices(question, random);
    if (!choices.length) continue;
    multipleChoice++;
    if (getMultiSelectAnswers(question).length) {
      expect(choices).toHaveLength(
        getMultiSelectAnswers(question).length +
          Math.min(3, getMultiSelectDefinition(question).distractors.length),
      );
      expect(validQuestionChoices(question, choices)).toBeTruthy();
      continue;
    }
    expect(choices).toHaveLength(4);
    expect(validQuestionChoices(question, choices)).toBeTruthy();
    expect(
      choices.filter(
        (choice) => checkPracticeAnswer(question, choice).rating === "correct",
      ),
    ).toHaveLength(1);
  }
  expect(multipleChoice).toBe(189);
  const obi = testQuestionBank.find((question) => question.answer === "Obi");
  const positions = new Set();
  const distractors = new Set();
  for (let index = 0; index < 100; index++) {
    const choices = createQuestionChoices(obi, random);
    expect(
      choices.every((choice) =>
        ["Obi", "Uwagi", "Zubon", "Sode", "Eri"].includes(choice),
      ),
    ).toBeTruthy();
    positions.add(choices.indexOf("Obi"));
    distractors.add(
      choices
        .filter((choice) => choice !== "Obi")
        .sort((left, right) => left.localeCompare(right))
        .join(","),
    );
  }
  expect(positions.size).toBe(4);
  expect(distractors.size).toBe(4);
  const corners = testQuestionBank.find(
    (question) => question.answer === "Shiho",
  );
  expect(createQuestionChoices(corners, random)).not.toContain("Yoko or Shiho");
  expect(validQuestionChoices(obi, ["Obi", "Obi", "Uke", "Tori"])).toBeFalsy();
  expect(
    createQuestionChoices(
      testQuestionBank.find((question) =>
        question.prompt.startsWith("What is the ultimate goal of Judo"),
      ),
    ),
  ).toEqual([]);
  expect(
    createQuestionChoices(
      testQuestionBank.find((question) => !question.hasAnswer),
    ),
  ).toEqual([]);
});

test("uniform multiple choice persists choices and selection, grades colors, and falls back to written lists", async ({
  page,
}) => {
  const uniform = testQuestionBank.find(
    (question) => question.answer === "Obi",
  );
  const written = testQuestionBank.find((question) =>
    question.prompt.startsWith("What is the ultimate goal of Judo"),
  );
  await seedQuestions(page, [uniform.id, written.id], "sankyu", true);
  await expect(page.getByRole("textbox", { name: "Your answer" })).toBeHidden();
  await expect(page.getByRole("radio")).toHaveCount(4);
  const values = await page
    .locator("#test-choices input")
    .evaluateAll((inputs) => inputs.map((input) => input.value));
  expect(
    values.every((value) =>
      ["Obi", "Uwagi", "Zubon", "Sode", "Eri"].includes(value),
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Select an answer before continuing.",
  );
  const wrong = values.find((value) => value !== "Obi");
  await page.getByRole("radio", { name: wrong, exact: true }).check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  expect(
    await page
      .locator("#test-choices input")
      .evaluateAll((inputs) => inputs.map((input) => input.value)),
  ).toEqual(values);
  await expect(
    page.getByRole("radio", { name: wrong, exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Incorrect - review the guide answer.",
  );
  await expect(page.locator('.test-choice[data-result="review"]')).toHaveCSS(
    "background-color",
    "rgb(255, 241, 240)",
  );
  await expect(page.locator('.test-choice[data-result="correct"]')).toHaveCSS(
    "background-color",
    "rgb(239, 250, 242)",
  );
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Got it", exact: true }),
  ).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-multiple-choice.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Your answer" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Your answer" }).fill(written.answer);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("50%");
  await page.getByRole("button", { name: "Retry missed questions" }).click();
  await page.getByRole("radio", { name: "Obi", exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toContainText("Correct");
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("new tests default to mixed choices while keeping all cumulative questions and allowing written recall", async ({
  page,
}) => {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(
    page.getByRole("combobox", { name: "Answer format" }),
  ).toHaveValue("mixed");
  await page
    .getByRole("combobox", { name: "Target rank" })
    .selectOption("sankyu");
  await page.getByRole("button", { name: "Start test", exact: true }).click();
  const session = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("wj:test:session")),
  );
  expect(session.questionIds).toHaveLength(142);
  const eligible = getQuestionPool("sankyu").filter(
    (question) => createQuestionChoices(question).length,
  );
  expect(
    Object.keys(session.choiceSets).sort((left, right) =>
      left.localeCompare(right),
    ),
  ).toEqual(
    eligible
      .map((question) => question.id)
      .sort((left, right) => left.localeCompare(right)),
  );
  await page.getByRole("button", { name: "Finish test", exact: true }).click();
  await page.getByRole("button", { name: "Retake test", exact: true }).click();
  const retake = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("wj:test:session")),
  );
  expect(retake.choiceSets).not.toEqual(session.choiceSets);
  await page.getByRole("button", { name: "Finish test", exact: true }).click();
  await page.getByRole("button", { name: "New test", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Answer format" })
    .selectOption("written");
  await page.getByRole("button", { name: "Start test", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your answer" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("wj:test:session")).choiceSets,
    ),
  ).toEqual({});
});

test("ultimate goal accepts equivalent wording without optional qualifiers", async ({
  page,
}) => {
  const question = testQuestionBank.find(
    (entry) =>
      entry.prompt ===
      "What is the ultimate goal of Judo as defined by Dr. Kano?",
  );
  const response = "the harmonious development and perfection of character";
  for (const valid of [
    response,
    question.answer,
    "Harmonious development and eventual perfection of character.",
    "The harmonious development and perfection of the human character.",
  ])
    expect(checkPracticeAnswer(question, valid).rating).toBe("correct");
  for (const invalid of [
    "development and perfection of character",
    "harmonious development of character",
    "harmonious development and perfection",
    "not the harmonious development and perfection of character",
    "winning judo competitions",
    "",
  ])
    expect(checkPracticeAnswer(question, invalid).rating).toBe("review");
  await seedQuestions(page, [question.id], "yonkyu");
  await page.getByRole("textbox", { name: "Your answer" }).fill(response);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await expect(page.locator("#test-response")).toHaveCSS(
    "background-color",
    "rgb(239, 250, 242)",
  );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("rank names in highest-to-lowest order count without belt descriptions", async ({
  page,
}) => {
  const question = testQuestionBank.find(
    (entry) =>
      entry.prompt ===
      "Name the six Kyu ranks and belts from highest to lowest.",
  );
  const response = "ikkyu, nikyu, sankyu, yonkyu, gokyu, rokyu";
  expect(checkPracticeAnswer(question, response).rating).toBe("correct");
  expect(checkPracticeAnswer(question, question.answer).rating).toBe("correct");
  for (const invalid of [
    "rokyu, gokyu, yonkyu, sankyu, nikyu, ikkyu",
    "ikkyu, nikyu, sankyu, gokyu, yonkyu, rokyu",
    "ikkyu, nikyu, sankyu, yonkyu, gokyu",
    "ikkyu, nikyu, sankyu, yonkyu, gokyu, gokyu",
    `${response}, shodan`,
  ]) {
    expect(checkPracticeAnswer(question, invalid).rating).toBe("review");
  }
  await seedQuestions(page, [question.id], "sankyu", false, "written");
  await page.getByRole("textbox", { name: "Your answer" }).fill(response);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await expect(page.locator("#test-response")).toHaveCSS(
    "background-color",
    "rgb(239, 250, 242)",
  );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("left and right use the corrected Japanese terms in the guide and practice test", async ({
  page,
}) => {
  const left = testQuestionBank.find(
    (question) => question.prompt === "Complete the vocabulary pair: Left",
  );
  const right = testQuestionBank.find(
    (question) => question.prompt === "Complete the vocabulary pair: Right",
  );
  const rows = studySections
    .find((section) => section.id === "rokyu")
    .pages[0].blocks.find((block) => block.heading === "Vocabulary").rows;
  expect(rows).toContainEqual(["Left", "Hidari"]);
  expect(rows).toContainEqual(["Right", "Migi"]);
  expect(left.answer).toBe("Hidari");
  expect(right.answer).toBe("Migi");
  expect(checkPracticeAnswer(left, "hidari").rating).toBe("correct");
  expect(checkPracticeAnswer(left, "migi").rating).toBe("review");
  expect(checkPracticeAnswer(right, "migi").rating).toBe("correct");
  expect(checkPracticeAnswer(right, "hidari").rating).toBe("review");
  await seedQuestions(page, [left.id, right.id]);
  await page.getByRole("textbox", { name: "Your answer" }).fill("hidari");
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await expect(page.locator("#test-answer")).toHaveText("Hidari");
  await expect(page.locator("#test-source-note")).toContainText(
    "source reverses",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Your answer" }).fill("migi");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await expect(page.locator("#test-answer")).toHaveText("Migi");
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
});

test("restoring auto-checked direction answers regrades them without changing manual ratings", async ({
  page,
}) => {
  const left = testQuestionBank.find(
    (question) => question.prompt === "Complete the vocabulary pair: Left",
  );
  const right = testQuestionBank.find(
    (question) => question.prompt === "Complete the vocabulary pair: Right",
  );
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.addInitScript(
    ({ leftId, rightId }) => {
      if (!localStorage.getItem("wj:test:session"))
        localStorage.setItem(
          "wj:test:session",
          JSON.stringify({
            config: { rank: "rokyu", categories: ["vocabulary"], count: "all" },
            questionIds: [leftId, rightId],
            answers: {
              [leftId]: {
                text: "hidari",
                revealed: true,
                checked: true,
                rating: "review",
              },
              [rightId]: {
                text: "hidari",
                revealed: true,
                checked: true,
                rating: "correct",
              },
            },
            index: 0,
            stage: "active",
          }),
        );
    },
    { leftId: left.id, rightId: right.id },
  );
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "review",
  );
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(
    page.getByRole("button", { name: "Got it", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("answer checks tolerate formatting and explicit aliases but reject wrong and partial answers", () => {
  const check = (answer, response, category = "vocabulary") =>
    checkPracticeAnswer({ answer, category, hasAnswer: true }, response);
  expect(check("Tsugi Ashi", " TSUGI-ASHI! ").rating).toBe("correct");
  expect(check("Goshi or Koshi", "koshi").rating).toBe("correct");
  expect(check("Shime/Jime", "jime").rating).toBe("correct");
  expect(check("Jigoro Kano", "Jigoro Kan\u014d.", "general").rating).toBe(
    "correct",
  );
  expect(check("The Kodokan", "Kodokan", "general").rating).toBe("correct");
  expect(check("1882", "188", "general").rating).toBe("review");
  expect(check("Tori", "Uke").rating).toBe("review");
  expect(check("Tori", "").rating).toBe("review");
  expect(check("Nage Waza / Throwing", "Throwing", "general").rating).toBe(
    "review",
  );
  expect(checkPracticeAnswer({ hasAnswer: false }, "My response").rating).toBe(
    "reviewed",
  );
  for (const question of testQuestionBank.filter((entry) => entry.hasAnswer))
    expect(checkPracticeAnswer(question, question.answer).rating).toBe(
      "correct",
    );
});

test("Next checks answers before advancing and preserves checked feedback across reloads", async ({
  page,
}) => {
  const vocabulary = testQuestionBank.find(
    (question) => question.answer === "Kyotsuke",
  );
  const general = testQuestionBank.find(
    (question) => question.answer === "Jigoro Kano",
  );
  await seedQuestions(page, [vocabulary.id, general.id]);
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "neutral",
  );
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Enter an answer before continuing.",
  );
  await expect(
    page.getByRole("textbox", { name: "Your answer" }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 2");
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("  KYOTSUKE!  ");
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - your answer matches the guide.",
  );
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 2");
  await expect(page.locator("#test-answer")).toHaveText("Kyotsuke");
  await expect(page.locator("#test-response")).toHaveCSS(
    "background-color",
    "rgb(239, 250, 242)",
  );
  await expect(page.locator("#test-response")).toHaveCSS(
    "border-top-color",
    "rgb(36, 130, 75)",
  );
  await expect(page.locator("#test-feedback")).toHaveCSS(
    "color",
    "rgb(22, 101, 52)",
  );
  await page.screenshot({
    path: `test-results/${test.info().project.name}-answer-correct.png`,
    fullPage: true,
  });
  await expect(
    page.getByRole("button", { name: "Got it", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload({ waitUntil: "domcontentloaded" });
  await openTest(page);
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await expect(page.locator("#test-feedback")).toHaveText(
    "Correct - your answer matches the guide.",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#test-position")).toHaveText("Question 2 of 2");
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "neutral",
  );
  await page.getByRole("textbox", { name: "Your answer" }).fill("JIGORO KANO.");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toContainText("Correct");
  await expect(page.locator("#test-active")).toBeVisible();
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("100%");
  await expect(page.locator("#test-recalled")).toHaveText("2 / 2");
});

test("automatic mismatches enter review, manual overrides remain possible, and open responses are unscored", async ({
  page,
}) => {
  const vocabulary = testQuestionBank.find(
    (question) => question.answer === "Kyotsuke",
  );
  const general = testQuestionBank.find(
    (question) => question.answer === "Jigoro Kano",
  );
  const open = testQuestionBank.find(
    (question) => question.prompt === "Tell us about your judo journey.",
  );
  await seedQuestions(page, [vocabulary.id, general.id, open.id], "ikkyu");
  await page.getByRole("textbox", { name: "Your answer" }).fill("Uke");
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toContainText("Needs review");
  await expect(page.locator("#test-response")).toHaveCSS(
    "background-color",
    "rgb(255, 241, 240)",
  );
  await expect(page.locator("#test-response")).toHaveCSS(
    "border-top-color",
    "rgb(196, 62, 53)",
  );
  await expect(page.locator("#test-feedback")).toHaveCSS(
    "color",
    "rgb(145, 32, 24)",
  );
  await expect(page.locator("#test-answer")).toHaveText("Kyotsuke");
  await expect(
    page.getByRole("button", { name: "Needs review", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-answer-check.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Your answer" }).fill("Kano Jigoro");
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-feedback")).toContainText("Needs review");
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await expect(page.locator("#test-feedback")).toHaveText("Recalled");
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "correct",
  );
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("I began judo this year.");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator("#test-feedback")).toContainText(
    "Open response recorded",
  );
  await expect(page.locator("#test-active")).toHaveAttribute(
    "data-result",
    "neutral",
  );
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("50%");
  await expect(page.locator("#test-recalled")).toHaveText("1 / 2");
  await expect(page.locator("#test-reflections")).toContainText(
    "1 / 1 open responses reviewed",
  );
  await page.getByRole("button", { name: "Retry missed questions" }).click();
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 1");
  await expect(page.locator("#test-question-prompt")).toHaveText(
    vocabulary.prompt,
  );
});

test("each test includes its target rank and every lower rank, never a higher rank", () => {
  const expected = [
    [30, 8],
    [58, 12],
    [84, 19],
    [116, 26],
    [136, 32],
    [166, 36],
  ];
  for (const [index, rank] of testRanks.entries()) {
    const pool = getQuestionPool(rank.id);
    expect([...new Set(pool.map((question) => question.rank))]).toEqual(
      testRanks.slice(0, index + 1).map((entry) => entry.id),
    );
    expect(getQuestionPool(rank.id, ["vocabulary"])).toHaveLength(
      expected[index][0],
    );
    expect(getQuestionPool(rank.id, ["general"])).toHaveLength(
      expected[index][1],
    );
    expect(
      pool.every(
        (question) =>
          question.prompt.trim() && question.page >= 7 && question.page <= 18,
      ),
    ).toBeTruthy();
    expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
    expect(
      new Set(
        createTestQuestions({ rank: rank.id, count: "all" }).map(
          (question) => question.id,
        ),
      ),
    ).toEqual(new Set(pool.map((question) => question.id)));
  }
  expect(createTestQuestions({ rank: "gokyu", count: 10 })).toHaveLength(10);
  expect(getQuestionPool("gokyu", [])).toEqual([]);
  expect(() => getQuestionPool("shodan")).toThrow(RangeError);
  expect(() => createTestQuestions({ rank: "rokyu", count: 0 })).toThrow(
    RangeError,
  );
  expect(
    testQuestionBank.find((question) => question.answer === "Randori")
      .sourceNote,
  ).toBe("");
  expect(
    testQuestionBank.find((question) => question.prompt.endsWith(": Left"))
      .sourceNote,
  ).toContain("Migi");
});

test("self-assessment includes unanswered questions in its denominator and excludes open responses", () => {
  const normal = getQuestionPool("rokyu").slice(0, 3);
  const open = testQuestionBank.find(
    (question) => question.prompt === "Tell us about your judo journey.",
  );
  expect(open.hasAnswer).toBeFalsy();
  expect(open.answer).toBe("");
  const answers = {
    [normal[0].id]: { rating: "correct" },
    [normal[1].id]: { rating: "review" },
    [open.id]: { rating: "reviewed" },
  };
  expect(summarizeTest([...normal, open], answers)).toEqual({
    total: 4,
    correct: 1,
    review: 1,
    unanswered: 1,
    reflection: 1,
    reviewed: 1,
    scored: 3,
    score: 33,
  });
  expect(summarizeTest([open], answers).score).toBeNull();
});

test("Gokyu test covers both ranks, supports review, and retries only missed questions", async ({
  page,
}) => {
  const pdfRequests = [];
  const unexpected = [];
  let navigations = 0;
  page.on("pageerror", (error) => unexpected.push(error.message));
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navigations++;
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith(".pdf") && !url.searchParams.has("import"))
      pdfRequests.push(url.href);
  });
  await page.goto("./");
  await openTest(page);
  await expect(
    page.getByRole("button", { name: "Start test", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Target rank" })
    .selectOption("gokyu");
  await expect(page.locator("#test-scope")).toHaveText("Rokyu + Gokyu");
  await expect(page.locator("#test-pool-count")).toHaveText(
    "70 questions available",
  );
  await page
    .getByRole("combobox", { name: "Answer format" })
    .selectOption("written");
  await page.getByRole("button", { name: "Start test", exact: true }).click();
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 70");
  const session = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("wj:test:session")),
  );
  expect(session.questionIds).toHaveLength(70);
  expect(
    session.questionIds.every(
      (id) => id.startsWith("rokyu:") || id.startsWith("gokyu:"),
    ),
  ).toBeTruthy();
  const first = session.questionIds[0];
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("My recalled answer");
  await expect(page.locator("#test-answer-panel")).toBeHidden();
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await expect(page.locator("#test-answer")).toHaveText(
    testQuestionBank.find((question) => question.id === first).answer,
  );
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(page.locator("#test-position")).toHaveText("Question 2 of 70");
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await page.getByRole("button", { name: "Needs review", exact: true }).click();
  await page
    .getByRole("button", { name: "Previous question", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Your answer" })).toHaveValue(
    "My recalled answer",
  );
  await expect(
    page.getByRole("button", { name: "Got it", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Finish test", exact: true }).click();
  await expect(
    page.locator("#test-recalled"),
    unexpected.join("\n"),
  ).toHaveText("1 / 70");
  await expect(page.locator("#test-unanswered")).toHaveText("68");
  await expect(page.locator("#test-score")).toHaveText("1%");
  await expect(page.locator("#test-answer-review>li")).toHaveCount(70);
  await page.getByRole("button", { name: "Retry missed questions" }).click();
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 69");
  const retry = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("wj:test:session")),
  );
  expect(retry.questionIds).not.toContain(first);
  await page.getByRole("button", { name: "Finish test", exact: true }).click();
  await page.getByRole("button", { name: "Retake test", exact: true }).click();
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 70");
  expect(pdfRequests).toEqual([]);
  expect(unexpected).toEqual([]);
  expect(navigations).toBe(1);
});

test("category filters and written answers survive workspace changes and reloads", async ({
  page,
}) => {
  await page.goto("./");
  await openTest(page);
  await page
    .getByRole("combobox", { name: "Answer format" })
    .selectOption("written");
  await page
    .getByRole("combobox", { name: "Target rank" })
    .selectOption("gokyu");
  await page
    .getByRole("checkbox", { name: "Vocabulary", exact: true })
    .uncheck();
  await expect(page.locator("#test-pool-count")).toHaveText(
    "12 questions available",
  );
  await page
    .getByRole("checkbox", { name: "General information", exact: true })
    .uncheck();
  await expect(
    page.getByRole("button", { name: "Start test", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "General information", exact: true })
    .check();
  await page
    .getByRole("combobox", { name: "Question count" })
    .selectOption("10");
  await page.getByRole("button", { name: "Start test", exact: true }).click();
  await expect(page.locator("#test-position")).toHaveText("Question 1 of 10");
  await expect(page.locator("#test-question-category")).toHaveText(
    "GENERAL INFORMATION",
  );
  const prompt = await page.locator("#test-question-prompt").textContent();
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("Saved answer draft");
  await page.getByRole("button", { name: /Study Guide Ranks/ }).click();
  await openTest(page);
  await expect(page.getByRole("textbox", { name: "Your answer" })).toHaveValue(
    "Saved answer draft",
  );
  await page.reload();
  await openTest(page);
  await expect(page.locator("#test-question-prompt")).toHaveText(prompt);
  await expect(page.getByRole("textbox", { name: "Your answer" })).toHaveValue(
    "Saved answer draft",
  );
  await page.getByRole("button", { name: "Finish test", exact: true }).click();
  await page.getByRole("button", { name: "New test", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Target rank" })).toHaveValue(
    "gokyu",
  );
});

test("unanswered source prompts are reviewable but never scored as factual answers", async ({
  page,
}) => {
  const question = testQuestionBank.find(
    (entry) => entry.prompt === "Tell us about your judo journey.",
  );
  await page.addInitScript(
    (id) =>
      localStorage.setItem(
        "wj:test:session",
        JSON.stringify({
          config: { rank: "ikkyu", categories: ["general"], count: "all" },
          questionIds: [id],
          answers: {},
          index: 0,
          stage: "active",
        }),
      ),
    question.id,
  );
  await page.goto("./");
  await openTest(page);
  await expect(page.locator("#test-question-prompt")).toHaveText(
    question.prompt,
  );
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await expect(page.locator("#test-answer-title")).toHaveText("Open response");
  await expect(
    page.getByRole("button", { name: "Got it", exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await expect(page.locator("#test-score")).toHaveText("--");
  await expect(page.locator("#test-reflections")).toContainText(
    "1 / 1 open responses reviewed",
  );
  await expect(
    page.getByRole("button", { name: "Retry missed questions" }),
  ).toBeDisabled();
});

test("saved sessions cannot introduce questions from a rank above the selected target", async ({
  page,
}) => {
  const higherQuestion = testQuestionBank.find(
    (question) => question.rank === "ikkyu",
  );
  await page.addInitScript(
    (id) =>
      localStorage.setItem(
        "wj:test:session",
        JSON.stringify({
          config: {
            rank: "gokyu",
            categories: ["general", "vocabulary"],
            count: "all",
          },
          questionIds: [id],
          answers: {},
          index: 0,
          stage: "active",
        }),
      ),
    higherQuestion.id,
  );
  await page.goto("./");
  await openTest(page);
  await expect(page.locator("#test-setup")).toBeVisible();
  await expect(page.locator("#test-active")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Start test", exact: true }),
  ).toBeDisabled();
});

test("practice-test setup, questions, and results fit phone, tablet, and desktop", async ({
  page,
}) => {
  await page.goto("./");
  await openTest(page);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("combobox", { name: "Target rank" })
      .selectOption("gokyu");
    await page
      .getByRole("combobox", { name: "Question count" })
      .selectOption("10");
    await page
      .getByRole("combobox", { name: "Answer format" })
      .selectOption("written");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/${test.info().project.name}-test-setup-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Start test", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Your answer" })
      .fill("Practice answer");
    await page
      .getByRole("button", { name: "Reveal answer", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Needs review", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/${test.info().project.name}-test-question-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Finish test", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/${test.info().project.name}-test-results-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "New test", exact: true }).click();
  }
});
