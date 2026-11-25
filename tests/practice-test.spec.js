import { test, expect } from "@playwright/test";
import {
  testRanks,
  testQuestionBank,
  getQuestionPool,
  createTestQuestions,
  summarizeTest,
  checkPracticeAnswer,
} from "../src/practice-test-content.js";
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
) {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.addInitScript(
    ({ questionIds, target, choiceSets }) => {
      if (!localStorage.getItem("wj:test:session"))
        localStorage.setItem(
          "wj:test:session",
          JSON.stringify({
            config: {
              rank: target,
              categories: ["vocabulary", "general"],
              count: "all",
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
      choiceSets: multipleChoice
        ? createChoiceSets(
            ids.map((id) =>
              testQuestionBank.find((question) => question.id === id),
            ),
          )
        : undefined,
    },
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openTest(page);
}

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

test("unordered list definitions cover source lists while ordered and personal responses stay written", () => {
  const lists = testQuestionBank.filter((question) =>
    getMultiSelectDefinition(question),
  );
  expect(lists).toHaveLength(15);
  for (const question of lists) {
    const definition = getMultiSelectDefinition(question);
    const choices = createQuestionChoices(question);
    expect(validQuestionChoices(question, choices)).toBeTruthy();
    expect(choices).toHaveLength(definition.answers.length + 3);
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
    expect(gradeMultiSelect(question, choices).rating).toBe("review");
  }
  for (const question of testQuestionBank.filter(
    (entry) =>
      entry.prompt.includes("ordinal numbers") ||
      entry.prompt.includes("highest to lowest") ||
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
      expect(choices).toHaveLength(getMultiSelectAnswers(question).length + 3);
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
  expect(multipleChoice).toBe(186);
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
        question.prompt.includes("ordinal numbers from one to ten"),
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
    question.prompt.includes("ordinal numbers from one to ten"),
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
  await page.goto("/", { waitUntil: "domcontentloaded" });
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
  await seedQuestions(page, [question.id], "sankyu");
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
  await page.goto("/");
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
  await page.goto("/");
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
  await page.goto("/");
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
  await page.goto("/");
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
  await page.goto("/");
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
