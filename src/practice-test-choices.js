import { checkPracticeAnswer } from "./practice-test-content.js";
import { getMultiSelectDefinition } from "./practice-test-multiselect.js";

const vocabularyGroups = [
  ["Obi", "Uwagi", "Zubon", "Sode", "Eri"],
  ["Judogi", "Obi", "Uwagi", "Zubon", "Sode", "Eri"],
  ["Rokyu", "Gokyu", "Yonkyu", "Sankyu", "Nikyu", "Ikkyu"],
  [
    "Shodan",
    "Nidan",
    "Sandan",
    "Yondan",
    "Godan",
    "Rokudan",
    "Shichidan",
    "Hachidan",
    "Kudan",
    "Judan",
    "Junidan",
  ],
  [
    "Nage No Kata",
    "Katame No Kata",
    "Ju No Kata",
    "Goshinjitsu No Kata",
    "Joshi Goshinho Kata",
    "Kimi No Kata",
    "Koshiki No Kata",
    "Itsutsu No Kata",
    "Seiryoko Zenyo Kokumin Taiiku",
  ],
  [
    "Sensei",
    "Judoka",
    "Tori",
    "Uke",
    "Shihan",
    "Yudansha",
    "Mudansha",
    "Shimpan",
  ],
  [
    "Kyotsuke",
    "Rei",
    "Hajime",
    "Matte",
    "Sore Made",
    "Sono Mama",
    "Yoshi",
    "Mokuso",
    "Maitta",
    "Toketa",
    "Osae Komi",
    "Zarei",
    "Ritsurei",
  ],
  ["Hai", "Iie", "Onegaishimasu", "Domo arigatou gozaimasu", "Rei"],
  ["Dojo", "Tatame", "Shiaijo", "Sokuteiki"],
  ["Ukemi", "Ushiro Ukemi", "Zempo Kaiten Ukemi", "Yoko Ukemi", "Mae Ukemi"],
  ["Tsugi Ashi", "Ayumi Ashi", "Tai Sabaki", "Shizen Hontai", "Jigo Hontai"],
  ["Seiza", "Anza", "Shizen Hontai", "Jigo Hontai"],
  ["Kuzushi", "Tsukuri", "Kake", "Kumi Kata", "Tai Sabaki"],
  [
    "Body movement/locomotion",
    "The instant an opportunity for attack appears",
    "Off Balance",
    "Entry into a Throw",
    "Execution of a Throw",
    "Forms of Gripping an Opponent",
    "Repetitive Attack Practice without Throwing",
    "Repetitive Throwing Practice without Resistance",
  ],
  ["Shime/Jime", "Gatame", "Garami", "Kuzure", "Sukashi"],
  ["Yoko or Shiho", "Shiho", "Soto", "Uchi", "Nami", "Gyaku"],
  ["Ai Yotsu", "Kenka Yotsu", "Hikite", "Tsurite", "Kumi Kata"],
  ["Hairi Kata", "Kumi Kata", "Uchi Komi", "Nage Komi", "Tai Sabaki"],
  [
    "Randori",
    "Kata",
    "Shiai",
    "Uchi Komi",
    "Nage Komi",
    "Kumi Kata",
    "Taiso",
    "Junbi Undo",
    "Shumatsu Undo",
    "Happo No Kuzushi",
  ],
  ["Ippon", "Waza-ari", "Yuko", "Kinsa", "Shido", "Hansokumake", "Hantai"],
  [
    "Te Waza",
    "Ashi Waza",
    "Koshi Waza",
    "Shime Waza",
    "Osaekomi Waza",
    "Kansetsu Waza",
    "Nage Waza",
    "Newaza",
    "Tachi Waza",
    "Sutemi Waza",
    "Ma Sutemi Waza",
    "Yoko Sutemi Waza",
    "Atemi Waza",
    "Kaeshi Waza",
    "Tokui Waza",
  ],
  ["Te", "Ashi", "Goshi or Koshi", "Hiza", "Ude", "Wake", "Tai", "Mata"],
  [
    "O",
    "Ko",
    "Soto",
    "Uchi",
    "Nami",
    "Gyaku",
    "Juji",
    "Guruma",
    "Uki",
    "Garami",
    "Gatame",
    "Kuzure",
    "Tsuri",
    "Komi",
    "Otoshi",
    "Sukashi",
  ],
  ["Ki", "Kiai", "Do", "Budo", "Judo", "Jujutsu", "Bushido", "Kime"],
  ["Kyu", "Dan", "Yudansha", "Mudansha", "Yudanshakai", "Batsugun"],
  [
    "Gachi / Kachi",
    "Make",
    "Fusen Gachi",
    "Kiken Gachi",
    "Kohaku Shiai",
    "Tentori Shiai",
  ],
  [
    "Gokyo No Waza",
    "Shinmesho No Waza",
    "Nage No Kata",
    "Katame No Kata",
    "Kumi Kata",
  ],
];

const people = [
  "Jigoro Kano",
  "Keiko Fukuda",
  "Kyuzo Mifune",
  "Shiro Saigo",
  "Tsunejiro Tomita",
  "Sakujiro Yokoyama",
  "Yoshitsugu Yamishita",
];
const years = ["1882", "1964", "1984", "1992", "2012"];
const institutions = ["The Kodokan", "USA Judo", "Yudanshakai", "Dojo"];
const historyRanges = [
  "About 600 to 1,000 years",
  "About 50 to 100 years",
  "About 100 to 200 years",
  "About 200 to 400 years",
  "About 1,200 to 1,500 years",
  "About 1,500 to 2,000 years",
];

export function getMultiSelectAnswers(question) {
  return getMultiSelectDefinition(question)?.answers ?? [];
}

export function gradeMultiSelect(question, selected = []) {
  const correct = getMultiSelectAnswers(question);
  const definition = getMultiSelectDefinition(question);
  const matches =
    Boolean(definition) &&
    selected.length === definition.count &&
    new Set(selected).size === definition.count &&
    selected.every((name) => correct.includes(name));
  const count =
    ["zero", "one", "two", "three", "four", "five"][definition?.count] ??
    String(definition?.count);
  const unit = definition?.unit ?? "answers";
  const requirement = definition?.any
    ? `${count} valid ${unit}`
    : `all ${count} ${unit}`;
  const correction = definition?.any
    ? `exactly ${count} valid ${unit}`
    : `all ${count} correct ${unit}`;
  return matches
    ? { rating: "correct", message: `Correct - you selected ${requirement}.` }
    : {
        rating: "review",
        message: `Incorrect - select ${correction}, with no extras.`,
      };
}

function generalCandidates(question) {
  if (people.includes(question.answer)) return people;
  if (years.includes(question.answer)) return years;
  if (institutions.includes(question.answer)) return institutions;
  if (question.answer === "Jujutsu")
    return ["Jujutsu", "Judo", "Budo", "Bushido", "Kata"];
  if (question.answer === historyRanges[0]) return historyRanges;
  if (
    ["Annmarie Burns (1984)", "Kayla Harrison (2012)"].includes(question.answer)
  ) {
    return ["Annmarie Burns", "Kayla Harrison"].flatMap((name) =>
      years.map((year) => `${name} (${year})`),
    );
  }
  return [];
}

export function getChoiceCandidates(question) {
  if (!question.hasAnswer) return [];
  const multiple = getMultiSelectAnswers(question);
  if (multiple.length)
    return [
      ...new Set([
        ...multiple,
        ...getMultiSelectDefinition(question).distractors,
      ]),
    ];
  if (question.category === "general") return generalCandidates(question);
  return (
    vocabularyGroups.find((group) => group.includes(question.answer)) ?? []
  );
}

function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function equivalentChoice(question, candidate) {
  if (checkPracticeAnswer(question, candidate).rating === "correct")
    return true;
  return (
    question.category === "vocabulary" &&
    checkPracticeAnswer({ ...question, answer: candidate }, question.answer)
      .rating === "correct"
  );
}

export function createQuestionChoices(question, random = Math.random) {
  const multiple = getMultiSelectAnswers(question);
  if (multiple.length) {
    const others = getChoiceCandidates(question).filter(
      (candidate) => !multiple.includes(candidate),
    );
    return shuffled(
      [...multiple, ...shuffled(others, random).slice(0, 3)],
      random,
    );
  }
  const candidates = [...new Set(getChoiceCandidates(question))].filter(
    (candidate) => !equivalentChoice(question, candidate),
  );
  if (candidates.length < 3) return [];
  const distractors = shuffled(candidates, random).slice(0, 3);
  return shuffled([question.answer, ...distractors], random);
}

export function createChoiceSets(questions, random = Math.random) {
  return Object.fromEntries(
    questions.flatMap((question) => {
      const choices = createQuestionChoices(question, random);
      return choices.length ? [[question.id, choices]] : [];
    }),
  );
}

export function validQuestionChoices(question, choices) {
  const multiple = getMultiSelectAnswers(question);
  if (multiple.length) {
    if (
      !Array.isArray(choices) ||
      choices.length !== multiple.length + 3 ||
      new Set(choices).size !== choices.length
    )
      return false;
    const candidates = new Set(getChoiceCandidates(question));
    return (
      multiple.every((name) => choices.includes(name)) &&
      choices.every((name) => candidates.has(name))
    );
  }
  if (
    !Array.isArray(choices) ||
    choices.length !== 4 ||
    new Set(choices).size !== 4 ||
    !choices.includes(question.answer)
  )
    return false;
  const allowed = new Set(getChoiceCandidates(question));
  return (
    choices.every(
      (choice) => typeof choice === "string" && allowed.has(choice),
    ) &&
    choices.filter((choice) => equivalentChoice(question, choice)).length === 1
  );
}
