# Wichita Judo Study Companion

A responsive red, white, and blue companion for the Wichita Judo books in [docs](docs).

## Run

Requires Node.js 22.13+ (or 24+).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Study Guide presents the complete content of the 20-page senior guide as responsive web text, lists, tables, vocabulary, questions and answers, and blank record-sheet fields. Its ten sections include the cover and contents, dojo rules, points system, all six ranks, and promotion records. The PDF is a reference link only, with page-specific links alongside the extracted content. No PDF is fetched to read Study Guide.

Throw Guide is a native catalog of all 68 handbook throws with Japanese/English-name search, curriculum-group and named-rank filters, official Kodokan video demonstrations, source-page links, and rank-specific practice checklists. Catalog preferences and practice checks are saved locally per rank. They record practice, not promotion eligibility or Sensei approval.

Practice Test asks for a target rank and includes vocabulary and general-information questions from that rank and every lower rank. It supports written recall, guide-answer reveal, self-assessment, answer review, missed-question retries, and saved sessions.

The 74-page handbook remains available through the library or Throw Guide's **View handbook** button in a separate reference viewer, with section shortcuts, page navigation, selectable text where available, zoom, fullscreen where supported, original-PDF access, downloads, and a bookmark. The PDF engine loads only when opening this viewer. It observes reader-width changes rather than its own scrolling content, reserves stable scrollbar space, and swaps fully rendered pages into view to avoid flicker.

The last study section and handbook reading position are saved independently in this browser. Existing study-PDF reading positions are migrated to the corresponding content section. No account or backend is required.

Both PDFs and the handbook renderer's fonts, character maps, and image decoders are served locally. The prepare scripts copy the decoder assets from installed dependencies before development and production builds. Google Fonts supplies the interface fonts, with local font fallbacks when unavailable.

## Study Content

The checked-in extraction is in [src/study-content.js](src/study-content.js), with its native HTML renderer in [src/study-guide.js](src/study-guide.js). Every source PDF page is represented. Text was extracted locally using Tesseract OCR and checked against the rendered scans, particularly technique lists, two-column vocabulary tables, point values, and time requirements. Reading the app does not require OCR software.

To repeat the raw extraction, install Tesseract with English language data and make `tesseract` available on `PATH` (or set `TESSERACT_PATH` to its executable), then run:

```sh
node scripts/extract-guide.mjs
```

The script writes page images and raw OCR JSON to a temporary directory and prints its location. It does not overwrite the reviewed content. Review OCR against the page images before updating the content file; raw OCR misreads fractional points and multi-column tables.

Source wording, spellings, blank answers, and repeated question numbers are retained rather than replaced with outside material. Whitespace, bullet styles, and dash/fraction typography are normalized for web reading. Vocabulary tables are flattened from two parallel English/Japanese pairs into one accessible two-column table. Blank forms preserve their labels and column headings as reference content, not editable student records.

Source discrepancies are flagged inline: the main Ikkyu requirements say 12 months (48 total), whereas the promotion record says 18 months (54 total); Rokyu's left/right vocabulary appears reversed. Both versions remain as printed for confirmation with Sensei. Page links use PDF page positions, which can differ from printed page numbers.

## Throw Guide

[src/throw-content.js](src/throw-content.js) preserves the handbook's 40 Gokyo throws (five groups of eight), eight Habukareta throws, and twenty Shinmeisho throws, with references to PDF pages 34-36. English names are the handbook's common translations. Belt mappings and practice requirements come from the extracted senior guide, not from assumptions about Gokyo group numbers. The guide's `Sase` spelling is mapped to the handbook's `Sasae` entry for lookup; the original practice wording remains intact.

Rank filters show directly named throws. Rank practice also retains combination throws, teaching tasks, open-ended Makikomi requirements, and specified Nage No Kata sets without inventing particular techniques to satisfy them. Competition restrictions are labeled as handbook notes rather than a live rules feed; confirm current rules with Sensei.

[src/throw-videos.json](src/throw-videos.json) contains 68 exact-title video matches from the official [Kodokan channel](https://www.youtube.com/@KODOKANJUDO), including its verified channel ID. Thumbnails load from YouTube; a privacy-enhanced YouTube player loads only after pressing Play. Every technique also offers a direct **Watch on YouTube** link if embedding is blocked. Playback requires internet access and may be restricted by YouTube or the local network.

To reverify public video metadata (network required):

```sh
node scripts/update-throw-videos.mjs
```

The verifier checks both the exact normalized technique title and official channel identity before writing the lookup file. It does not download videos, use an API key, or invent links. Review generated metadata before committing it.

## Practice Test

[src/practice-test-content.js](src/practice-test-content.js) derives the question bank directly from the extracted guide. Rank order is Rokyu, Gokyu, Yonkyu, Sankyu, Nikyu, Ikkyu. Tests never include a rank above the selected target. The full cumulative pool is selected by default; optional ten- or twenty-question sessions draw a shuffled sample from that pool. Vocabulary and general information may also be selected independently.

| Target Rank | Vocabulary | General Information | Total |
| ----------- | ---------: | ------------------: | ----: |
| Rokyu       |         30 |                   8 |    38 |
| Gokyu       |         58 |                  12 |    70 |
| Yonkyu      |         84 |                  19 |   103 |
| Sankyu      |        116 |                  26 |   142 |
| Nikyu       |        136 |                  32 |   168 |
| Ikkyu       |        166 |                  36 |   202 |

[src/practice-test.js](src/practice-test.js) presents one question at a time. New tests default to **Multiple choice where suitable**: currently 171 questions have four single-answer choices, 15 unordered-list questions use multi-select checkboxes, and 16 ordered, demonstration, open-response, or insufficient-distractor questions remain written. This includes English-definition choices for Shintai and Debana, whose language columns are reversed in the source. **Written answers** is also available for an entirely written test. Rank coverage and question counts are unchanged.

[src/practice-test-choices.js](src/practice-test-choices.js) curates related distractor groups: uniform parts, ranks, body parts, technique families, commands, people, dates, and other guide topics. For example, Obi is paired only with alternatives from Uwagi, Zubon, Sode, and Eri. Single-answer questions get three distinct incorrect options and one correct option; accepted synonyms are excluded from distractors. Both distractor selection and answer order are shuffled for a fresh test, retake, or retry. Choices and selections are saved with the attempt, so navigating or reloading never reshuffles them. Existing written answers are preserved rather than discarded.

The checkbox definitions in [src/practice-test-multiselect.js](src/practice-test-multiselect.js) cover the Four Heavenly Lords, throw phases, parts of unarmed combat, standing/sacrifice/ground divisions, Kano's Jujutsu styles and principles, Nage No Kata divisions and sets, the dojo's four sides, Katame No Kata divisions and sets, and techniques removed when creating Judo. Correct answer groups come from the extracted guide, with three topic-related distractors. Each question states how many answers to select; all required answers and no extras are needed. Ordered-number and belt-order questions, demonstrations, and personal reflections remain written. Untouched instances in mixed-format saved attempts upgrade automatically; already written or revealed answers and explicit written-format tests are left unchanged.

**American Olympic medalists** is a separately attributed supplement because the PDF leaves its answer blank. The displayed verified examples are Kayla Harrison and Travis Stevens (official Team USA profiles), plus Ronda Rousey and Marti Malloy (official Olympics profiles). Any three of these valid displayed names are accepted, with no incorrect extras; choosing all four does not satisfy the prompt to list three. The answer review provides all four official links, labels the examples as supplemental rather than PDF content, and explains that this is not an exhaustive list. The original blank answer in [src/study-content.js](src/study-content.js) is unchanged. Unselected valid alternatives are labeled **Also a valid answer**, not treated as required omissions.

**Next question** checks an unassessed selection or written answer against the guide, reveals the reference and green/red feedback, and waits for **Continue** before advancing. Multiple-choice grading highlights the correct option and any incorrect selection, with text labels in addition to color. The final question is checked before **View results** becomes available. Empty submissions stay on the question with a validation message.

Written-answer checking ignores case, accents, punctuation, and spacing, and accepts explicit vocabulary alternatives separated by `/` or `or`. Exact normalized matches are marked correct; other wording is conservatively marked **Needs review**, not assumed semantically wrong. Historical explanations and lists are not evaluated by an AI judge. **Got it** / **Needs review** remain available for written questions to override the comparison after reviewing the reference. Multiple-choice answers are graded directly against the guide. Open responses without reference answers remain unscored. Responses, question order, position, ratings, choices, and checked feedback survive workspace changes and reloads in the same browser.

The source's completely blank Gokyu question 3 is omitted because it contains no prompt. The personal judo journey remains an open response, marked reviewed rather than correct/incorrect and excluded from the recall-score denominator. The medalist prompt is now scored using the explicitly cited supplement above. Other unassessed questions remain in the denominator, so ending early cannot produce a misleading perfect score. Source discrepancies remain linked and flagged rather than silently corrected. Results are self-assessment, not rank-test certification or promotion approval.

The six-Kyu-rank ordering question also accepts the rank names alone: Ikkyu, Nikyu, Sankyu, Yonkyu, Gokyu, Rokyu. Belt descriptions are optional for this response; missing, extra, repeated, and out-of-order ranks are not accepted.

For the ultimate-goal question, articles and the qualifiers "eventual" and "human" are optional. "The harmonious development and perfection of character" is accepted, while missing core concepts, extra contradictory text, and negation are not.

## Verify & Build

```sh
npx playwright install chromium
npm test
npm run build
npm run preview
```

Browser tests cover all 20 extracted study pages, native reading with PDF requests blocked, source structure and values, all 68 throws and official-video metadata, search/filter/empty states, practice persistence and independent ranks, every cumulative practice-test rank boundary, category filters, recall scoring, retries, session recovery, responsive layouts, and the handbook viewer's zoom, bounds, bookmarks, error recovery, and idle/resize flicker regression. Embedded-player tests verify the selected video URL using a stubbed frame; they do not depend on third-party streaming availability. Deploy the generated `dist` folder to a static host. The PDFs and their extracted content are included in the build; do not deploy publicly unless their distribution is approved.

Playwright builds the app and runs its own production preview on port 4173. It does not reuse the development server on port 5173, so live edits and Vite reloads do not interrupt a test attempt or the user's preview.
