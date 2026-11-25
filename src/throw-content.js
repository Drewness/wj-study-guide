import { studySections } from "./study-content.js";

export const throwGroups = [
  {
    id: "ikkyo",
    title: "Dai Ikkyo",
    subtitle: "1st group",
    page: 34,
    throws: [
      ["De-ashi-harai", "Advanced foot sweep"],
      ["Hiza-guruma", "Knee wheel"],
      ["Sasae-tsurikomi-ashi", "Propping-drawing ankle throw"],
      ["Uki-goshi", "Floating hip throw"],
      ["O-soto-gari", "Major outer reap"],
      ["O-goshi", "Major hip throw"],
      ["O-uchi-gari", "Major inner reap"],
      ["Seoi-nage", "Shoulder throw"],
    ],
  },
  {
    id: "nikyo",
    title: "Dai Nikyo",
    subtitle: "2nd group",
    page: 34,
    throws: [
      ["Ko-soto-gari", "Minor outer reap"],
      ["Ko-uchi-gari", "Minor inner reap"],
      ["Koshi-guruma", "Hip wheel"],
      ["Tsurikomi-goshi", "Lift-pull hip throw"],
      ["Okuri-ashi-harai", "Sliding foot sweep"],
      ["Tai-otoshi", "Body drop"],
      ["Harai-goshi", "Sweeping hip throw"],
      ["Uchi-mata", "Inner-thigh throw"],
    ],
  },
  {
    id: "sankyo",
    title: "Dai Sankyo",
    subtitle: "3rd group",
    page: 34,
    throws: [
      ["Ko-soto-gake", "Minor outer hook"],
      ["Tsuri-goshi", "Lifting hip throw"],
      ["Yoko-otoshi", "Side drop"],
      ["Ashi-guruma", "Leg wheel"],
      ["Hane-goshi", "Springing hip throw"],
      ["Harai-tsurikomi-ashi", "Lift-pull foot sweep"],
      ["Tomoe-nage", "Circle throw"],
      ["Kata-guruma", "Shoulder wheel"],
    ],
  },
  {
    id: "yonkyo",
    title: "Dai Yonkyo",
    subtitle: "4th group",
    page: 34,
    throws: [
      ["Sumi-gaeshi", "Corner reversal"],
      ["Tani-otoshi", "Valley drop"],
      ["Hane-makikomi", "Springing wraparound"],
      ["Sukui-nage", "Scoop throw"],
      ["Utsuri-goshi", "Shifting hip throw"],
      ["O-guruma", "Major wheel"],
      ["Soto-makikomi", "Outer wraparound"],
      ["Uki-otoshi", "Floating drop"],
    ],
  },
  {
    id: "gokyo",
    title: "Dai Gokyo",
    subtitle: "5th group",
    page: 34,
    throws: [
      ["O-soto-guruma", "Major outer wheel"],
      ["Uki-waza", "Floating technique"],
      ["Yoko-wakare", "Side separation"],
      ["Yoko-guruma", "Side wheel"],
      ["Ushiro-goshi", "Rear hip throw", 35],
      ["Ura-nage", "Rear throw", 35],
      ["Sumi-otoshi", "Corner drop", 35],
      ["Yoko-gake", "Side hook", 35],
    ],
  },
  {
    id: "habukareta",
    title: "Habukareta Waza",
    subtitle: "8 preserved throws",
    page: 36,
    throws: [
      ["Obi-otoshi", "Belt drop"],
      ["Seoi-otoshi", "Shoulder drop"],
      ["Yama-arashi", "Mountain storm"],
      ["O-soto-otoshi", "Major outer drop"],
      ["Daki-wakare", "Embracing separation"],
      ["Hikikomi-gaeshi", "Pulling-in reversal"],
      ["Tawara-gaeshi", "Rice-bag reversal"],
      ["Uchi-makikomi", "Inner wraparound"],
    ],
  },
  {
    id: "shinmeisho",
    title: "Shinmeisho no Waza",
    subtitle: "20 newly named throws",
    page: 36,
    throws: [
      ["Morote-gari", "Two-handed reap"],
      ["Kuchiki-taoshi", "Single-leg takedown"],
      ["Kibisu-gaeshi", "One-hand heel reversal"],
      ["Uchi-mata-sukashi", "Inner-thigh void throw"],
      ["Tsubame-gaeshi", "Swallow counter"],
      ["Ko-uchi-gaeshi", "Minor inner reap reversal"],
      ["O-uchi-gaeshi", "Major inner reap reversal"],
      ["O-soto-gaeshi", "Major outer reap reversal"],
      ["Harai-goshi-gaeshi", "Sweeping hip throw counter"],
      ["Uchi-mata-gaeshi", "Inner-thigh throw counter"],
      ["Hane-goshi-gaeshi", "Springing hip throw counter"],
      ["Kani-basami", "Crab (scissors) throw"],
      ["O-soto-makikomi", "Major outer wraparound"],
      ["Kawazu-gake", "One-leg entanglement"],
      ["Harai-makikomi", "Sweeping hip wraparound"],
      ["Uchi-mata-makikomi", "Inner-thigh wraparound"],
      ["Sode-tsurikomi-goshi", "Sleeve lift-pull hip throw"],
      ["Ippon-seoi-nage", "One-arm shoulder throw"],
      ["Obi-tori-gaeshi", "Belt-grab reversal"],
      ["Ko-uchi-makikomi", "Minor inner wraparound"],
    ],
  },
];

export function normalizeTechnique(value) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

const aliases = { sasetsurikomiashi: "sasaetsurikomiashi" };

export const practiceRanks = studySections
  .filter((section) =>
    ["rokyu", "gokyu", "yonkyu", "sankyu", "nikyu", "ikkyu"].includes(
      section.id,
    ),
  )
  .map((section) => ({
    id: section.id,
    title: section.title,
    detail: section.detail,
    color: section.color,
    page: section.pages[0].number,
    requirements: section.pages.flatMap((page) =>
      page.blocks
        .filter(
          (block) =>
            block.heading.startsWith("Tachi Waza") ||
            block.heading === "Nage No Kata",
        )
        .flatMap((block) =>
          block.items
            .filter(Boolean)
            .map((text) => ({
              text,
              page: page.number,
              category: block.heading,
            })),
        ),
    ),
  }));

function techniqueRanks(id) {
  return practiceRanks
    .filter((rank) =>
      rank.requirements.some((requirement) => {
        const name = normalizeTechnique(requirement.text.split(" - ")[0]);
        return (aliases[name] ?? name) === id;
      }),
    )
    .map((rank) => rank.id);
}

function restriction(id) {
  if (["kanibasami", "kawazugake"].includes(id))
    return "The handbook lists this throw as prohibited in IJF competition (direct hansoku-make). Reference study only; consult Sensei and current rules.";
  if (["morotegari", "kuchikitaoshi", "kibisugaeshi"].includes(id))
    return "The handbook's 2026 note says grabbing legs or trousers in standing is penalized with shido. Confirm current competition rules with Sensei.";
  return "";
}

export const throwingTechniques = throwGroups.flatMap((group) =>
  group.throws.map(([name, translation, page], index) => {
    const id = normalizeTechnique(name);
    return {
      id,
      name,
      translation,
      group: group.id,
      order: index + 1,
      page: page ?? group.page,
      ranks: techniqueRanks(id),
      restriction: restriction(id),
    };
  }),
);

export function filterTechniques({
  query = "",
  group = "all",
  rank = "all",
} = {}) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeTechnique);
  const exact = throwingTechniques.find(
    (technique) => technique.id === normalizeTechnique(query),
  );
  return throwingTechniques.filter((technique) => {
    const text = normalizeTechnique(
      `${technique.name} ${technique.translation}`,
    );
    const matches = exact
      ? technique.id === exact.id
      : words.every((word) => text.includes(word));
    return (
      (group === "all" || technique.group === group) &&
      (rank === "all" || technique.ranks.includes(rank)) &&
      matches
    );
  });
}
