import {
  createIcons,
  Search,
  List,
  ClipboardCheck,
  ChevronRight,
  ExternalLink,
  Play,
  ArrowLeft,
  RotateCcw,
  BookOpen,
} from "lucide";
import {
  throwGroups,
  throwingTechniques,
  practiceRanks,
  filterTechniques,
  normalizeTechnique,
} from "./throw-content.js";
import officialVideos from "./throw-videos.json";

const icons = {
  Search,
  List,
  ClipboardCheck,
  ChevronRight,
  ExternalLink,
  Play,
  ArrowLeft,
  RotateCcw,
  BookOpen,
};

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function icon(name) {
  const result = node("i");
  result.dataset.lucide = name;
  return result;
}

function externalLink(label, url) {
  const link = node("a", label, "source-link");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function populateSelect(select, entries) {
  select.replaceChildren(
    ...entries.map(([value, label]) => {
      const option = node("option", label);
      option.value = value;
      return option;
    }),
  );
}

function matchingTechnique(requirement) {
  const name = normalizeTechnique(requirement.text.split(" - ")[0]);
  return throwingTechniques.find(
    (technique) =>
      technique.id ===
      (name === "sasetsurikomiashi" ? "sasaetsurikomiashi" : name),
  );
}

function videoPreview(technique) {
  const video = officialVideos.videos[technique.id];
  const media = node("div", undefined, "throw-video");
  const image = node("img");
  image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  image.alt = `Kodokan demonstration of ${technique.name}`;
  image.referrerPolicy = "no-referrer";
  image.addEventListener(
    "error",
    () => {
      image.src = `${import.meta.env.BASE_URL}handbook-cover.webp`;
      image.alt = "Student handbook cover";
    },
    { once: true },
  );
  const play = node("button", undefined, "throw-play");
  play.setAttribute(
    "aria-label",
    `Play official demonstration of ${technique.name}`,
  );
  play.title = "Play official Kodokan demonstration";
  play.append(icon("play"));
  play.addEventListener("click", () => {
    const frame = node("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
    frame.title = `Kodokan demonstration of ${technique.name}`;
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    media.replaceChildren(frame);
  });
  media.append(image, play, node("span", video.duration, "video-duration"));
  return media;
}

export function createThrowGuide({
  container,
  chapters,
  handbookUrl,
  guideUrl,
  storage,
  onOpenReference,
}) {
  container.innerHTML = `
    <header class="throw-heading"><div><p class="section-label">THROWING CURRICULUM</p><h2>Nage-waza</h2><p>68 techniques <span>/</span> 7 groups</p></div><button id="throw-handbook" class="outline-button"><i data-lucide="book-open"></i>View handbook</button></header>
    <div class="throw-modes" role="tablist" aria-label="Throw Guide views">
      <button id="catalog-tab" role="tab" aria-controls="throw-catalog" aria-selected="true"><i data-lucide="list"></i>Catalog</button>
      <button id="practice-tab" role="tab" aria-controls="throw-practice" aria-selected="false"><i data-lucide="clipboard-check"></i>Rank practice</button>
    </div>
    <div id="throw-catalog" role="tabpanel" aria-labelledby="catalog-tab">
      <div class="throw-filters"><label class="throw-search"><span class="visually-hidden">Search throws</span><i data-lucide="search"></i><input id="throw-search" type="search" placeholder="Search Japanese or English name" autocomplete="off" /></label><label>Group<select id="throw-group" aria-label="Throw group"></select></label><label>Named rank requirements<select id="throw-rank" aria-label="Throw rank"></select></label></div>
      <div class="throw-results-heading"><output id="throw-result-count"></output><button id="throw-clear" class="text-command" hidden><i data-lucide="rotate-ccw"></i>Clear filters</button></div>
      <div class="throw-browser"><div><div id="throw-results" class="throw-results" role="group" aria-label="Throwing techniques"></div><div id="throw-empty" class="throw-empty" hidden><h3>No matching throws</h3><button id="throw-empty-reset" class="outline-button">Clear filters</button></div></div><aside id="throw-detail" class="throw-detail" aria-label="Technique details"></aside></div>
    </div>
    <div id="throw-practice" role="tabpanel" aria-labelledby="practice-tab" hidden>
      <div class="practice-heading"><label>Rank<select id="practice-rank" aria-label="Practice rank"></select></label><output id="practice-progress"></output><button id="practice-clear" class="text-command"><i data-lucide="rotate-ccw"></i>Clear checks</button></div>
      <h3 id="practice-title"></h3><a id="practice-source" class="source-link" target="_blank" rel="noopener"></a>
      <div id="practice-requirements"></div><p class="practice-note">Practice record only. All promotions must be approved by a Wichita Judo Sensei.</p>
    </div>`;
  const find = (id) => container.querySelector(`#${id}`);
  const saved = storage.read("throws:state", {});
  const state = {
    mode: saved?.mode === "practice" ? "practice" : "catalog",
    query: "",
    group: throwGroups.some((group) => group.id === saved?.group)
      ? saved.group
      : "all",
    rank: practiceRanks.some((rank) => rank.id === saved?.rank)
      ? saved.rank
      : "all",
    practiceRank: practiceRanks.some((rank) => rank.id === saved?.practiceRank)
      ? saved.practiceRank
      : "rokyu",
    selected: throwingTechniques.some(
      (technique) => technique.id === saved?.selected,
    )
      ? saved.selected
      : throwingTechniques[0].id,
  };
  populateSelect(find("throw-group"), [
    ["all", "All groups"],
    ...throwGroups.map((group) => [
      group.id,
      `${group.title} (${group.throws.length})`,
    ]),
  ]);
  populateSelect(find("throw-rank"), [
    ["all", "All ranks"],
    ...practiceRanks.map((rank) => [
      rank.id,
      `${rank.title} - ${rank.detail.replace("Senior ", "")}`,
    ]),
  ]);
  populateSelect(
    find("practice-rank"),
    practiceRanks.map((rank) => [
      rank.id,
      `${rank.title} - ${rank.detail.replace("Senior ", "")}`,
    ]),
  );

  function persist() {
    storage.write("throws:state", state);
  }

  function renderSidebar() {
    const entries =
      state.mode === "practice"
        ? practiceRanks
        : [
            {
              id: "all",
              title: "All throws",
              detail: "Complete handbook catalog",
            },
            ...throwGroups,
          ];
    chapters.replaceChildren(
      ...entries.map((entry) => {
        const selected =
          entry.id ===
          (state.mode === "practice" ? state.practiceRank : state.group);
        const button = node(
          "button",
          undefined,
          `chapter ${selected ? "selected" : ""}`,
        );
        button.setAttribute("aria-label", entry.title);
        if (selected) button.setAttribute("aria-current", "location");
        const label = node("span", entry.title);
        label.append(node("small", entry.detail ?? entry.subtitle));
        const count =
          state.mode === "practice"
            ? entry.requirements.length
            : (entry.throws?.length ?? throwingTechniques.length);
        button.append(
          node("span", undefined, `chapter-marker ${entry.color ?? "blue"}`),
          label,
          node("span", String(count).padStart(2, "0"), "chapter-page"),
        );
        button.addEventListener("click", () => {
          if (state.mode === "practice") state.practiceRank = entry.id;
          else state.group = entry.id;
          render();
        });
        return button;
      }),
    );
    document.getElementById("contents-title").textContent =
      state.mode === "practice" ? "RANK PRACTICE" : "THROWING GROUPS";
    document.getElementById("chapter-count").textContent = String(
      entries.length,
    ).padStart(2, "0");
  }

  function renderDetail(technique, focus = false) {
    const detail = find("throw-detail");
    detail.hidden = !technique;
    detail.replaceChildren();
    if (!technique) return;
    const back = node("button", undefined, "text-command throw-back");
    back.append(icon("arrow-left"), node("span", "Back to results"));
    back.addEventListener("click", () => {
      find("throw-results").scrollIntoView({ block: "start" });
      find("throw-results")
        .querySelector("button[aria-pressed=true]")
        ?.focus({ preventScroll: true });
    });
    const group = throwGroups.find((entry) => entry.id === technique.group);
    const heading = node("h3", technique.name);
    detail.append(
      back,
      node("p", `${group.title} / ${technique.order}`, "section-label"),
      heading,
      node("p", technique.translation, "throw-translation"),
      videoPreview(technique),
    );
    const videoLine = node("div", undefined, "video-attribution");
    videoLine.append(
      node("span", "KODOKAN / IJF Academy"),
      externalLink(
        "Watch on YouTube",
        `https://www.youtube.com/watch?v=${officialVideos.videos[technique.id].id}`,
      ),
    );
    detail.append(videoLine);
    if (technique.restriction)
      detail.append(node("p", technique.restriction, "source-note"));
    detail.append(
      node("h4", "Book references"),
      externalLink(
        `Student Handbook - PDF page ${technique.page}`,
        `${handbookUrl}#page=${technique.page}`,
      ),
    );
    const rankLinks = node("div", undefined, "throw-rank-links");
    for (const id of technique.ranks) {
      const rank = practiceRanks.find((entry) => entry.id === id);
      rankLinks.append(
        externalLink(
          `${rank.title} - ${rank.detail}`,
          `${guideUrl}#page=${rank.page}`,
        ),
      );
    }
    if (!technique.ranks.length)
      rankLinks.append(
        node(
          "p",
          "No direct rank listing in the senior guide.",
          "source-blank",
        ),
      );
    detail.append(
      rankLinks,
      node(
        "p",
        "Train under the guidance of a qualified Judo instructor.",
        "practice-note",
      ),
    );
    createIcons({ icons });
    if (focus && innerWidth <= 1050) detail.scrollIntoView({ block: "start" });
  }

  function renderResults() {
    const results = filterTechniques(state);
    if (!results.some((technique) => technique.id === state.selected))
      state.selected = results[0]?.id ?? "";
    find("throw-result-count").textContent =
      `${results.length} / 68 techniques`;
    find("throw-clear").hidden =
      !state.query && state.group === "all" && state.rank === "all";
    find("throw-empty").hidden = results.length > 0;
    find("throw-results").replaceChildren(
      ...results.map((technique) => {
        const button = node("button", undefined, "throw-row");
        button.dataset.technique = technique.id;
        button.setAttribute("aria-label", technique.name);
        button.setAttribute(
          "aria-pressed",
          String(technique.id === state.selected),
        );
        const text = node("span", undefined, "throw-row-text");
        text.append(
          node("strong", technique.name),
          node("small", technique.translation),
        );
        const group = throwGroups.find((entry) => entry.id === technique.group);
        button.append(
          node(
            "span",
            String(technique.order).padStart(2, "0"),
            "throw-row-number",
          ),
          text,
          node("span", group.title, "throw-row-group"),
          icon("chevron-right"),
        );
        button.addEventListener("click", () => {
          state.selected = technique.id;
          find("throw-results")
            .querySelectorAll("button")
            .forEach((row) =>
              row.setAttribute(
                "aria-pressed",
                String(row.dataset.technique === technique.id),
              ),
            );
          persist();
          renderDetail(technique, true);
        });
        return button;
      }),
    );
    renderDetail(results.find((technique) => technique.id === state.selected));
  }

  function practiceChecks() {
    const value = storage.read(`throws:checks:${state.practiceRank}`, []);
    return new Set(
      Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : [],
    );
  }

  function updateProgress(rank, checks) {
    const count = rank.requirements.filter((entry) =>
      checks.has(entry.text),
    ).length;
    find("practice-progress").textContent =
      `${count} / ${rank.requirements.length} practiced`;
    find("practice-clear").disabled = count === 0;
  }

  function renderPractice() {
    const rank = practiceRanks.find((entry) => entry.id === state.practiceRank);
    const checks = practiceChecks();
    find("practice-rank").value = rank.id;
    find("practice-title").textContent = `${rank.title} - ${rank.detail}`;
    find("practice-source").textContent =
      `Senior Student Guide - PDF page ${rank.page}`;
    find("practice-source").href = `${guideUrl}#page=${rank.page}`;
    find("practice-requirements").replaceChildren(
      ...rank.requirements.map((requirement) => {
        const row = node("div", undefined, "practice-row");
        const label = node("label");
        const input = node("input");
        input.type = "checkbox";
        input.checked = checks.has(requirement.text);
        input.addEventListener("change", () => {
          if (input.checked) checks.add(requirement.text);
          else checks.delete(requirement.text);
          storage.write(`throws:checks:${rank.id}`, [...checks]);
          updateProgress(rank, checks);
        });
        label.append(input, node("span", requirement.text));
        row.append(label);
        const technique = matchingTechnique(requirement);
        if (technique) {
          const view = node("button", undefined, "icon-button");
          view.setAttribute("aria-label", `View ${technique.name}`);
          view.title = `View ${technique.name}`;
          view.append(icon("chevron-right"));
          view.addEventListener("click", () => {
            Object.assign(state, {
              mode: "catalog",
              query: "",
              group: "all",
              rank: rank.id,
              selected: technique.id,
            });
            render();
          });
          row.append(view);
        }
        return row;
      }),
    );
    updateProgress(rank, checks);
  }

  function render() {
    const practice = state.mode === "practice";
    find("catalog-tab").setAttribute("aria-selected", String(!practice));
    find("practice-tab").setAttribute("aria-selected", String(practice));
    find("catalog-tab").tabIndex = practice ? -1 : 0;
    find("practice-tab").tabIndex = practice ? 0 : -1;
    find("throw-catalog").hidden = practice;
    find("throw-practice").hidden = !practice;
    find("throw-group").value = state.group;
    find("throw-rank").value = state.rank;
    find("throw-search").value = state.query;
    renderSidebar();
    if (practice) {
      find("throw-detail").replaceChildren();
      renderPractice();
    } else renderResults();
    persist();
    createIcons({ icons });
  }

  function resetFilters() {
    Object.assign(state, { query: "", group: "all", rank: "all" });
    render();
  }
  find("catalog-tab").addEventListener("click", () => {
    state.mode = "catalog";
    render();
  });
  find("practice-tab").addEventListener("click", () => {
    state.mode = "practice";
    render();
  });
  container
    .querySelector(".throw-modes")
    .addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      if (event.key === "Home") state.mode = "catalog";
      else if (event.key === "End") state.mode = "practice";
      else state.mode = state.mode === "catalog" ? "practice" : "catalog";
      render();
      find(state.mode === "catalog" ? "catalog-tab" : "practice-tab").focus();
    });
  find("throw-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderResults();
    persist();
  });
  find("throw-group").addEventListener("change", (event) => {
    state.group = event.target.value;
    render();
  });
  find("throw-rank").addEventListener("change", (event) => {
    state.rank = event.target.value;
    render();
  });
  find("practice-rank").addEventListener("change", (event) => {
    state.practiceRank = event.target.value;
    render();
  });
  find("throw-clear").addEventListener("click", resetFilters);
  find("throw-empty-reset").addEventListener("click", resetFilters);
  find("practice-clear").addEventListener("click", () => {
    storage.write(`throws:checks:${state.practiceRank}`, []);
    renderPractice();
    createIcons({ icons });
  });
  find("throw-handbook").addEventListener("click", () => onOpenReference());
  return { show: render, hide: () => find("throw-detail").replaceChildren() };
}
