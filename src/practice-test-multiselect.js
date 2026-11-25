const medalistsId = "sankyu:general:14:1:1";
const medalists = [
  "Kayla Harrison",
  "Travis Stevens",
  "Ronda Rousey",
  "Marti Malloy",
];

const definitions = {
  "rokyu:general:8:0:5": {
    separator: "; ",
    distractors: [
      "Ukemi - Breakfall",
      "Kumi Kata - Gripping",
      "Tai Sabaki - Body movement",
    ],
  },
  "rokyu:general:8:0:7": {
    separator: "\n",
    distractors: [
      "Ukemi Waza / Falling",
      "Kumi Kata / Gripping",
      "Nage No Kata / Forms of throwing",
    ],
  },
  "gokyu:general:10:0:0": {
    separator: " and ",
    distractors: [
      "Shime Waza (choking)",
      "Kansetsu Waza (arm-locking)",
      "Osaekomi Waza (holding)",
    ],
  },
  "gokyu:general:10:0:1": {
    separator: " and ",
    distractors: [
      "Te waza (hand techniques)",
      "Koshi waza (hip techniques)",
      "Ashi waza (foot techniques)",
    ],
  },
  "gokyu:general:10:0:3": {
    separator: ", ",
    distractors: [
      "Tachi Waza (Standing Techniques)",
      "Sutemi Waza (Sacrifice Techniques)",
      "Atemi Waza (Striking Techniques)",
    ],
  },
  "gokyu:general:10:0:4": {
    separator: " and ",
    distractors: ["Daito Ryu", "Hontai Yoshin Ryu", "Shindo Yoshin Ryu"],
  },
  "yonkyu:general:12:1:1": {
    separator: /[1-4]\)/,
    unit: "names",
    distractors: [
      "Jigoro Kano",
      "Keiko Fukuda",
      "Kyuzo Mifune",
      "Annmarie Burns",
      "Kayla Harrison",
    ],
  },
  "yonkyu:general:12:1:2": {
    separator: "; ",
    distractors: [
      "Kuzushi (Off-Balance)",
      "Tsukuri (Entrance)",
      "Kake (Execution)",
    ],
  },
  [medalistsId]: {
    answers: medalists,
    count: 3,
    unit: "names",
    any: true,
    distractors: ["Jigoro Kano", "Keiko Fukuda", "Kyuzo Mifune", "Shiro Saigo"],
  },
  "sankyu:general:14:1:3": {
    separator: ", ",
    distractors: [
      "Shime Waza (Choking Techniques)",
      "Kansetsu Waza (Arm-Locking Techniques)",
      "Osaekomi Waza (Holding Techniques)",
    ],
  },
  "sankyu:general:14:1:5": {
    separator: "\n",
    numbered: true,
    distractors: [
      "Shomen - bow to the front",
      "Seiza - sitting on knees",
      "Anza - sitting cross legged",
    ],
  },
  "nikyu:general:16:0:1": {
    separator: ". ",
    distractors: [
      "Te Waza: Kesa Gatame, Kata Gatame, Kami Shiho Gatame",
      "Shime Waza: Kata Juji Jime, Hadaka Jime, Okuri Eri Jime",
      "Kansetsu Waza: Ude Garami, Juji Gatame, Ude Gatame",
    ],
  },
  "nikyu:general:16:0:2": {
    separator: ", ",
    distractors: [
      "Te Waza (Hand Techniques)",
      "Koshi Waza (Hip Techniques)",
      "Ashi Waza (Foot Techniques)",
    ],
  },
  "nikyu:general:16:0:4": {
    answers: ["Dangerous techniques", "Techniques that only use muscle"],
    distractors: [
      "All sacrifice throws",
      "All foot sweeps",
      "All hold-down techniques",
    ],
  },
  "ikkyu:general:18:1:2": {
    separator: ". ",
    distractors: [
      "Te Waza: Uke Otoshi, Seoi Nage, Kata Guruma",
      "Koshi Waza: Uke Goshi, Harai Goshi, Tsurikomi Goshi",
      "Ashi Waza: Okuri Ashi Harai, Sasae Tsurikomi Ashi, Uchi Mata",
    ],
  },
};

export function getMultiSelectDefinition(question) {
  const definition = definitions[question.id];
  if (!definition) return null;
  let answers =
    definition.answers ??
    question.answer
      .split(definition.separator)
      .map((part) => part.trim())
      .filter(Boolean);
  if (definition.numbered)
    answers = answers.map((part) => part.replace(/^[1-4]\.\s*/, ""));
  return {
    ...definition,
    answers,
    count: definition.count ?? answers.length,
    unit: definition.unit ?? "answers",
  };
}

export function withSupplementalAnswer(question) {
  if (question.id !== medalistsId) return question;
  return {
    ...question,
    answer: `Any three of these verified examples: ${medalists.join("; ")}. This is not an exhaustive list of American Olympic judo medalists.`,
    hasAnswer: true,
    supplemental: true,
    sourceNote:
      "The guide leaves this answer blank. These examples are verified against official Team USA and Olympics athlete profiles; any three valid names in the displayed list are accepted.",
    references: [
      {
        label: "Team USA - Kayla Harrison",
        url: "https://www.teamusa.com/profiles/kayla-harrison",
      },
      {
        label: "Team USA - Travis Stevens",
        url: "https://www.teamusa.com/profiles/travis-stevens",
      },
      {
        label: "Olympics - Ronda Rousey",
        url: "https://www.olympics.com/en/athletes/ronda-rousey",
      },
      {
        label: "Olympics - Marti Malloy",
        url: "https://www.olympics.com/en/athletes/marti-malloy",
      },
    ],
  };
}
