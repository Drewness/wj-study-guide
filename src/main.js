import {
  createIcons,
  BookOpen,
  PersonStanding,
  ChevronRight,
  ChevronLeft,
  Library,
  Check,
  ExternalLink,
  FileText,
  Minus,
  Plus,
  Bookmark,
  Maximize,
  Download,
  FileWarning,
  ClipboardCheck,
  RotateCcw,
  Layers,
  Printer,
  X,
} from "lucide";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import guideUrl from "../docs/WJ-Student-Guide.pdf?url";
import handbookUrl from "../docs/WJtudent-handbook112026.pdf?url";
import { createStudyGuide } from "./study-guide.js";
import { createThrowGuide } from "./throw-guide.js";
import { createPracticeTest } from "./practice-test.js";
import { createFlashcards } from "./flashcards.js";
import "./style.css";

createIcons({
  icons: {
    BookOpen,
    PersonStanding,
    ChevronRight,
    ChevronLeft,
    Library,
    Check,
    ExternalLink,
    FileText,
    Minus,
    Plus,
    Bookmark,
    Maximize,
    Download,
    FileWarning,
    ClipboardCheck,
    RotateCcw,
    Layers,
    Printer,
    X,
  },
});

const books = {
  guide: {
    url: guideUrl,
    title: "Senior Student Guide",
    short: "Student Guide",
    initial: 1,
    chapters: [
      ["Cover & contents", 1, "cover"],
      ["Wichita Judo rules", 3, "rules"],
      ["Points system", 5, "points"],
      ["Rokyu", 7, "yellow", "Senior yellow belt"],
      ["Gokyu", 9, "orange", "Senior orange belt"],
      ["Yonkyu", 11, "green", "Senior green belt"],
      ["Sankyu", 13, "brown", "Senior 3rd degree brown belt"],
      ["Nikyu", 15, "brown", "Senior 2nd degree brown belt"],
      ["Ikkyu", 17, "brown", "Senior 1st degree brown belt"],
    ],
  },
  handbook: {
    url: handbookUrl,
    title: "Student Handbook",
    short: "Student Handbook",
    initial: 33,
    chapters: [
      ["Cover & contents", 1, "cover"],
      ["Opening", 4, "rules"],
      ["History", 12, "rules"],
      ["Techniques", 33, "blue"],
      ["Gokyo no Waza", 34, "blue"],
      ["Beyond the Gokyo", 36, "blue"],
      ["Katame waza", 38, "blue"],
      ["Vocabulary", 42, "rules"],
      ["Certificates & records", 63, "rules"],
    ],
  },
};
const element = (id) => document.getElementById(id);
const storage = {
  read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`wj:${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(`wj:${key}`, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(`wj:${key}`);
      return true;
    } catch {
      return false;
    }
  },
};
const documents = new Map();
const studyGuide = createStudyGuide({
  container: element("study-guide"),
  chapters: element("chapters"),
  sourceUrl: guideUrl,
  storage,
});
const throwGuide = createThrowGuide({
  container: element("throw-guide"),
  chapters: element("chapters"),
  handbookUrl,
  guideUrl,
  storage,
  onOpenReference: () => openBook("handbook"),
});
const practiceTest = createPracticeTest({
  container: element("practice-test"),
  chapters: element("chapters"),
  sourceUrl: guideUrl,
  storage,
});
const flashcards = createFlashcards({ container: element("flashcards"), chapters: element("chapters"), sourceUrl: guideUrl, storage });
let currentBook = "guide";
let currentWorkspace = "study";
let pageNumber = 1;
let pdf;
let TextLayerConstructor;
let renderTask;
let textTask;
let renderVersion = 0;
let loadVersion = 0;
let zoom = "fit";
let nativePageWidth = 612;
let resizing;
let lastReaderWidth = 0;

function updateNavigation() {
  const chapters = books[currentBook].chapters;
  const currentChapter = chapters.findLast(
    (chapter) => chapter[1] <= pageNumber,
  );
  element("chapters").replaceChildren(
    ...chapters.map(([title, page, color, detail]) => {
      const button = document.createElement("button");
      button.className = `chapter ${currentChapter?.[1] === page ? "selected" : ""}`;
      button.setAttribute(
        "aria-label",
        [title, detail, `page ${page}`].filter(Boolean).join(", "),
      );
      if (currentChapter?.[1] === page)
        button.setAttribute("aria-current", "location");
      const marker = document.createElement("span");
      marker.className = `chapter-marker ${color}`;
      const label = document.createElement("span");
      label.textContent = title;
      if (detail) {
        const small = document.createElement("small");
        small.textContent = detail;
        label.append(small);
      }
      const number = document.createElement("span");
      number.className = "chapter-page";
      number.textContent = String(page).padStart(2, "0");
      button.append(marker, label, number);
      button.addEventListener("click", () => goToPage(page));
      return button;
    }),
  );
  element("chapter-count").textContent = String(chapters.length).padStart(
    2,
    "0",
  );
  element("page-number").value = pageNumber;
  element("page-count").textContent = pdf?.numPages ?? "";
  element("page-number").max = pdf?.numPages ?? 1;
  element("previous").disabled = !pdf || pageNumber <= 1;
  element("next").disabled = !pdf || pageNumber >= pdf.numPages;
  element("footer-page").textContent =
    `${String(pageNumber).padStart(2, "0")} / ${pdf?.numPages ?? "--"}`;
  const saved = storage.read(`${currentBook}:bookmark`, null);
  element("bookmark").setAttribute(
    "aria-pressed",
    String(saved === pageNumber),
  );
  element("bookmark").title =
    saved === pageNumber ? "Remove bookmark" : "Bookmark page";
  element("bookmark").setAttribute("aria-label", element("bookmark").title);
  element("saved-page").hidden = !saved;
  element("saved-page").querySelector("span").textContent =
    `Saved page ${saved}`;
}

async function renderPage() {
  if (!pdf || currentWorkspace !== "reference") return;
  const version = ++renderVersion;
  renderTask?.cancel();
  textTask?.cancel();
  element("error").hidden = true;
  element("loading").hidden = !element("paper").hidden;
  element("paper").setAttribute("aria-busy", "true");
  updateNavigation();
  try {
    const page = await pdf.getPage(pageNumber);
    if (version !== renderVersion) return;
    const original = page.getViewport({ scale: 1 });
    nativePageWidth = original.width;
    const availableWidth = Math.max(
      200,
      element("paper-stage").clientWidth - (innerWidth <= 600 ? 24 : 64),
    );
    const scale =
      zoom === "fit"
        ? Math.min(availableWidth / original.width, 1.15)
        : Number(zoom);
    const viewport = page.getViewport({ scale });
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    const canvas = document.createElement("canvas");
    canvas.id = "pdf-canvas";
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    canvas.setAttribute(
      "aria-label",
      `${books[currentBook].title}, page ${pageNumber} of ${pdf.numPages}`,
    );
    const paper = element("paper");
    renderTask = page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
      transform:
        pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    });
    await renderTask.promise;
    if (version !== renderVersion) return;
    const layer = document.createElement("div");
    layer.id = "text-layer";
    layer.className = "textLayer";
    textTask = new TextLayerConstructor({
      textContentSource: page.streamTextContent(),
      container: layer,
      viewport,
    });
    await textTask.render();
    if (version !== renderVersion) return;
    paper.style.width = `${viewport.width}px`;
    paper.style.height = `${viewport.height}px`;
    paper.style.setProperty("--scale-factor", scale);
    paper.replaceChildren(canvas, layer);
    paper.hidden = false;
    element("loading").hidden = true;
    element("reading-status").textContent =
      `${books[currentBook].short} · Page ${pageNumber}`;
    storage.write(`${currentBook}:page`, pageNumber);
  } catch (error) {
    if (
      version !== renderVersion ||
      error.name === "RenderingCancelledException" ||
      error.name === "AbortException"
    )
      return;
    element("paper").hidden = true;
    element("loading").hidden = true;
    element("error").hidden = false;
    element("reading-status").textContent = "Page unavailable";
    console.error("PDF page rendering failed:", error);
  } finally {
    if (version === renderVersion)
      element("paper").setAttribute("aria-busy", "false");
  }
}

function goToPage(value) {
  if (!pdf) return;
  const parsed = Number(value);
  pageNumber = Number.isFinite(parsed)
    ? Math.min(pdf.numPages, Math.max(1, Math.trunc(parsed)))
    : pageNumber;
  element("paper-stage").scrollTo({ top: 0, left: 0 });
  void renderPage();
}

function updateWorkspace(mode) {
  currentWorkspace = mode;
  const titles = {
    study: [
      "Study Guide",
      "Senior rank requirements & testing manual",
      "IN THIS GUIDE",
    ],
    throw: [
      "Throw Guide",
      "Kodokan curriculum & rank practice",
      "THROWING GROUPS",
    ],
    reference: [
      "Student Handbook",
      "Wichita Judo reference library",
      "IN THE HANDBOOK",
    ],
    test: [
      "Practice Test",
      "Vocabulary & general information",
      "TEST COVERAGE",
    ],
    cards: ["Flashcards", "Vocabulary practice", "FLASHCARD RANKS"],
  };
  const [title, description, contents] = titles[mode];
  element("task-title").innerHTML = `${title}<span>.</span>`;
  element("task-description").textContent = description;
  element("contents-title").textContent = contents;
  document.querySelector(".reader").hidden = mode !== "reference";
  element("study-guide").hidden = mode !== "study";
  element("throw-guide").hidden = mode !== "throw";
  element("practice-test").hidden = mode !== "test";
  element("flashcards").hidden = mode !== "cards";
  element("reset-task").hidden = mode === "reference";
  element("print-cards").hidden = mode !== "cards";
  element("reset-task").setAttribute("aria-label", `Reset ${title}`);
  element("reset-task").title = `Reset ${title}`;
  element("reset-status").textContent = "";
  element("chapters").setAttribute(
    "aria-label",
    mode === "test" ? "Practice test coverage" : "Document sections",
  );
  if (mode !== "throw") throwGuide.hide();
  document.querySelectorAll("[data-task]").forEach((task) => {
    const selected = task.dataset.task === mode;
    task.classList.toggle("active", selected);
    if (selected) task.setAttribute("aria-current", "page");
    else task.removeAttribute("aria-current");
  });
  const book = { study: "guide", reference: "handbook" }[mode] ?? null;
  document.querySelectorAll("[data-book]").forEach((button) => {
    button.classList.toggle("active", button.dataset.book === book);
    button.setAttribute("aria-pressed", String(button.dataset.book === book));
  });
}

function openThrows() {
  ++loadVersion;
  ++renderVersion;
  renderTask?.cancel();
  textTask?.cancel();
  pdf = undefined;
  element("open-original").href = handbookUrl;
  updateWorkspace("throw");
  throwGuide.show();
}

function openPracticeTest() {
  ++loadVersion;
  ++renderVersion;
  renderTask?.cancel();
  textTask?.cancel();
  pdf = undefined;
  element("open-original").href = guideUrl;
  updateWorkspace("test");
  practiceTest.show();
}

function openFlashcards() {
  ++loadVersion;
  ++renderVersion;
  renderTask?.cancel();
  textTask?.cancel();
  pdf = undefined;
  element("open-original").href = guideUrl;
  updateWorkspace("cards");
  flashcards.show();
}

async function openBook(key) {
  const version = ++loadVersion;
  ++renderVersion;
  renderTask?.cancel();
  textTask?.cancel();
  currentBook = key;
  pdf = undefined;
  pageNumber = 1;
  const book = books[key];
  element("loading").hidden = false;
  element("paper").hidden = true;
  element("error").hidden = true;
  element("document-name").textContent = book.title;
  element("open-original").href = book.url;
  element("download").href = book.url;
  const study = key === "guide";
  updateWorkspace(study ? "study" : "reference");
  if (study) {
    studyGuide.show();
    return;
  }
  updateNavigation();
  try {
    const { getDocument, GlobalWorkerOptions, TextLayer } =
      await import("pdfjs-dist");
    if (version !== loadVersion) return;
    GlobalWorkerOptions.workerSrc = workerUrl;
    TextLayerConstructor = TextLayer;
    if (!documents.has(key)) {
      documents.set(
        key,
        getDocument({
          url: book.url,
          cMapUrl: `${import.meta.env.BASE_URL}pdf-assets/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${import.meta.env.BASE_URL}pdf-assets/standard_fonts/`,
          wasmUrl: `${import.meta.env.BASE_URL}pdf-assets/wasm/`,
          isEvalSupported: false,
        }).promise,
      );
    }
    const loaded = await documents.get(key);
    if (version !== loadVersion) return;
    pdf = loaded;
    const saved = Number(storage.read(`${key}:page`, book.initial));
    pageNumber = Number.isFinite(saved)
      ? Math.min(pdf.numPages, Math.max(1, Math.trunc(saved)))
      : book.initial;
    await renderPage();
  } catch (error) {
    if (version !== loadVersion) return;
    documents.delete(key);
    element("loading").hidden = true;
    element("error").hidden = false;
    element("reading-status").textContent = "Document unavailable";
    console.error("PDF loading failed:", error);
  }
}

const resetTasks = {
  study: {
    title: "Study Guide",
    description:
      "Return to the cover and clear the saved reading position and old guide bookmark.",
    reset: () => studyGuide.reset(),
  },
  throw: {
    title: "Throw Guide",
    description:
      "Clear all rank practice checks and return the catalog, filters, and selected technique to their defaults.",
    reset: () => throwGuide.reset(),
  },
  test: {
    title: "Practice Test",
    description:
      "Discard the current test, answers, results, and saved test settings. This also clears missed-question history.",
    reset: () => practiceTest.reset(),
  },
  cards: { title: "Flashcards", description: "Return flashcards to Rokyu and clear the saved direction, order, and position.", reset: () => flashcards.reset() },
};
element("print-cards").addEventListener("click", () => {
  if (currentWorkspace === "cards") flashcards.print();
});

let resetMode;
element("reset-task").addEventListener("click", () => {
  resetMode = currentWorkspace;
  const task = resetTasks[resetMode];
  if (!task) return;
  element("reset-dialog-title").textContent = `Reset ${task.title}?`;
  element("reset-dialog-description").textContent = task.description;
  element("reset-status").textContent = "";
  element("reset-dialog").returnValue = "";
  element("reset-dialog").showModal();
});
element("reset-dialog").addEventListener("close", () => {
  if (
    element("reset-dialog").returnValue !== "confirm" ||
    resetMode !== currentWorkspace
  )
    return;
  const task = resetTasks[resetMode];
  element("reset-status").textContent = task.reset()
    ? `${task.title} reset.`
    : "Unable to clear saved data. Please try again.";
});

document.querySelectorAll("[data-task]").forEach((button) =>
  button.addEventListener("click", () => {
    if (button.dataset.task === "study") void openBook("guide");
    else if (button.dataset.task === "throw") openThrows();
    else if (button.dataset.task === "test") openPracticeTest();
    else openFlashcards();
  }),
);
document
  .querySelectorAll("[data-book]")
  .forEach((button) =>
    button.addEventListener("click", () => openBook(button.dataset.book)),
  );
element("previous").addEventListener("click", () => goToPage(pageNumber - 1));
element("next").addEventListener("click", () => goToPage(pageNumber + 1));
element("page-number").addEventListener("change", (event) =>
  goToPage(event.target.value),
);
element("page-number").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    goToPage(event.target.value);
    event.target.blur();
  }
});
element("zoom").addEventListener("change", (event) => {
  zoom = event.target.value;
  void renderPage();
});
function changeZoom(direction) {
  const values = [0.75, 1, 1.25, 1.5, 2];
  const current =
    zoom === "fit"
      ? element("pdf-canvas").clientWidth / nativePageWidth
      : Number(zoom);
  zoom = String(
    direction > 0
      ? (values.find((value) => value > current + 0.01) ?? 2)
      : (values.findLast((value) => value < current - 0.01) ?? 0.75),
  );
  element("zoom").value = zoom;
  void renderPage();
}
element("zoom-in").addEventListener("click", () => changeZoom(1));
element("zoom-out").addEventListener("click", () => changeZoom(-1));
element("bookmark").addEventListener("click", () => {
  if (!pdf) return;
  storage.write(
    `${currentBook}:bookmark`,
    storage.read(`${currentBook}:bookmark`, null) === pageNumber
      ? null
      : pageNumber,
  );
  updateNavigation();
});
element("saved-page").addEventListener("click", () =>
  goToPage(storage.read(`${currentBook}:bookmark`, 1)),
);
element("fullscreen").hidden = !document.fullscreenEnabled;
element("fullscreen").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector(".reader").requestFullscreen();
  } catch {
    element("reading-status").textContent =
      "Fullscreen is unavailable in this browser";
  }
});
element("retry").addEventListener("click", () =>
  pdf ? renderPage() : openBook(currentBook),
);

function closeMobilePdf() {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {});
  }
  if (currentBook === "handbook") {
    openThrows();
    return;
  }
  ++loadVersion;
  ++renderVersion;
  renderTask?.cancel();
  textTask?.cancel();
  pdf = undefined;
  updateWorkspace("study");
  studyGuide.show();
}

element("reader-mobile-close").addEventListener("click", closeMobilePdf);
element("paper-stage").addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    goToPage(pageNumber + (event.key === "ArrowRight" ? 1 : -1));
  }
});
new ResizeObserver(([entry]) => {
  const width = entry.borderBoxSize[0].inlineSize;
  if (width <= 0 || Math.abs(width - lastReaderWidth) < 1) return;
  lastReaderWidth = width;
  clearTimeout(resizing);
  resizing = setTimeout(() => {
    if (zoom === "fit") void renderPage();
  }, 180);
}).observe(document.querySelector(".reader"));
await openBook("guide");
