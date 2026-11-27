import {
  createIcons,
  Play,
  Eye,
  Check,
  Flag,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ClipboardCheck,
} from "lucide";
import {
  testRanks,
  testQuestionBank,
  getQuestionPool,
  createTestQuestions,
  summarizeTest,
  checkPracticeAnswer,
  getChoiceExplanation,
} from "./practice-test-content.js";
import {
  createChoiceSets,
  validQuestionChoices,
  createQuestionChoices,
  getMultiSelectAnswers,
  gradeMultiSelect,
} from "./practice-test-choices.js";
import { getMultiSelectDefinition } from "./practice-test-multiselect.js";
import { getMissedQuestions, updateMissed, createMissedReview } from "./review-history.js";

const icons = {
  Play,
  Eye,
  Check,
  Flag,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ClipboardCheck,
};
const questionById = new Map(
  testQuestionBank.map((question) => [question.id, question]),
);

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function renderQuestionPrompt(prompt, question) {
  prompt.replaceChildren();
  if (question.category !== "vocabulary") {
    prompt.textContent = question.prompt;
    return;
  }
  const separator = question.prompt.indexOf(":") + 1;
  prompt.append(
    node(
      "span",
      question.prompt.slice(0, separator),
      "test-question-instruction",
    ),
    document.createTextNode(" "),
    node(
      "strong",
      question.prompt.slice(separator).trim(),
      "test-question-term",
    ),
  );
}

function choiceLegend(definition, ordered) {
  if (!definition || definition.answers.length <= 1) return "Choose one answer";
  const suffix = ordered ? " in order" : "";
  return `Select ${definition.count} ${definition.unit}${suffix}`;
}

function validSettings(value) {
  return {
    rank: testRanks.some((rank) => rank.id === value?.rank) ? value.rank : "",
    categories: ["vocabulary", "general"].filter(
      (category) =>
        !Array.isArray(value?.categories) ||
        value.categories.includes(category),
    ),
    count: ["all", "10", "20"].includes(String(value?.count))
      ? String(value.count)
      : "all",
    format: value?.format === "written" ? "written" : "mixed",
  };
}

function restoreQuestionChoices(question, value) {
  const choices = value.choiceSets?.[question.id];
  if (validQuestionChoices(question, choices)) return choices;
  const answer = value.answers?.[question.id];
  const hasText =
    typeof answer?.text === "string" && Boolean(answer.text.trim());
  if (getMultiSelectAnswers(question).length && !answer?.revealed && !hasText)
    return createQuestionChoices(question);
  return [];
}

function restoreSelections(selected, choices = []) {
  if (!Array.isArray(selected)) return [];
  return [...new Set(selected.filter((choice) => choices.includes(choice)))];
}

function restoreChoiceSets(value, config) {
  if (config.format === "written") return {};
  return Object.fromEntries(
    value.questionIds.flatMap((id) => {
      const choices = restoreQuestionChoices(questionById.get(id), value);
      return choices.length ? [[id, choices]] : [];
    }),
  );
}

function regradeCorrectedDirection(id, question, answer) {
  if (
    answer.checked &&
    ["rokyu:vocabulary:7:4:14", "rokyu:vocabulary:7:4:29"].includes(id)
  ) {
    answer.rating = checkPracticeAnswer(question, answer.text).rating;
  }
}

function restoreSession(value) {
  const config = validSettings(value?.config);
  if (
    !config.rank ||
    !config.categories.length ||
    !["active", "results"].includes(value?.stage)
  )
    return null;
  if (!Array.isArray(value.questionIds) || !value.questionIds.length)
    return null;
  const eligible = new Set(
    getQuestionPool(config.rank, config.categories).map(
      (question) => question.id,
    ),
  );
  if (
    new Set(value.questionIds).size !== value.questionIds.length ||
    value.questionIds.some((id) => !eligible.has(id))
  )
    return null;
  const choiceSets = restoreChoiceSets(value, config);
  const answers = {};
  for (const id of value.questionIds) {
    const saved = value.answers?.[id];
    if (!saved) continue;
    const revealed = saved.revealed === true;
    const question = questionById.get(id);
    const allowed = question.hasAnswer ? ["correct", "review"] : ["reviewed"];
    answers[id] = {
      text: typeof saved.text === "string" ? saved.text.slice(0, 4000) : "",
      selected: restoreSelections(saved.selected, choiceSets[id]),
      revealed,
      rating: revealed && allowed.includes(saved.rating) ? saved.rating : null,
      checked:
        revealed && saved.checked === true && allowed.includes(saved.rating),
    };
    regradeCorrectedDirection(id, question, answers[id]);
  }
  const index = Number.isInteger(value.index)
    ? Math.min(value.questionIds.length - 1, Math.max(0, value.index))
    : 0;
  return {
    config,
    questionIds: value.questionIds,
    choiceSets,
    answers,
    index,
    stage: value.stage,
  };
}

function referenceAnswerTitle(question) {
  if (question.supplemental) return "Verified reference examples";
  return question.hasAnswer ? "Guide answer" : "Open response";
}

function referenceLinks(question) {
  const links = document.createDocumentFragment();
  for (const reference of question.references ?? []) {
    const link = node("a", reference.label, "source-link");
    link.href = reference.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    links.append(link, document.createTextNode(" "));
  }
  return links;
}

function ratingLabel(question, answer) {
  if (!question.hasAnswer)
    return answer?.rating === "reviewed" ? "Reviewed" : "Not reviewed";
  if (answer?.rating === "correct") return "Recalled";
  return answer?.rating === "review" ? "Needs review" : "Not assessed";
}

function checkedAnswer(question, answer, choices) {
  if (choices && getMultiSelectAnswers(question).length)
    return gradeMultiSelect(question, answer.selected ?? []);
  const result = checkPracticeAnswer(question, answer.text);
  if (choices && result.rating === "review")
    return { ...result, message: "Incorrect - review the guide answer." };
  return result;
}

function choiceFeedback(question, answer, choice, selected) {
  if (!answer.revealed) return null;
  const correct = getMultiSelectAnswers(question);
  if (getMultiSelectDefinition(question)?.ordered) {
    const position = correct.indexOf(choice) + 1;
    const selectedPosition = (answer.selected ?? []).indexOf(choice) + 1;
    if (!selected)
      return {
        result: "",
        text: `Not selected - correct position ${position}`,
      };
    return selectedPosition === position
      ? {
          result: "correct",
          text: `Selected ${selectedPosition} - correct position`,
        }
      : {
          result: "review",
          text: `Selected ${selectedPosition} - correct position ${position}`,
        };
  }
  const matches = correct.length
    ? correct.includes(choice)
    : choice === question.answer;
  const alternative = getMultiSelectDefinition(question)?.any
    ? "Also a valid answer"
    : "Correct answer";
  if (matches)
    return {
      result: "correct",
      text: selected ? "Your answer - correct" : alternative,
    };
  if (selected) return { result: "review", text: "Your answer - incorrect" };
  return null;
}

export function createPracticeTest({
  container,
  chapters,
  sourceUrl,
  storage,
}) {
  container.innerHTML = `
    <div id="test-setup">
      <header class="test-heading"><p class="section-label">PRACTICE TEST</p><h2>Which rank are you studying for?</h2></header>
      <form id="test-settings" class="test-settings">
        <div class="test-selects"><label>Target rank<select id="test-rank" required><option value="">Select a rank</option></select></label><label>Question count<select id="test-count"><option value="all">All available</option><option value="10">10 questions</option><option value="20">20 questions</option></select></label><label>Answer format<select id="test-format"><option value="mixed">Multiple choice where suitable</option><option value="written">Written answers</option></select></label></div>
        <fieldset class="test-categories"><legend>Question types</legend><label><input id="test-vocabulary" type="checkbox" checked />Vocabulary</label><label><input id="test-general" type="checkbox" checked />General information</label></fieldset>
        <div class="test-pool"><div><h3>Included ranks</h3><p id="test-scope">No rank selected</p></div><output id="test-pool-count">0 questions available</output></div>
        <button id="test-start" class="primary-button" type="submit" disabled><i data-lucide="play"></i>Start test</button>
        <div class="test-missed-actions"><button id="test-review-history" class="outline-button" type="button" disabled><i data-lucide="flag"></i>Review missed questions</button><output id="test-review-count"></output></div>
      </form>
    </div>
    <div id="test-active" hidden>
      <div class="test-session-bar"><output id="test-position"></output><button id="test-finish" class="text-command"><i data-lucide="clipboard-check"></i>Finish test</button></div>
      <progress id="test-progress" aria-label="Questions reviewed" value="0" max="1"></progress>
      <div class="test-question-heading"><p id="test-question-category" class="section-label"></p><span id="test-question-rank"></span></div>
      <h2 id="test-question-prompt" class="test-question-prompt"></h2>
      <div id="test-written-response"><label class="test-response-label" for="test-response">Your answer</label><textarea id="test-response" rows="4" maxlength="4000" spellcheck="false" aria-describedby="test-feedback"></textarea></div>
      <fieldset id="test-choices" class="test-choices" aria-describedby="test-feedback" hidden><legend>Choose one answer</legend></fieldset>
      <output id="test-selection-order" class="test-selection-order" aria-live="polite" hidden></output>
      <button id="test-reveal" class="outline-button"><i data-lucide="eye"></i>Reveal answer</button>
      <output id="test-feedback" class="test-feedback"></output>
      <section id="test-answer-panel" class="test-answer-panel" aria-label="Answer review" hidden><h3 id="test-answer-title">Guide answer</h3><p id="test-answer"></p><p id="test-source-note" class="source-note" hidden></p><a id="test-source" class="source-link" target="_blank" rel="noopener"></a><div id="test-references"></div>
        <div class="test-ratings"><button id="test-correct" class="outline-button" aria-pressed="false"><i data-lucide="check"></i>Got it</button><button id="test-review" class="outline-button" aria-pressed="false"><i data-lucide="flag"></i>Needs review</button><button id="test-reviewed" class="outline-button" aria-pressed="false" hidden><i data-lucide="check"></i>Mark reviewed</button></div>
      </section>
      <section id="test-choice-explanations" class="test-choice-explanations" aria-labelledby="test-choice-explanations-title" hidden><h3 id="test-choice-explanations-title">About your selection</h3><div id="test-choice-explanations-content"></div></section>
      <nav class="test-navigation" aria-label="Test questions"><button id="test-previous" class="outline-button"><i data-lucide="arrow-left"></i>Previous question</button><button id="test-next" class="primary-button"><span>Next question</span><i data-lucide="arrow-right"></i></button></nav>
    </div>
    <div id="test-results" hidden>
      <header class="test-heading"><p class="section-label">SELF-ASSESSMENT</p><h2 id="test-result-title">Test results</h2><p id="test-result-scope"></p></header>
      <div class="test-scoreboard"><div><strong id="test-score"></strong><span>Recall score</span></div><div><strong id="test-recalled"></strong><span>Recalled / scored questions</span></div><div><strong id="test-unanswered"></strong><span>Not assessed</span></div></div>
      <p id="test-reflections" class="test-result-note"></p><p class="test-result-note">Self-assessment only. This is not a rank examination or promotion approval.</p>
      <div class="test-result-actions"><button id="test-retry-missed" class="primary-button"><i data-lucide="flag"></i>Retry missed questions</button><button id="test-retake" class="outline-button"><i data-lucide="rotate-ccw"></i>Retake test</button><button id="test-new" class="outline-button">New test</button></div>
      <h3 class="test-review-heading">Answer review</h3><ol id="test-answer-review" class="test-answer-review"></ol>
    </div>`;
  const find = (id) => container.querySelector(`#${id}`);
  let settings = validSettings(storage.read("test:settings", {}));
  let session = restoreSession(storage.read("test:session", null));
  for (const rank of testRanks) {
    const option = node(
      "option",
      `${rank.title} - ${rank.detail.replace("Senior ", "")}`,
    );
    option.value = rank.id;
    find("test-rank").append(option);
  }
  find("test-rank").value = settings.rank;
  find("test-count").value = settings.count;
  find("test-format").value = settings.format;
  find("test-vocabulary").checked = settings.categories.includes("vocabulary");
  find("test-general").checked = settings.categories.includes("general");

  function persist() {
    storage.write("test:session", session);
  }
  function recordRating(question, rating) {
    const history = updateMissed(storage.read("test:missed", []), question.id, rating);
    storage.write("test:missed", history);
  }
  function questions() {
    return session.questionIds.map((id) => questionById.get(id));
  }
  function focusHeading(id) {
    const heading = find(id);
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    container.scrollIntoView({ block: "start" });
  }

  function renderCoverage() {
    const config = session?.config ?? settings;
    const pool = config.rank
      ? getQuestionPool(config.rank, config.categories)
      : [];
    const ceiling = testRanks.findIndex((rank) => rank.id === config.rank);
    const ranks = testRanks.slice(0, ceiling + 1);
    chapters.replaceChildren(
      ...ranks.map((rank) => {
        const row = node("div", undefined, "test-coverage-row");
        const label = node("span", rank.title);
        label.append(node("small", rank.detail));
        row.append(
          node("span", undefined, `chapter-marker ${rank.color}`),
          label,
          node(
            "span",
            String(pool.filter((question) => question.rank === rank.id).length),
            "chapter-page",
          ),
        );
        return row;
      }),
    );
    document.getElementById("contents-title").textContent = "TEST COVERAGE";
    document.getElementById("chapter-count").textContent = String(pool.length);
  }

  function renderSetup() {
    const pool = settings.rank
      ? getQuestionPool(settings.rank, settings.categories)
      : [];
    const ranks = testRanks.slice(
      0,
      testRanks.findIndex((rank) => rank.id === settings.rank) + 1,
    );
    find("test-scope").textContent = ranks.length
      ? ranks.map((rank) => rank.title).join(" + ")
      : "No rank selected";
    find("test-pool-count").textContent = `${pool.length} questions available`;
    find("test-start").disabled = pool.length === 0;
    const missed = settings.rank ? getMissedQuestions(storage.read("test:missed", []), settings.rank, settings.categories) : [];
    find("test-review-history").disabled = missed.length === 0;
    const questionLabel = missed.length === 1 ? "question" : "questions";
    find("test-review-count").textContent = settings.rank ? `${missed.length} missed ${questionLabel} available` : "Select a rank to review missed questions.";
    renderCoverage();
  }

  function updateSelectionOrder(ordered, selected) {
    const output = find("test-selection-order");
    output.hidden = !ordered;
    const labels = selected.map((item, index) => `${index + 1}. ${item}`);
    output.textContent = ordered
      ? `Selected order: ${labels.join("; ") || "None"}`
      : "";
  }

  function renderAnswerInput(question, answer) {
    const choices = session.choiceSets?.[question.id];
    const correct = getMultiSelectAnswers(question);
    const definition = getMultiSelectDefinition(question);
    const multiple = correct.length > 1;
    const ordered = Boolean(choices && definition?.ordered);
    const fieldset = find("test-choices");
    fieldset.hidden = !choices;
    fieldset.removeAttribute("aria-invalid");
    find("test-written-response").hidden = Boolean(choices);
    fieldset.replaceChildren(node("legend", choiceLegend(definition, ordered)));
    updateSelectionOrder(ordered, answer.selected ?? []);
    for (const [index, choice] of (choices ?? []).entries()) {
      const selected = multiple
        ? (answer.selected ?? []).includes(choice)
        : answer.text === choice;
      const label = node("label", undefined, "test-choice");
      const input = node("input");
      input.type = multiple ? "checkbox" : "radio";
      input.name = "test-choice";
      input.value = choice;
      input.setAttribute("aria-label", choice);
      input.setAttribute("aria-describedby", `test-choice-status-${index}`);
      input.checked = selected;
      input.disabled = answer.revealed;
      const body = node("span", undefined, "test-choice-body");
      const status = node("small", "", "test-choice-status");
      status.id = `test-choice-status-${index}`;
      const feedback = choiceFeedback(question, answer, choice, selected);
      if (feedback) {
        label.dataset.result = feedback.result;
        status.textContent = feedback.text;
      } else if (ordered && selected) {
        status.textContent = `Selected ${(answer.selected ?? []).indexOf(choice) + 1}`;
      }
      body.append(node("span", choice), status);
      label.append(
        input,
        node("span", String.fromCodePoint(65 + index), "test-choice-letter"),
        body,
      );
      input.addEventListener("change", () => {
        if (ordered) {
          const previous = answer.selected ?? [];
          answer.selected = input.checked
            ? [...previous, choice]
            : previous.filter((item) => item !== choice);
        } else {
          answer.selected = [...fieldset.querySelectorAll("input:checked")].map(
            (control) => control.value,
          );
        }
        answer.text = multiple ? answer.selected.join("\n") : choice;
        fieldset.removeAttribute("aria-invalid");
        find("test-feedback").textContent = "";
        persist();
        if (ordered) {
          renderAnswerInput(question, answer);
          [...fieldset.querySelectorAll("input")]
            .find((control) => control.value === choice)
            ?.focus();
        }
      });
      fieldset.append(label);
    }
    return Boolean(choices);
  }

  function renderChoiceExplanations(question, answer, choices) {
    const section = find("test-choice-explanations");
    const content = find("test-choice-explanations-content");
    const selected = getMultiSelectAnswers(question).length
      ? (answer.selected ?? [])
      : [answer.text];
    const incorrect = (choices && answer.revealed ? selected : []).filter(
      (choice) =>
        choices.includes(choice) &&
        choiceFeedback(question, answer, choice, true)?.result === "review",
    );
    section.hidden = incorrect.length === 0;
    content.replaceChildren();
    for (const choice of incorrect) {
      const item = node("div", undefined, "test-choice-explanation");
      const explanation = getChoiceExplanation(choice, question.id);
      item.append(node("h4", choice));
      const position = choiceFeedback(question, answer, choice, true)?.text;
      if (getMultiSelectDefinition(question)?.ordered)
        item.append(node("p", position));
      const description = node("p");
      if (explanation?.value) {
        description.append(
          document.createTextNode(explanation.prefix),
          node("strong", explanation.value),
          document.createTextNode("."),
        );
      } else {
        description.textContent =
          explanation?.text ??
          "No explanation for this selection is available in the study guide.";
      }
      item.append(description);
      if (explanation) {
        const link = node(
          "a",
          `Student Guide - PDF page ${explanation.page}`,
          "source-link",
        );
        link.href = `${sourceUrl}#page=${explanation.page}`;
        link.target = "_blank";
        link.rel = "noopener";
        item.append(link);
      }
      content.append(item);
    }
  }

  function renderQuestion(focus = false) {
    const all = questions();
    const question = all[session.index];
    const answer = (session.answers[question.id] ??= {
      text: "",
      revealed: false,
      rating: null,
    });
    find("test-position").textContent =
      `Question ${session.index + 1} of ${all.length}`;
    find("test-progress").max = all.length;
    find("test-progress").value = Object.values(session.answers).filter(
      (entry) => entry.rating,
    ).length;
    find("test-question-category").textContent =
      question.category === "vocabulary" ? "VOCABULARY" : "GENERAL INFORMATION";
    find("test-question-rank").textContent = question.rankTitle;
    renderQuestionPrompt(find("test-question-prompt"), question);
    find("test-active").dataset.result =
      question.hasAnswer && ["correct", "review"].includes(answer.rating)
        ? answer.rating
        : "neutral";
    find("test-response").value = answer.text;
    find("test-response").readOnly = answer.revealed;
    find("test-response").removeAttribute("aria-invalid");
    const multipleChoice = renderAnswerInput(question, answer);
    find("test-reveal").hidden = answer.revealed;
    find("test-answer-panel").hidden = !answer.revealed;
    find("test-answer-title").textContent = referenceAnswerTitle(question);
    find("test-answer").textContent = question.hasAnswer
      ? question.answer
      : "No reference answer is supplied in the guide.";
    find("test-source-note").textContent = question.sourceNote;
    find("test-source-note").hidden = !question.sourceNote;
    find("test-source").textContent =
      `Senior Student Guide - PDF page ${question.page}`;
    find("test-source").href = `${sourceUrl}#page=${question.page}`;
    find("test-references").replaceChildren(referenceLinks(question));
    renderChoiceExplanations(
      question,
      answer,
      session.choiceSets?.[question.id],
    );
    find("test-correct").hidden = !question.hasAnswer || multipleChoice;
    find("test-review").hidden = !question.hasAnswer || multipleChoice;
    find("test-reviewed").hidden = question.hasAnswer;
    for (const rating of ["correct", "review", "reviewed"])
      find(`test-${rating}`).setAttribute(
        "aria-pressed",
        String(answer.rating === rating),
      );
    const feedback = answer.checked
      ? checkedAnswer(question, answer, session.choiceSets?.[question.id])
          .message
      : "";
    find("test-feedback").textContent =
      feedback || (answer.rating ? ratingLabel(question, answer) : "");
    find("test-previous").disabled = session.index === 0;
    let nextLabel = answer.checked ? "Continue" : "Next question";
    if (session.index === all.length - 1)
      nextLabel = answer.rating ? "View results" : "Check answer";
    find("test-next").querySelector("span").textContent = nextLabel;
    persist();
    if (focus) focusHeading("test-question-prompt");
  }

  function reviewItem(question) {
    const answer = session.answers[question.id];
    const item = node("li");
    const details = node("details");
    const summary = node("summary");
    summary.append(
      node("span", question.prompt),
      node("small", `${question.rankTitle} / ${ratingLabel(question, answer)}`),
    );
    details.append(
      summary,
      node("h4", "Your answer"),
      node("p", answer?.text || "No written answer"),
      node("h4", referenceAnswerTitle(question)),
      node(
        "p",
        question.answer || "No reference answer is supplied in the guide.",
      ),
    );
    if (question.sourceNote)
      details.append(node("p", question.sourceNote, "source-note"));
    const link = node("a", `PDF page ${question.page}`, "source-link");
    link.href = `${sourceUrl}#page=${question.page}`;
    link.target = "_blank";
    link.rel = "noopener";
    details.append(link);
    details.append(referenceLinks(question));
    item.append(details);
    return item;
  }

  function renderResults() {
    const all = questions();
    const totals = summarizeTest(all, session.answers);
    find("test-score").textContent =
      totals.score === null ? "--" : `${totals.score}%`;
    find("test-recalled").textContent = `${totals.correct} / ${totals.scored}`;
    find("test-unanswered").textContent = String(totals.unanswered);
    const rank = testRanks.find((entry) => entry.id === session.config.rank);
    find("test-result-scope").textContent =
      `${rank.title} and below / ${totals.total} questions`;
    find("test-reflections").textContent = totals.reflection
      ? `${totals.reviewed} / ${totals.reflection} open responses reviewed. Open responses have no guide answer and are excluded from the recall score.`
      : "";
    find("test-reflections").hidden = totals.reflection === 0;
    find("test-retry-missed").disabled = !all.some(
      (question) =>
        question.hasAnswer &&
        session.answers[question.id]?.rating !== "correct",
    );
    find("test-answer-review").replaceChildren(...all.map(reviewItem));
  }

  function render() {
    find("test-setup").hidden = Boolean(session);
    find("test-active").hidden = session?.stage !== "active";
    find("test-results").hidden = session?.stage !== "results";
    if (!session) renderSetup();
    else if (session.stage === "active") renderQuestion();
    else renderResults();
    renderCoverage();
    createIcons({ icons });
  }

  function begin(all, config = settings) {
    session = {
      config: { ...config, categories: [...config.categories] },
      questionIds: all.map((question) => question.id),
      choiceSets: config.format === "written" ? {} : createChoiceSets(all),
      answers: {},
      index: 0,
      stage: "active",
    };
    persist();
    render();
    focusHeading("test-question-prompt");
  }

  function finish() {
    session.stage = "results";
    persist();
    render();
    focusHeading("test-result-title");
  }
  function rate(rating) {
    const question = questions()[session.index];
    if (!session.answers[question.id]?.revealed) return;
    session.answers[question.id].rating = rating;
    session.answers[question.id].checked = false;
    recordRating(question, rating);
    renderQuestion();
  }

  find("test-settings").addEventListener("change", () => {
    settings = {
      rank: find("test-rank").value,
      count: find("test-count").value,
      format: find("test-format").value,
      categories: [],
    };
    if (find("test-vocabulary").checked) settings.categories.push("vocabulary");
    if (find("test-general").checked) settings.categories.push("general");
    storage.write("test:settings", settings);
    renderSetup();
  });
  find("test-settings").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!find("test-start").disabled) begin(createTestQuestions(settings));
  });
  find("test-review-history").addEventListener("click", () => {
    const missed = createMissedReview(storage.read("test:missed", []), settings.rank, settings.categories);
    if (missed.length) begin(missed);
  });
  find("test-response").addEventListener("input", (event) => {
    if (!session) return;
    session.answers[session.questionIds[session.index]].text =
      event.target.value;
    find("test-response").removeAttribute("aria-invalid");
    find("test-feedback").textContent = "";
    persist();
  });
  find("test-reveal").addEventListener("click", () => {
    session.answers[session.questionIds[session.index]].revealed = true;
    renderQuestion();
  });
  find("test-correct").addEventListener("click", () => rate("correct"));
  find("test-review").addEventListener("click", () => rate("review"));
  find("test-reviewed").addEventListener("click", () => rate("reviewed"));
  find("test-previous").addEventListener("click", () => {
    session.index = Math.max(0, session.index - 1);
    renderQuestion(true);
  });
  function validateAnswerInput(question, answer) {
    const multipleChoice = Boolean(session.choiceSets?.[question.id]);
    const hasAnswer =
      multipleChoice && getMultiSelectAnswers(question).length
        ? Boolean(answer.selected?.length)
        : Boolean(answer.text.trim());
    if (answer.revealed || hasAnswer) return true;
    find("test-feedback").textContent = multipleChoice
      ? "Select an answer before continuing."
      : "Enter an answer before continuing.";
    const control = find(multipleChoice ? "test-choices" : "test-response");
    control.setAttribute("aria-invalid", "true");
    if (multipleChoice) control.querySelector("input")?.focus();
    else control.focus();
    return false;
  }

  find("test-next").addEventListener("click", () => {
    const question = questions()[session.index];
    const answer = session.answers[question.id];
    if (!answer.rating) {
      if (!validateAnswerInput(question, answer)) return;
      answer.rating = checkedAnswer(
        question,
        answer,
        session.choiceSets?.[question.id],
      ).rating;
      recordRating(question, answer.rating);
      answer.revealed = true;
      answer.checked = true;
      renderQuestion();
      find("test-feedback").scrollIntoView({ block: "nearest" });
      return;
    }
    if (session.index === session.questionIds.length - 1) finish();
    else {
      session.index++;
      renderQuestion(true);
    }
  });
  find("test-finish").addEventListener("click", finish);
  find("test-new").addEventListener("click", () => {
    session = null;
    persist();
    render();
    find("test-rank").focus();
  });
  find("test-retake").addEventListener("click", () =>
    begin(createTestQuestions(session.config), session.config),
  );
  find("test-retry-missed").addEventListener("click", () =>
    begin(
      questions().filter(
        (question) =>
          question.hasAnswer &&
          session.answers[question.id]?.rating !== "correct",
      ),
      session.config,
    ),
  );
  return {
    show: render,
    reset() {
      if (
        !["test:session", "test:settings", "test:missed"].every((key) => storage.remove(key))
      )
        return false;
      session = null;
      settings = validSettings({});
      find("test-rank").value = settings.rank;
      find("test-count").value = settings.count;
      find("test-format").value = settings.format;
      find("test-vocabulary").checked =
        settings.categories.includes("vocabulary");
      find("test-general").checked = settings.categories.includes("general");
      render();
      return true;
    },
  };
}
