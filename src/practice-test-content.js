import { studySections } from "./study-content.js";
import {
  getMultiSelectDefinition,
  withSupplementalAnswer,
} from "./practice-test-multiselect.js";

const rankOrder = ["rokyu", "gokyu", "yonkyu", "sankyu", "nikyu", "ikkyu"];

export const testRanks = rankOrder.map((id) => {
  const section = studySections.find((entry) => entry.id === id);
  return {
    id,
    title: section.title,
    detail: section.detail,
    color: section.color,
  };
});

function hasReferenceAnswer(answer) {
  return Boolean(answer.trim()) && !/^(?:\d+\.\s*)+$/.test(answer.trim());
}

function pageQuestions(section, page) {
  return page.blocks.flatMap((block, blockIndex) => {
    const base = {
      rank: section.id,
      rankTitle: section.title,
      page: page.number,
      sourceNote: page.note ?? "",
    };
    if (block.heading.startsWith("Vocabulary") && block.rows) {
      return block.rows.map(([term, answer], index) => ({
        ...base,
        sourceNote:
          page.number === 7 && !["Left", "Right"].includes(term)
            ? ""
            : base.sourceNote,
        id: `${section.id}:vocabulary:${page.number}:${blockIndex}:${index}`,
        category: "vocabulary",
        prompt: `Complete the vocabulary pair: ${term}`,
        answer,
        hasAnswer: hasReferenceAnswer(answer),
      }));
    }
    return (block.questions ?? []).flatMap(([, prompt, answer], index) =>
      prompt.trim()
        ? [
            {
              ...base,
              id: `${section.id}:general:${page.number}:${blockIndex}:${index}`,
              category: "general",
              prompt,
              answer: hasReferenceAnswer(answer) ? answer : "",
              hasAnswer: hasReferenceAnswer(answer),
            },
          ]
        : [],
    );
  });
}

export const testQuestionBank = rankOrder
  .flatMap((id) => {
    const section = studySections.find((entry) => entry.id === id);
    return section.pages.flatMap((page) => pageQuestions(section, page));
  })
  .map(withSupplementalAnswer);

export function getChoiceExplanation(choice, currentQuestionId) {
  const term = choice.toLowerCase();
  const vocabulary = testQuestionBank.find(
    (question) =>
      question.id !== currentQuestionId &&
      question.category === "vocabulary" &&
      question.answer.toLowerCase() === term,
  );
  if (vocabulary)
    return {
      text: `The guide defines this as: ${vocabulary.prompt.replace("Complete the vocabulary pair: ", "")}.`,
      prefix: "The guide defines this as: ",
      value: vocabulary.prompt.replace("Complete the vocabulary pair: ", ""),
      page: vocabulary.page,
    };
  const english = testQuestionBank.find(
    (question) =>
      question.id !== currentQuestionId &&
      question.category === "vocabulary" &&
      question.prompt
        .replace("Complete the vocabulary pair: ", "")
        .toLowerCase() === term,
  );
  if (english)
    return {
      text: `The guide pairs this with: ${english.answer}.`,
      prefix: "The guide pairs this with: ",
      value: english.answer,
      page: english.page,
    };
  const related = testQuestionBank.find(
    (question) =>
      question.id !== currentQuestionId &&
      question.category === "general" &&
      !question.supplemental &&
      (question.answer.toLowerCase() === term ||
        getMultiSelectDefinition(question)?.answers.includes(choice)),
  );
  if (related) {
    const text =
      related.id === "yonkyu:general:12:1:1"
        ? "The guide lists this person as one of the Four Heavenly Lords of Judo."
        : `The guide lists this in response to: ${related.prompt}`;
    return { text, page: related.page };
  }
  return null;
}

export function getQuestionPool(rank, categories = ["vocabulary", "general"]) {
  const ceiling = rankOrder.indexOf(rank);
  if (ceiling < 0) throw new RangeError("Choose a valid target rank");
  const included = new Set(rankOrder.slice(0, ceiling + 1));
  return testQuestionBank.filter(
    (question) =>
      included.has(question.rank) && categories.includes(question.category),
  );
}

export function createTestQuestions(
  { rank, categories, count = "all" },
  random = Math.random,
) {
  const pool = [...getQuestionPool(rank, categories)];
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  if (count === "all") return pool;
  const limit = Number(count);
  if (!Number.isInteger(limit) || limit < 1)
    throw new RangeError("Choose a positive question count");
  return pool.slice(0, limit);
}

function normalizedAnswer(value, question) {
  const text =
    question.prompt ===
    "What is the ultimate goal of Judo as defined by Dr. Kano?"
      ? value.replaceAll(/\b(?:eventual|human|the|a|an)\b/gi, "")
      : value;
  return text
    .normalize("NFKD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/^(?:the|a|an)\s+/, "")
    .replaceAll(/[^\p{L}\p{N}]/gu, "");
}

export function checkPracticeAnswer(question, response) {
  if (!question.hasAnswer) {
    return {
      rating: "reviewed",
      message: "Open response recorded. The guide supplies no answer to score.",
    };
  }
  const actual = normalizedAnswer(response, question);
  if (!actual)
    return {
      rating: "review",
      message: "No answer entered. Review the guide answer.",
    };
  const accepted = [question.answer];
  if (
    question.prompt ===
    "Name the six Kyu ranks and belts from highest to lowest."
  ) {
    accepted.push(
      question.answer
        .split(";")
        .map((rank) => rank.trim().split(" - ")[0])
        .join(", "),
    );
  }
  if (question.category === "vocabulary")
    accepted.push(...question.answer.split(/\/|\bor\b/i));
  const matches = accepted.some(
    (answer) => normalizedAnswer(answer, question) === actual,
  );
  return matches
    ? { rating: "correct", message: "Correct - your answer matches the guide." }
    : {
        rating: "review",
        message:
          "Needs review - your wording does not match the guide. Compare the answer below; mark Got it if your meaning is equivalent.",
      };
}

export function summarizeTest(questions, answers = {}) {
  const totals = {
    total: questions.length,
    correct: 0,
    review: 0,
    unanswered: 0,
    reflection: 0,
    reviewed: 0,
    scored: 0,
    score: null,
  };
  for (const question of questions) {
    const rating = answers[question.id]?.rating;
    if (!question.hasAnswer) {
      totals.reflection++;
      if (rating === "reviewed") totals.reviewed++;
      else totals.unanswered++;
      continue;
    }
    totals.scored++;
    if (rating === "correct") totals.correct++;
    else if (rating === "review") totals.review++;
    else totals.unanswered++;
  }
  if (totals.scored)
    totals.score = Math.round((totals.correct / totals.scored) * 100);
  return totals;
}
