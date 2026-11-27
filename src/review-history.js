import { getQuestionPool, testQuestionBank } from "./practice-test-content.js";

const reviewable = new Set(testQuestionBank.filter((question) => question.hasAnswer).map((question) => question.id));

export function sanitizeMissed(value) {
  return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string" && reviewable.has(id)))] : [];
}

export function updateMissed(value, questionId, rating) {
  const missed = new Set(sanitizeMissed(value));
  if (!reviewable.has(questionId)) return [...missed];
  if (rating === "review") missed.add(questionId);
  if (rating === "correct") missed.delete(questionId);
  return [...missed];
}

export function getMissedQuestions(value, rank, categories = ["vocabulary", "general"]) {
  const missed = new Set(sanitizeMissed(value));
  return getQuestionPool(rank, categories).filter((question) => missed.has(question.id));
}

export function createMissedReview(value, rank, categories, random = Math.random) {
  const questions = getMissedQuestions(value, rank, categories);
  for (let index = questions.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [questions[index], questions[other]] = [questions[other], questions[index]];
  }
  return questions;
}
