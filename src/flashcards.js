import { createIcons, ChevronLeft, ChevronRight, Shuffle, BookOpen } from "lucide";
import { testRanks } from "./practice-test-content.js";
import { getFlashcards, getPronunciation, shuffleFlashcards } from "./flashcards-content.js";

const icons = { ChevronLeft, ChevronRight, Shuffle, BookOpen };

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

export function createFlashcards({ container, chapters, sourceUrl, storage }) {
  container.innerHTML = `
    <header class="flashcards-heading"><p class="section-label">VOCABULARY PRACTICE</p><h2>Flashcards</h2></header>
    <div class="flashcards-controls"><label>Target rank<select id="cards-rank"></select></label><div class="flashcards-direction"><span>Direction</span><div role="group" aria-label="Flashcard direction"><button id="cards-japanese" type="button" aria-pressed="true">Japanese to English</button><button id="cards-english" type="button" aria-pressed="false">English to Japanese</button></div></div><button id="cards-shuffle" class="outline-button" type="button" title="Shuffle cards"><i data-lucide="shuffle"></i><span>Shuffle</span></button></div>
    <div class="flashcards-meta"><output id="cards-position"></output><span id="cards-rank-label"></span></div>
    <button id="cards-face" class="flashcard-face" type="button" aria-label="Reveal answer"><span class="flashcard-inner"><span class="flashcard-front"><span id="cards-language" class="flashcard-language"></span><strong id="cards-text"></strong><span id="cards-action" class="flashcard-action">Show answer</span></span><span class="flashcard-back"><span class="flashcard-language">ANSWER</span><strong id="cards-answer"></strong><span id="cards-answer-japanese" class="flashcard-answer-japanese" hidden></span><em id="cards-answer-pronunciation" class="flashcard-pronunciation" hidden></em><span class="flashcard-action">Show question</span></span></span></button>
    <div class="flashcard-reference"><a id="cards-source" class="source-link" target="_blank" rel="noopener"></a><p id="cards-note" class="source-note" hidden></p></div>
    <nav class="flashcards-navigation" aria-label="Flashcards"><button id="cards-previous" class="outline-button" type="button"><i data-lucide="chevron-left"></i>Previous</button><button id="cards-next" class="primary-button" type="button">Next<i data-lucide="chevron-right"></i></button></nav>`;
  const find = (id) => container.querySelector(`#${id}`);
  const saved = storage.read("cards:state", {});
  const validRank = (rank) => testRanks.some((entry) => entry.id === rank);
  const state = {
    rank: validRank(saved?.rank) ? saved.rank : "rokyu",
    direction: saved?.direction === "english" ? "english" : "japanese",
    order: [], index: 0, flipped: saved?.flipped === true,
  };
  let cards = getFlashcards(state.rank);
  const ids = new Set(cards.map((card) => card.id));
  const validOrder = Array.isArray(saved?.order) && saved.order.length === ids.size && new Set(saved.order).size === ids.size && saved.order.every((id) => ids.has(id));
  state.order = validOrder ? saved.order : cards.map((card) => card.id);
  state.index = validOrder && Number.isInteger(saved.index) ? Math.min(Math.max(saved.index, 0), state.order.length - 1) : 0;
  if (!validOrder) state.flipped = false;
  for (const rank of testRanks) {
    const option = node("option", `${rank.title} - ${rank.detail.replace("Senior ", "")}`);
    option.value = rank.id;
    find("cards-rank").append(option);
  }

  function persist() { storage.write("cards:state", state); }
  function setRank(rank) {
    if (!validRank(rank)) return;
    state.rank = rank;
    cards = getFlashcards(rank);
    state.order = cards.map((card) => card.id);
    state.index = 0;
    state.flipped = false;
    render();
  }
  function renderChapters() {
    chapters.replaceChildren(...testRanks.map((rank) => {
      const selected = rank.id === state.rank;
      const button = node("button", undefined, `chapter ${selected ? "selected" : ""}`);
      button.setAttribute("aria-label", rank.title);
      if (selected) button.setAttribute("aria-current", "location");
      const label = node("span", rank.title);
      label.append(node("small", rank.detail));
      button.append(node("span", undefined, `chapter-marker ${rank.color}`), label, node("span", String(getFlashcards(rank.id).length), "chapter-page"));
      button.addEventListener("click", () => setRank(rank.id));
      return button;
    }));
    document.getElementById("contents-title").textContent = "FLASHCARD RANKS";
    document.getElementById("chapter-count").textContent = String(cards.length);
  }
  function render() {
    const card = cards.find((entry) => entry.id === state.order[state.index]);
    const frontIsEnglish = state.direction === "english";
    find("cards-rank").value = state.rank;
    find("cards-english").setAttribute("aria-pressed", String(state.direction === "english"));
    find("cards-japanese").setAttribute("aria-pressed", String(state.direction === "japanese"));
    find("cards-position").textContent = `${state.index + 1} / ${cards.length}`;
    find("cards-rank-label").textContent = card.rank;
    const question = frontIsEnglish ? card.english : card.japanese;
    const answer = frontIsEnglish ? card.japanese : card.english;
    find("cards-language").textContent = frontIsEnglish ? "ENGLISH" : "JAPANESE";
    find("cards-text").textContent = question;
    find("cards-answer").textContent = answer;
    const answerPronunciation = getPronunciation(card.japanese);
    find("cards-answer-pronunciation").textContent = answerPronunciation;
    find("cards-answer-pronunciation").hidden = !state.flipped || !answerPronunciation;
    find("cards-answer-japanese").textContent = frontIsEnglish ? "" : card.japanese;
    find("cards-answer-japanese").hidden = !state.flipped || frontIsEnglish;
    find("cards-action").textContent = state.flipped ? "Show question" : "Show answer";
    find("cards-face").classList.toggle("flipped", state.flipped);
    find("cards-face").setAttribute("aria-label", state.flipped ? `Answer: ${answer}. Show question` : `${question}. Show answer`);
    find("cards-source").href = `${sourceUrl}#page=${card.page}`;
    find("cards-source").textContent = `Student Guide - PDF page ${card.page}`;
    find("cards-source").hidden = !state.flipped;
    find("cards-note").textContent = card.sourceNote ?? "";
    find("cards-note").hidden = !state.flipped || !card.sourceNote;
    find("cards-previous").disabled = state.index === 0;
    find("cards-next").disabled = state.index === cards.length - 1;
    renderChapters();
    persist();
  }
  find("cards-rank").addEventListener("change", (event) => setRank(event.target.value));
  for (const direction of ["english", "japanese"]) find(`cards-${direction}`).addEventListener("click", () => { state.direction = direction; state.flipped = false; render(); });
  let pointerStart = null;
  let suppressCardClick = false;
  find("cards-face").addEventListener("click", () => {
    if (suppressCardClick) {
      suppressCardClick = false;
      return;
    }
    state.flipped = !state.flipped;
    render();
  });
  find("cards-face").addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  find("cards-face").addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const distanceX = event.clientX - pointerStart.x;
    const distanceY = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(distanceX) < 50 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
    if (distanceX < 0 && state.index < cards.length - 1) {
      suppressCardClick = true;
      state.index++;
      state.flipped = false;
      render();
    } else if (distanceX > 0 && state.index > 0) {
      suppressCardClick = true;
      state.index--;
      state.flipped = false;
      render();
    }
  });
  find("cards-face").addEventListener("pointercancel", () => { pointerStart = null; });
  find("cards-previous").addEventListener("click", () => { if (state.index > 0) { state.index--; state.flipped = false; render(); } });
  find("cards-next").addEventListener("click", () => { if (state.index < cards.length - 1) { state.index++; state.flipped = false; render(); } });
  find("cards-shuffle").addEventListener("click", () => { state.order = shuffleFlashcards(cards).map((card) => card.id); state.index = 0; state.flipped = false; render(); });
  createIcons({ icons });
  function printCards() {
    let printRoot = document.getElementById("flashcards-print-root");
    if (!printRoot) {
      printRoot = document.createElement("div");
      printRoot.id = "flashcards-print-root";
      printRoot.className = "print-root";
      document.body.append(printRoot);
    }

    const printable = state.order.map((id) => cards.find((card) => card.id === id));
    const chunks = [];
    for (let index = 0; index < printable.length; index += 8) chunks.push(printable.slice(index, index + 8));

    function addPage(side, pageCards) {
      const sheet = document.createElement("section");
      sheet.className = `print-sheet print-${side}`;
      for (const card of pageCards) {
        if (!card) {
          const blank = document.createElement("div");
          blank.className = "print-card print-card-spacer";
          blank.setAttribute("aria-hidden", "true");
          sheet.append(blank);
          continue;
        }
        const item = document.createElement("article");
        item.className = "print-card";
        const language = document.createElement("span");
        language.className = "print-card-language";
        language.textContent = side === "front" ? "JAPANESE" : "ENGLISH";
        const text = document.createElement("strong");
        text.textContent = side === "front" ? card.japanese : card.english;
        item.append(language, text);
        if (side === "back") {
          const pronunciation = getPronunciation(card.japanese);
          if (pronunciation) {
            const guide = document.createElement("em");
            guide.className = "print-card-pronunciation";
            guide.textContent = pronunciation;
            item.append(guide);
          }
          const japanese = document.createElement("span");
          japanese.className = "print-card-japanese";
          japanese.textContent = card.japanese;
          const rank = document.createElement("span");
          rank.className = "print-card-rank";
          rank.textContent = `Rank: ${card.rank}`;
          item.append(japanese, rank);
        }
        sheet.append(item);
      }
      printRoot.append(sheet);
    }

    printRoot.replaceChildren();
    for (const chunk of chunks) addPage("front", chunk);
    for (const chunk of chunks) {
      const mirrored = [];
      for (let row = 0; row < chunk.length; row += 2) mirrored.push(chunk[row + 1] ?? null, chunk[row] ?? null);
      addPage("back", mirrored);
    }

    window.addEventListener("afterprint", () => {
      document.getElementById("flashcards-print-root")?.remove();
    }, { once: true });
    window.print();
  }

  return {
    show: render,
    print: printCards,
    reset() {
      if (!storage.remove("cards:state")) return false;
      Object.assign(state, { rank: "rokyu", direction: "japanese", index: 0, flipped: false });
      cards = getFlashcards(state.rank);
      state.order = cards.map((card) => card.id);
      render();
      return true;
    },
  };
}
