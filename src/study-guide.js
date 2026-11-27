import { createIcons, ChevronLeft, ChevronRight } from "lucide";
import { studySections, studySource } from "./study-content.js";

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function sourceLink(url, page) {
  const link = node("a", `PDF page ${page}`, "source-link");
  link.href = `${url}#page=${page}`;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", `View PDF page ${page} for reference`);
  return link;
}

function contentTable(block) {
  const wrapper = node("div", undefined, "study-table-scroll");
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", block.heading);
  const table = node("table");
  table.append(node("caption", block.heading, "visually-hidden"));
  const head = node("thead");
  const headings = node("tr");
  for (const column of block.columns) {
    const cell = node("th", column);
    cell.scope = "col";
    headings.append(cell);
  }
  head.append(headings);
  const body = node("tbody");
  for (const row of block.rows) {
    const line = node("tr");
    for (const value of row) {
      const cell = node("td", value);
      if (!value) cell.setAttribute("aria-label", "Blank in source");
      line.append(cell);
    }
    body.append(line);
  }
  table.append(head, body);
  wrapper.append(table);
  return wrapper;
}

function contentQuestions(questions) {
  const list = node("ol", undefined, "study-questions");
  for (const [number, question, answer] of questions) {
    const item = node("li");
    item.value = number;
    item.append(node("h4", question || "Blank question in source"));
    item.append(
      node(
        "p",
        answer || "Not provided in source",
        answer ? "study-answer" : "source-blank",
      ),
    );
    list.append(item);
  }
  return list;
}

function contentFields(fields) {
  const list = node("dl", undefined, "source-fields");
  for (const field of fields) {
    const group = node("div");
    group.append(node("dt", field), node("dd", "Blank in source"));
    list.append(group);
  }
  return list;
}

function contentBlock(block) {
  const section = node("section", undefined, "study-block");
  section.append(node("h3", block.heading));
  if (block.items) {
    const list = node(block.ordered ? "ol" : "ul", undefined, "study-list");
    for (const item of block.items)
      list.append(
        node(
          "li",
          item || "Blank item in source",
          item ? undefined : "source-blank",
        ),
      );
    section.append(list);
  }
  if (block.rows) section.append(contentTable(block));
  if (block.questions) section.append(contentQuestions(block.questions));
  if (block.fields) section.append(contentFields(block.fields));
  for (const text of block.paragraphs ?? []) section.append(node("p", text));
  return section;
}

export function createStudyGuide({ container, chapters, sourceUrl, storage }) {
  container.innerHTML = `
    <header class="study-heading">
      <div><p class="section-label">SENIOR STUDENT GUIDE</p><h2 id="study-section-title"></h2><p id="study-section-detail"></p></div>
      <span class="study-edition">${studySource.version}</span>
    </header>
    <div id="study-content"></div>
    <nav class="study-pagination" aria-label="Study sections">
      <button id="study-previous" class="outline-button" aria-label="Previous section"><i data-lucide="chevron-left"></i><span>Previous</span></button>
      <output id="study-position"></output>
      <button id="study-next" class="outline-button" aria-label="Next section"><span>Next</span><i data-lucide="chevron-right"></i></button>
    </nav>`;
  let currentId = storage.read("study:section", null);
  if (!studySections.some((section) => section.id === currentId)) {
    const oldPage = Number(storage.read("guide:page", 1));
    currentId =
      studySections.findLast((section) => section.pages[0].number <= oldPage)
        ?.id ?? "overview";
  }

  function showSection(id, scroll = false) {
    const section =
      studySections.find((entry) => entry.id === id) ?? studySections[0];
    currentId = section.id;
    storage.write("study:section", currentId);
    container.dataset.section = currentId;
    container.querySelector("#study-section-title").textContent = section.title;
    container.querySelector("#study-section-detail").textContent =
      section.detail;
    const content = container.querySelector("#study-content");
    content.replaceChildren();
    for (const page of section.pages) {
      const group = node("div", undefined, "study-source-page");
      group.dataset.sourcePage = page.number;
      group.append(sourceLink(sourceUrl, page.number));
      for (const block of page.blocks) group.append(contentBlock(block));
      if (page.note) group.append(node("p", page.note, "source-note"));
      content.append(group);
    }
    chapters.replaceChildren(
      ...studySections.map((entry) => {
        const button = node(
          "button",
          undefined,
          `chapter ${entry.id === currentId ? "selected" : ""}`,
        );
        button.setAttribute("aria-label", entry.title);
        if (entry.id === currentId)
          button.setAttribute("aria-current", "location");
        const title = node("span", entry.title);
        title.append(node("small", entry.detail));
        button.append(
          node("span", undefined, `chapter-marker ${entry.color}`),
          title,
          node(
            "span",
            String(entry.pages[0].number).padStart(2, "0"),
            "chapter-page",
          ),
        );
        button.addEventListener("click", () => showSection(entry.id, true));
        return button;
      }),
    );
    const index = studySections.indexOf(section);
    container.querySelector("#study-position").textContent =
      `${index + 1} / ${studySections.length}`;
    container.querySelector("#study-previous").disabled = index === 0;
    container.querySelector("#study-next").disabled =
      index === studySections.length - 1;
    document.getElementById("chapter-count").textContent = String(
      studySections.length,
    ).padStart(2, "0");
    if (scroll) {
      container.scrollIntoView({ block: "start" });
      const heading = container.querySelector("#study-section-title");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  function step(direction) {
    const index = studySections.findIndex(
      (section) => section.id === currentId,
    );
    const next = studySections[index + direction];
    if (next) showSection(next.id, true);
  }
  container
    .querySelector("#study-previous")
    .addEventListener("click", () => step(-1));
  container
    .querySelector("#study-next")
    .addEventListener("click", () => step(1));
  createIcons({ icons: { ChevronLeft, ChevronRight } });
  return {
    show: () => showSection(currentId),
    reset() {
      if (
        !["study:section", "guide:page", "guide:bookmark"].every((key) =>
          storage.remove(key),
        )
      )
        return false;
      showSection("overview");
      return true;
    },
  };
}
