import { normalizeVideoSearch } from "./search";

/** Editorial search vocabulary, not an identity merger or a diagnosis mapping.
 * Only an exact normalized catalog name can receive an athlete's aliases.
 * Each published event keeps its own slug, dates and sources.
 */
export const ATHLETE_SEARCH_ALIASES = [
  { name: "Kobe Bryant", aliases: ["Kobe", "柯比", "科比", "柯比布萊恩"] },
  { name: "Kevin Durant", aliases: ["杜蘭特", "凱文杜蘭特"] },
  { name: "Klay Thompson", aliases: ["湯普森", "克雷湯普森"] },
  { name: "Kyrie Irving", aliases: ["厄文", "歐文", "凱里厄文"] },
  { name: "Jayson Tatum", aliases: ["塔圖姆", "泰托姆"] },
  { name: "Tyrese Haliburton", aliases: ["哈利伯頓", "哈里伯頓"] },
  { name: "LaMelo Ball", aliases: ["拉梅洛鮑爾", "拉梅洛"] },
  { name: "Anfernee Simons", aliases: ["安芬尼西蒙斯"] },
  { name: "Derrick Rose", aliases: ["羅斯", "德瑞克羅斯"] },
  { name: "DeMarcus Cousins", aliases: ["考辛斯"] },
  { name: "Kristaps Porzingis", aliases: ["波辛吉斯", "波爾辛吉斯"] },
  { name: "Gordon Hayward", aliases: ["海沃德"] },
  { name: "Jamal Murray", aliases: ["賈邁爾莫瑞", "賈邁爾穆雷"] },
  { name: "Kawhi Leonard", aliases: ["雷納德", "科懷雷納德"] },
  { name: "Paul George", aliases: ["保羅喬治"] },
  { name: "Zach LaVine", aliases: ["拉文", "查克拉文"] },
  { name: "Giannis Antetokounmpo", aliases: ["安戴托昆波", "字母哥"] },
  { name: "Joel Embiid", aliases: ["恩比德", "安比德"] },
  { name: "Victor Oladipo", aliases: ["歐拉迪波"] },
  { name: "Markelle Fultz", aliases: ["富爾茲"] },
  {
    name: "大谷翔平 Shohei Ohtani",
    aliases: ["Shohei Ohtani", "大谷翔平", "大谷"],
  },
  { name: "王建民 Chien-Ming Wang", aliases: ["Chien-Ming Wang", "王建民"] },
  { name: "羽生結弦 Yuzuru Hanyu", aliases: ["Yuzuru Hanyu", "羽生結弦"] },
  { name: "劉翔 Liu Xiang", aliases: ["Liu Xiang", "劉翔"] },
  { name: "安洗瑩 An Se-young", aliases: ["An Se-young", "安洗瑩"] },
  { name: "Rafael Nadal", aliases: ["Nadal", "納達爾"] },
  { name: "Novak Djokovic", aliases: ["Djokovic", "喬科維奇", "德約科維奇"] },
  { name: "Serena Williams", aliases: ["小威廉絲", "小威"] },
  { name: "Kei Nishikori", aliases: ["錦織圭"] },
  { name: "Tiger Woods", aliases: ["老虎伍茲", "伍茲"] },
  { name: "David Beckham", aliases: ["貝克漢", "大衛貝克漢"] },
  { name: "Cristiano Ronaldo", aliases: ["羅納度", "C羅", "C朗"] },
  { name: "Neymar", aliases: ["內馬爾", "尼馬"] },
  { name: "Usain Bolt", aliases: ["波爾特", "博爾特"] },
  { name: "Aaron Judge", aliases: ["賈吉", "亞倫賈吉"] },
  { name: "Bryce Harper", aliases: ["哈波", "布萊斯哈波"] },
  { name: "Mookie Betts", aliases: ["貝茲", "穆奇貝茲"] },
  { name: "Ronald Acuña Jr.", aliases: ["阿庫尼亞", "羅納德阿庫尼亞"] },
  { name: "Manny Pacquiao", aliases: ["帕奎奧"] },
  { name: "Drew Brees", aliases: ["布里斯", "德魯布里斯"] },
  { name: "JuJu Watkins", aliases: ["Watkins", "沃特金斯"] },
] as const;

const athleteAliasesByName = new Map(
  ATHLETE_SEARCH_ALIASES.map((entry) => [
    normalizeVideoSearch(entry.name),
    entry.aliases.join(" "),
  ]),
);

export function athleteSearchAliases(name: string): string {
  return athleteAliasesByName.get(normalizeVideoSearch(name)) ?? "";
}

// These groups describe the same anatomical term. They deliberately do not
// equate a symptom with a diagnosis, or a ligament with a different ligament.
export const INJURY_SEARCH_SYNONYMS = [
  ["acl", "anterior cruciate ligament", "前十字韌帶"],
  ["pcl", "posterior cruciate ligament", "後十字韌帶"],
  ["mcl", "medial collateral ligament", "內側副韌帶"],
  ["lcl", "lateral collateral ligament", "外側副韌帶"],
  ["achilles", "achilles tendon", "阿基里斯腱", "跟腱"],
  ["meniscus", "半月板"],
  ["hamstring", "hamstrings", "腿後肌", "腿後肌群"],
  ["concussion", "腦震盪"],
] as const;

export function injurySearchAliases(attributedInjury: string): string {
  const text = normalizeVideoSearch(attributedInjury);
  return INJURY_SEARCH_SYNONYMS.filter((group) =>
    group.some((term) =>
      /^[a-z ]+$/u.test(term)
        ? new RegExp(`(?:^|[^a-z0-9])${term}(?:$|[^a-z0-9])`, "u").test(text)
        : text.includes(term),
    ),
  )
    .flat()
    .join(" ");
}

function oneEditApart(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const different = [...a].flatMap((char, i) => (char === b[i] ? [] : [i]));
    return (
      different.length === 1 ||
      (different.length === 2 &&
        different[1] === different[0]! + 1 &&
        a[different[0]!] === b[different[1]!] &&
        a[different[1]!] === b[different[0]!])
    );
  }
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter.slice(i) === longer.slice(i + 1);
}

/** Suggestions require an explicit click and an admitted matching card.
 * Never fuzzy-match medical terms or silently rewrite a user's query.
 */
export function suggestAthleteQueries(
  query: string,
  admittedTexts: readonly string[],
): string[] {
  const normalized = normalizeVideoSearch(query);
  if (!/^[a-z ]{4,40}$/u.test(normalized)) return [];
  return ATHLETE_SEARCH_ALIASES.filter(
    (entry) =>
      [entry.name, ...entry.aliases].some((value) =>
        oneEditApart(normalized, normalizeVideoSearch(value)),
      ) &&
      admittedTexts.some((text) =>
        text.includes(normalizeVideoSearch(entry.name)),
      ),
  )
    .slice(0, 3)
    .map((entry) => entry.name);
}
