const AUDIT_DATE = "2026-08-14";

const SEARCH_LOCATIONS = [
  "球隊／聯盟官方新聞室與比賽紀錄",
  "具名主流媒體原始頁",
] as const;

const STOPPING_BOUNDARY =
  "依 Decision 17 的四類邊界開啟候選原始頁；記錄符合項目或明確 not-found 後停止，未以搜尋摘要作為證據。";

function auditQuery(
  athlete: string,
  injury: string,
  kind: "treatment" | "surgery" | "injection" | "actual-return",
) {
  const terms = {
    treatment: "treatment rehab boot practice",
    surgery: "surgery operation procedure",
    injection: "injection shot",
    "actual-return": "return played game",
  } as const;
  return [
    {
      query: `"${athlete}" "${injury}" ${terms[kind]}`,
      locationsChecked: SEARCH_LOCATIONS,
      performedAt: AUDIT_DATE,
      stoppingBoundary: STOPPING_BOUNDARY,
    },
  ];
}

function emptyCategory(
  athlete: string,
  injury: string,
  kind: "treatment" | "surgery" | "injection" | "actual-return",
  reason = "在本次有限查核邊界內未找到符合 nba-v10、可逐條引用且不需推論的原始頁紀錄。",
) {
  return {
    queryBoundaries: auditQuery(athlete, injury, kind),
    facts: [],
    notFoundReason: reason,
  };
}

function categoryWithFacts(
  athlete: string,
  injury: string,
  kind: "treatment" | "surgery" | "injection" | "actual-return",
  facts: readonly Record<string, unknown>[],
) {
  return {
    queryBoundaries: auditQuery(athlete, injury, kind),
    facts,
    notFoundReason: null,
  };
}

export const decision17FollowUpBatch2 = [
  {
    caseId: "CASE-NBAANKLE-2023-004",
    caseSlug: "anfernee-simons-ankle-sprain-2023",
    athlete: "Anfernee Simons",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2023-004-diagnosis-01",
    categories: {
      treatment: emptyCategory("Anfernee Simons", "ankle sprain", "treatment"),
      surgery: emptyCategory("Anfernee Simons", "ankle sprain", "surgery"),
      injection: emptyCategory("Anfernee Simons", "ankle sprain", "injection"),
      "actual-return": emptyCategory(
        "Anfernee Simons",
        "ankle sprain",
        "actual-return",
        "找到的回場候選只有主流媒體報導；依本次較嚴規則，actual-return 只接受球隊／聯盟官方來源，因此留空。",
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2023-001",
    caseSlug: "anthony-edwards-ankle-sprain-2023",
    athlete: "Anthony Edwards",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2023-001-diagnosis-01",
    categories: {
      treatment: categoryWithFacts(
        "Anthony Edwards",
        "ankle sprain",
        "treatment",
        [
          {
            evidenceId:
              "evidence-anthony-edwards-ankle-sprain-2023-treatment-01",
            itemId: "follow-up-anthony-edwards-ankle-sprain-2023-treatment-01",
            kind: "treatment",
            attributedStatement:
              "NBC Sports 的 Kurt Helin 報導，Anthony Edwards 傷後當時仍穿著保護靴。",
            factDate: "2023-03-18",
            sourceTier: "mainstream-media-report",
            tierBasis:
              "NBC Sports 為具名主流媒體，原始頁保留記者 Kurt Helin 的署名；此分類不代表醫療正確性已獲核准。",
            source: {
              title:
                "Timberwolves’ Anthony Edwards out indefinitely with ankle injury",
              publisher: "NBC Sports",
              account: "Kurt Helin",
              canonicalUrl:
                "https://www.nbcsports.com/nba/news/timberwolves-anthony-edwards-out-indefinitely-with-ankle-injury",
              finalUrl:
                "https://www.nbcsports.com/nba/news/timberwolves-anthony-edwards-out-indefinitely-with-ankle-injury",
              publishedAt: "2023-03-18",
              accessedAt: AUDIT_DATE,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      ),
      surgery: emptyCategory("Anthony Edwards", "ankle sprain", "surgery"),
      injection: emptyCategory("Anthony Edwards", "ankle sprain", "injection"),
      "actual-return": emptyCategory(
        "Anthony Edwards",
        "ankle sprain",
        "actual-return",
        "找到的回場候選為主流媒體報導，未以球隊／聯盟官方來源逐條支撐，因此依嚴格 actual-return 規則留空。",
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2025-001",
    caseSlug: "anthony-edwards-ankle-sprain-2025",
    athlete: "Anthony Edwards",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2025-001-diagnosis-01",
    categories: {
      treatment: emptyCategory("Anthony Edwards", "ankle sprain", "treatment"),
      surgery: emptyCategory("Anthony Edwards", "ankle sprain", "surgery"),
      injection: emptyCategory("Anthony Edwards", "ankle sprain", "injection"),
      "actual-return": categoryWithFacts(
        "Anthony Edwards",
        "ankle sprain",
        "actual-return",
        [
          {
            evidenceId:
              "evidence-anthony-edwards-ankle-sprain-2025-actual-return-01",
            itemId:
              "follow-up-anthony-edwards-ankle-sprain-2025-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "NBA.com Staff 的聯盟賽事報導記錄，Anthony Edwards 在 2025 年 4 月 3 日傷後回到該場比賽並完成出賽。",
            factDate: "2025-04-03",
            sourceTier: "team-or-league-official",
            tierBasis:
              "NBA.com Staff 署名的聯盟自有賽事報導直接記錄當日實際參賽，並非僅因 nba.com 網域而分類。",
            source: {
              title: "Nightly Pulse: NBA News & Highlights from April 3",
              publisher: "NBA.com Staff",
              account: null,
              canonicalUrl:
                "https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3",
              finalUrl:
                "https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3",
              publishedAt: "2025-04-03",
              accessedAt: AUDIT_DATE,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2020-002",
    caseSlug: "cj-mccollum-ankle-sprain-2020",
    athlete: "CJ McCollum",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2020-002-diagnosis-01",
    categories: {
      treatment: emptyCategory("CJ McCollum", "ankle sprain", "treatment"),
      surgery: emptyCategory("CJ McCollum", "ankle sprain", "surgery"),
      injection: emptyCategory("CJ McCollum", "ankle sprain", "injection"),
      "actual-return": emptyCategory(
        "CJ McCollum",
        "ankle sprain",
        "actual-return",
        "找到的回場候選為 Associated Press 報導，沒有符合本次 official-only 規則的球隊／聯盟官方來源，因此留空。",
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2020-001",
    caseSlug: "ja-morant-ankle-sprain-2020",
    athlete: "Ja Morant",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2020-001-diagnosis-01",
    categories: {
      treatment: categoryWithFacts("Ja Morant", "ankle sprain", "treatment", [
        {
          evidenceId: "evidence-ja-morant-ankle-sprain-2020-treatment-01",
          itemId: "follow-up-ja-morant-ankle-sprain-2020-treatment-01",
          kind: "treatment",
          attributedStatement:
            "Associated Press 的報導記載，Ja Morant 傷後左腳穿著保護靴。",
          factDate: "2020-12-28",
          sourceTier: "mainstream-media-report",
          tierBasis:
            "原始頁雖由 NBA.com 刊載，但內文明列 Associated Press 電稿；依內容來源分類為主流媒體，而非僅按網域升級。",
          source: {
            title: "Ja Morant out 3-5 weeks with Grade 2 ankle sprain",
            publisher: "Associated Press（由 NBA.com 刊載）",
            account: null,
            canonicalUrl:
              "https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain",
            finalUrl:
              "https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain",
            publishedAt: "2020-12-29",
            accessedAt: AUDIT_DATE,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      surgery: emptyCategory("Ja Morant", "ankle sprain", "surgery"),
      injection: emptyCategory("Ja Morant", "ankle sprain", "injection"),
      "actual-return": categoryWithFacts(
        "Ja Morant",
        "ankle sprain",
        "actual-return",
        [
          {
            evidenceId: "evidence-ja-morant-ankle-sprain-2020-actual-return-01",
            itemId: "follow-up-ja-morant-ankle-sprain-2020-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "NBA.com News Services 的聯盟報導記錄，Ja Morant 在 2021 年 1 月 16 日回到灰熊陣容並完成出賽。",
            factDate: "2021-01-16",
            sourceTier: "team-or-league-official",
            tierBasis:
              "NBA.com News Services 署名的聯盟自有報導直接記錄實際回到陣容與出賽日期，頁面沒有第三方電稿署名。",
            source: {
              title:
                "Ja Morant returns after missing 8 games with ankle injury",
              publisher: "NBA.com News Services",
              account: null,
              canonicalUrl:
                "https://www.nba.com/news/ja-morant-returns-from-8-game-absence-vs-76ers",
              finalUrl:
                "https://www.nba.com/news/ja-morant-returns-from-8-game-absence-vs-76ers",
              publishedAt: "2021-01-17",
              accessedAt: AUDIT_DATE,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2024-001",
    caseSlug: "kevin-durant-ankle-sprain-2024",
    athlete: "Kevin Durant",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2024-001-diagnosis-01",
    categories: {
      treatment: emptyCategory("Kevin Durant", "ankle sprain", "treatment"),
      surgery: emptyCategory("Kevin Durant", "ankle sprain", "surgery"),
      injection: emptyCategory("Kevin Durant", "ankle sprain", "injection"),
      "actual-return": categoryWithFacts(
        "Kevin Durant",
        "ankle sprain",
        "actual-return",
        [
          {
            evidenceId:
              "evidence-kevin-durant-ankle-sprain-2024-actual-return-01",
            itemId: "follow-up-kevin-durant-ankle-sprain-2024-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "NBA.com Staff 的聯盟賽事報導記錄，Kevin Durant 在 2024 年 12 月 13 日傷後回到太陽隊陣容並完成出賽。",
            factDate: "2024-12-13",
            sourceTier: "team-or-league-official",
            tierBasis:
              "NBA.com Staff 署名的聯盟自有賽事報導直接記錄該日實際回歸與參賽。",
            source: {
              title: "Nightly Pulse: NBA news & highlights from Dec. 13",
              publisher: "NBA.com Staff",
              account: null,
              canonicalUrl:
                "https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-dec-13",
              finalUrl:
                "https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-dec-13",
              publishedAt: "2024-12-14",
              accessedAt: AUDIT_DATE,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2021-002",
    caseSlug: "kyrie-irving-ankle-sprain-2021",
    athlete: "Kyrie Irving",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2021-002-diagnosis-01",
    categories: {
      treatment: categoryWithFacts(
        "Kyrie Irving",
        "ankle sprain",
        "treatment",
        [
          {
            evidenceId: "evidence-kyrie-irving-ankle-sprain-2021-treatment-01",
            itemId: "follow-up-kyrie-irving-ankle-sprain-2021-treatment-01",
            kind: "treatment",
            attributedStatement:
              "NBA.com Staff 的聯盟報導記載，Kyrie Irving 當時持續進行右腳踝扭傷的復健。",
            factDate: "2021-06-18",
            sourceTier: "team-or-league-official",
            tierBasis:
              "NBA.com Staff 署名的聯盟自有報導直接描述當時的復健狀態，未僅憑 nba.com 網域分類。",
            source: {
              title: "Nets rule Kyrie Irving (ankle) out for Game 7",
              publisher: "NBA.com Staff",
              account: null,
              canonicalUrl:
                "https://www.nba.com/news/nets-rule-kyrie-irving-ankle-out-for-game-7",
              finalUrl:
                "https://www.nba.com/news/nets-rule-kyrie-irving-ankle-out-for-game-7",
              publishedAt: "2021-06-18",
              accessedAt: AUDIT_DATE,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      ),
      surgery: emptyCategory("Kyrie Irving", "ankle sprain", "surgery"),
      injection: emptyCategory("Kyrie Irving", "ankle sprain", "injection"),
      "actual-return": emptyCategory(
        "Kyrie Irving",
        "ankle sprain",
        "actual-return",
        "在本次有限查核邊界內未找到符合 official-only 規則且直接記錄實際參賽日期的回場來源。",
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2022-001",
    caseSlug: "lamelo-ball-ankle-sprain-2022",
    athlete: "LaMelo Ball",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2022-001-diagnosis-01",
    categories: {
      treatment: emptyCategory("LaMelo Ball", "ankle sprain", "treatment"),
      surgery: emptyCategory("LaMelo Ball", "ankle sprain", "surgery"),
      injection: emptyCategory("LaMelo Ball", "ankle sprain", "injection"),
      "actual-return": categoryWithFacts(
        "LaMelo Ball",
        "ankle sprain",
        "actual-return",
        [
          {
            evidenceId:
              "evidence-lamelo-ball-ankle-sprain-2022-actual-return-01",
            itemId: "follow-up-lamelo-ball-ankle-sprain-2022-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "NBA.com News Services 的聯盟報導記錄，LaMelo Ball 在 2022 年 12 月 14 日回到黃蜂隊先發並完成出賽。",
            factDate: "2022-12-14",
            sourceTier: "team-or-league-official",
            tierBasis:
              "NBA.com News Services 署名的聯盟自有報導直接記錄實際回到先發陣容與參賽日期。",
            source: {
              title:
                "Hornets’ LaMelo Ball (ankle) returns vs. Pistons, puts up double-double",
              publisher: "NBA.com News Services",
              account: null,
              canonicalUrl:
                "https://www.nba.com/news/hornets-lamelo-ball-ankle-injury-update",
              finalUrl:
                "https://www.nba.com/news/hornets-lamelo-ball-ankle-injury-update",
              publishedAt: "2022-12-15",
              accessedAt: AUDIT_DATE,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      ),
    },
  },
  {
    caseId: "CASE-NBAANKLE-2023-008",
    caseSlug: "lamelo-ball-ankle-sprain-2023",
    athlete: "LaMelo Ball",
    injuryLabel: "ankle sprain",
    legacySourceId: "src-nba-ankle-2023-008-diagnosis-01",
    categories: {
      treatment: emptyCategory("LaMelo Ball", "ankle sprain", "treatment"),
      surgery: emptyCategory("LaMelo Ball", "ankle sprain", "surgery"),
      injection: emptyCategory("LaMelo Ball", "ankle sprain", "injection"),
      "actual-return": emptyCategory(
        "LaMelo Ball",
        "ankle sprain",
        "actual-return",
        "找到的回場候選為 Associated Press 報導；actual-return 本次只接受球隊／聯盟官方來源，因此留空。",
      ),
    },
  },
] as const;
