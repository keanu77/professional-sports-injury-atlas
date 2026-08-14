/** Decision 17 source-ready follow-up seed, batch 3. No review decision lives here. */

const ACCESSED_AT = "2026-08-14";
const AUDIT_LOCATIONS = [
  "球隊／聯盟官方新聞室與比賽紀錄",
  "具名主流媒體原始頁",
] as const;
const AUDIT_STOPPING_BOUNDARY =
  "開啟候選原始頁並依 nba-v10 檢查此分類；保留可逐條支撐的事實或記為 not-found 後停止，未以搜尋摘要作為證據。";
const NOT_FOUND_REASON =
  "在本次有限查核邊界內未找到符合 nba-v10、可逐條引用且不需推論的原始頁紀錄。";
const OFFICIAL_TIER_BASIS =
  "球隊／聯盟直接控制且具名的公告、報導或比賽紀錄直接支撐本項事實；不是僅因 nba.com 網域而分類。";
const MAINSTREAM_TIER_BASIS =
  "具名主流媒體或新聞通訊社的原始編輯報導，保留作者與發布者身分；即使刊於 nba.com 也不升級為官方來源。";

type Kind = "treatment" | "surgery" | "injection" | "actual-return";

function queryBoundary(athlete: string, injury: string, kind: Kind) {
  const terms = {
    treatment: "treatment rehab training",
    surgery: "surgery procedure",
    injection: "injection shot",
    "actual-return": "return played game",
  } as const;
  return [
    {
      query: `"${athlete}" "${injury}" ${terms[kind]}`,
      locationsChecked: AUDIT_LOCATIONS,
      performedAt: ACCESSED_AT,
      stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
    },
  ];
}

function empty(
  athlete: string,
  injury: string,
  kind: Kind,
  reason = NOT_FOUND_REASON,
) {
  return {
    queryBoundaries: queryBoundary(athlete, injury, kind),
    outcome: "not-found" as const,
    notFoundReason: reason,
    facts: [],
  };
}

function ready(
  athlete: string,
  injury: string,
  kind: Kind,
  facts: readonly Record<string, unknown>[],
) {
  return {
    queryBoundaries: queryBoundary(athlete, injury, kind),
    outcome: "source-ready" as const,
    notFoundReason: null,
    facts,
  };
}

export const DECISION_17_FOLLOW_UP_BATCH_3 = [
  {
    caseSlug: "lamelo-ball-ankle-sprain-2025",
    caseId: "CASE-NBAANKLE-2025-002",
    athleteName: "LaMelo Ball",
    injurySearchTerm: "ankle sprain",
    evidenceStatus: "source-ready",
    categories: {
      treatment: empty("LaMelo Ball", "ankle sprain", "treatment"),
      surgery: empty("LaMelo Ball", "ankle sprain", "surgery"),
      injection: empty("LaMelo Ball", "ankle sprain", "injection"),
      "actual-return": ready("LaMelo Ball", "ankle sprain", "actual-return", [
        {
          evidenceId: "lamelo-ball-ankle-sprain-2025-actual-return-01",
          itemId: "lamelo-ball-ankle-sprain-2025-actual-return-01",
          kind: "actual-return",
          attributedStatement:
            "Charlotte Hornets 的 Matt Rochinski 官方賽後報導記錄，LaMelo Ball 於 2025 年 2 月 7 日完成出賽。",
          factDate: "2025-02-07",
          sourceTier: "team-or-league-official",
          tierBasis: OFFICIAL_TIER_BASIS,
          source: {
            title: "Hornets End Homestand In Dramatic Fashion",
            publisher: "Charlotte Hornets",
            account: "Matt Rochinski",
            canonicalUrl:
              "https://www.nba.com/hornets/news/hornets-end-homestand-in-dramatic-fashion",
            finalUrl:
              "https://www.nba.com/hornets/news/hornets-end-homestand-in-dramatic-fashion",
            publishedAt: "2025-02-07",
            accessedAt: ACCESSED_AT,
            medium: "game-or-participation-record",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
    },
  },
  {
    caseSlug: "lebron-james-ankle-sprain-2021",
    caseId: "CASE-NBAANKLE-2021-003",
    athleteName: "LeBron James",
    injurySearchTerm: "ankle sprain",
    evidenceStatus: "source-ready",
    categories: {
      treatment: ready("LeBron James", "ankle sprain", "treatment", [
        {
          evidenceId: "lebron-james-ankle-sprain-2021-treatment-01",
          itemId: "lebron-james-ankle-sprain-2021-treatment-01",
          kind: "treatment",
          attributedStatement:
            "NBA.com 的 Mark Medina 報導，LeBron James 描述該年夏季先暫停籃球活動，並以其他訓練逐步測試腳踝。",
          factDate: null,
          sourceTier: "team-or-league-official",
          tierBasis:
            "原始頁由 NBA.com 直接控制並由其 senior writer/analyst Mark Medina 署名，且直接引述當事人對已發生訓練的描述。",
          source: {
            title:
              "'Opportunity' for another title driving LeBron James in season No. 19",
            publisher: "NBA.com",
            account: "Mark Medina",
            canonicalUrl:
              "https://www.nba.com/news/whats-driving-lakers-lebron-james-in-his-19th-nba-season-the-opportunity-to-win-a-championship",
            finalUrl:
              "https://www.nba.com/news/whats-driving-lakers-lebron-james-in-his-19th-nba-season-the-opportunity-to-win-a-championship",
            publishedAt: "2021-10-19",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      surgery: empty("LeBron James", "ankle sprain", "surgery"),
      injection: empty("LeBron James", "ankle sprain", "injection"),
      "actual-return": ready("LeBron James", "ankle sprain", "actual-return", [
        {
          evidenceId: "lebron-james-ankle-sprain-2021-actual-return-01",
          itemId: "lebron-james-ankle-sprain-2021-actual-return-01",
          kind: "actual-return",
          attributedStatement:
            "NBA 官方比賽紀錄顯示，LeBron James 於 2021 年 4 月 30 日完成出賽。",
          factDate: "2021-04-30",
          sourceTier: "team-or-league-official",
          tierBasis: OFFICIAL_TIER_BASIS,
          source: {
            title:
              "Sacramento Kings vs Los Angeles Lakers Apr 30, 2021 Game Summary | NBA.com",
            publisher: "NBA Organization",
            account: null,
            canonicalUrl: "https://www.nba.com/game/sac-vs-lal-0022000956",
            finalUrl: "https://www.nba.com/game/sac-vs-lal-0022000956",
            publishedAt: "2021-05-01",
            accessedAt: ACCESSED_AT,
            medium: "game-or-participation-record",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
    },
  },
  {
    caseSlug: "trae-young-ankle-sprain-2021",
    caseId: "CASE-NBAANKLE-2021-001",
    athleteName: "Trae Young",
    injurySearchTerm: "ankle sprain",
    evidenceStatus: "source-ready",
    categories: {
      treatment: ready("Trae Young", "ankle sprain", "treatment", [
        {
          evidenceId: "trae-young-ankle-sprain-2021-treatment-01",
          itemId: "trae-young-ankle-sprain-2021-treatment-01",
          kind: "treatment",
          attributedStatement:
            "Associated Press 的 Aaron Bracy 報導，Trae Young 表示傷後接受多項治療，Atlanta 訓練團隊協助他回到球場。",
          factDate: null,
          sourceTier: "mainstream-media-report",
          tierBasis: MAINSTREAM_TIER_BASIS,
          source: {
            title:
              "Atlanta Hawks vs Philadelphia 76ers Apr 30, 2021 Game Summary | NBA.com",
            publisher: "Associated Press（由 NBA.com 刊載）",
            account: "Aaron Bracy",
            canonicalUrl: "https://www.nba.com/game/atl-vs-phi-0022000949",
            finalUrl: "https://www.nba.com/game/atl-vs-phi-0022000949",
            publishedAt: "2021-04-30",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      surgery: empty("Trae Young", "ankle sprain", "surgery"),
      injection: empty("Trae Young", "ankle sprain", "injection"),
      "actual-return": ready("Trae Young", "ankle sprain", "actual-return", [
        {
          evidenceId: "trae-young-ankle-sprain-2021-actual-return-01",
          itemId: "trae-young-ankle-sprain-2021-actual-return-01",
          kind: "actual-return",
          attributedStatement:
            "NBA 官方比賽紀錄顯示，Trae Young 於 2021 年 4 月 30 日完成出賽。",
          factDate: "2021-04-30",
          sourceTier: "team-or-league-official",
          tierBasis: OFFICIAL_TIER_BASIS,
          source: {
            title:
              "Atlanta Hawks vs Philadelphia 76ers Apr 30, 2021 Game Summary | NBA.com",
            publisher: "NBA Organization",
            account: null,
            canonicalUrl: "https://www.nba.com/game/atl-vs-phi-0022000949",
            finalUrl: "https://www.nba.com/game/atl-vs-phi-0022000949",
            publishedAt: "2021-04-30",
            accessedAt: ACCESSED_AT,
            medium: "game-or-participation-record",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
    },
  },
  {
    caseSlug: "damian-lillard-achilles-rupture-2025",
    caseId: "CASE-NBAACHILLES-2025-015",
    athleteName: "Damian Lillard",
    injurySearchTerm: "Achilles rupture",
    evidenceStatus: "source-ready",
    categories: {
      treatment: empty("Damian Lillard", "Achilles rupture", "treatment"),
      surgery: ready("Damian Lillard", "Achilles rupture", "surgery", [
        {
          evidenceId: "damian-lillard-achilles-rupture-2025-surgery-01",
          itemId: "damian-lillard-achilles-rupture-2025-surgery-01",
          kind: "surgery",
          attributedStatement:
            "Milwaukee Bucks 官方醫療更新記載，Damian Lillard 於 2025 年 5 月 2 日接受左阿基里斯腱修復手術。",
          factDate: "2025-05-02",
          sourceTier: "team-or-league-official",
          tierBasis: OFFICIAL_TIER_BASIS,
          source: {
            title: "Medical Update on Damian Lillard",
            publisher: "Milwaukee Bucks",
            account: null,
            canonicalUrl:
              "https://www.nba.com/bucks/news/medical-update-on-damian-lillard-4",
            finalUrl:
              "https://www.nba.com/bucks/news/medical-update-on-damian-lillard-4",
            publishedAt: "2025-05-02",
            accessedAt: ACCESSED_AT,
            medium: "press-release",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      injection: empty("Damian Lillard", "Achilles rupture", "injection"),
      "actual-return": empty(
        "Damian Lillard",
        "Achilles rupture",
        "actual-return",
        "有限查核只找到非正式競賽活動候選，未將其推定為 NBA 正式回場；因此留空。",
      ),
    },
  },
  {
    caseSlug: "dejounte-murray-achilles-rupture-2025",
    caseId: "CASE-NBAACHILLES-2025-014",
    athleteName: "Dejounte Murray",
    injurySearchTerm: "Achilles rupture",
    evidenceStatus: "source-ready",
    categories: {
      treatment: ready("Dejounte Murray", "Achilles rupture", "treatment", [
        {
          evidenceId: "dejounte-murray-achilles-rupture-2025-treatment-01",
          itemId: "dejounte-murray-achilles-rupture-2025-treatment-01",
          kind: "treatment",
          attributedStatement:
            "Associated Press 的 David Brandt 報導記載，Dejounte Murray 在傷後進行復健。",
          factDate: null,
          sourceTier: "mainstream-media-report",
          tierBasis: MAINSTREAM_TIER_BASIS,
          source: {
            title:
              "Pelicans' Dejounte Murray returns to the floor after rehabbing Achilles injury",
            publisher: "Associated Press（由 NBA.com 刊載）",
            account: "David Brandt",
            canonicalUrl:
              "https://www.nba.com/news/pelicans-dejounte-murray-primed-for-return-to-floor-after-rehabbing-achilles-injury",
            finalUrl:
              "https://www.nba.com/news/pelicans-dejounte-murray-primed-for-return-to-floor-after-rehabbing-achilles-injury",
            publishedAt: "2026-02-24",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      surgery: empty("Dejounte Murray", "Achilles rupture", "surgery"),
      injection: empty("Dejounte Murray", "Achilles rupture", "injection"),
      "actual-return": ready(
        "Dejounte Murray",
        "Achilles rupture",
        "actual-return",
        [
          {
            evidenceId:
              "dejounte-murray-achilles-rupture-2025-actual-return-01",
            itemId: "dejounte-murray-achilles-rupture-2025-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "NBA 官方比賽紀錄顯示，Dejounte Murray 於 2026 年 2 月 24 日完成出賽。",
            factDate: "2026-02-24",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Golden State Warriors vs New Orleans Pelicans Feb 24, 2026 Game Summary | NBA.com",
              publisher: "NBA Organization",
              account: null,
              canonicalUrl: "https://www.nba.com/game/gsw-vs-nop-0022500838",
              finalUrl: "https://www.nba.com/game/gsw-vs-nop-0022500838",
              publishedAt: "2026-02-24",
              accessedAt: ACCESSED_AT,
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
    caseSlug: "jayson-tatum-achilles-rupture-2025",
    caseId: "CASE-NBAACHILLES-2025-016",
    athleteName: "Jayson Tatum",
    injurySearchTerm: "Achilles rupture",
    evidenceStatus: "source-ready",
    categories: {
      treatment: ready("Jayson Tatum", "Achilles rupture", "treatment", [
        {
          evidenceId: "jayson-tatum-achilles-rupture-2025-treatment-01",
          itemId: "jayson-tatum-achilles-rupture-2025-treatment-01",
          kind: "treatment",
          attributedStatement:
            "NBA.com News Services 報導記載，Jayson Tatum 當時已恢復輕度籃球訓練。",
          factDate: null,
          sourceTier: "team-or-league-official",
          tierBasis: OFFICIAL_TIER_BASIS,
          source: {
            title:
              "Jayson Tatum back on the court 4 months after Achilles rupture",
            publisher: "NBA.com News Services",
            account: null,
            canonicalUrl:
              "https://www.nba.com/news/jayson-tatum-back-on-the-court-4-months-after-achilles-rupture",
            finalUrl:
              "https://www.nba.com/news/jayson-tatum-back-on-the-court-4-months-after-achilles-rupture",
            publishedAt: "2025-09-28",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      surgery: ready("Jayson Tatum", "Achilles rupture", "surgery", [
        {
          evidenceId: "jayson-tatum-achilles-rupture-2025-surgery-01",
          itemId: "jayson-tatum-achilles-rupture-2025-surgery-01",
          kind: "surgery",
          attributedStatement:
            "Boston Celtics 官方更新記載，Jayson Tatum 於 2025 年 5 月 13 日接受右阿基里斯腱修復手術。",
          factDate: "2025-05-13",
          sourceTier: "team-or-league-official",
          tierBasis: OFFICIAL_TIER_BASIS,
          source: {
            title: "Jayson Tatum Injury Update",
            publisher: "Boston Celtics",
            account: null,
            canonicalUrl:
              "https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update",
            finalUrl:
              "https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update",
            publishedAt: "2025-05-13",
            accessedAt: ACCESSED_AT,
            medium: "press-release",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      injection: empty("Jayson Tatum", "Achilles rupture", "injection"),
      "actual-return": ready(
        "Jayson Tatum",
        "Achilles rupture",
        "actual-return",
        [
          {
            evidenceId: "jayson-tatum-achilles-rupture-2025-actual-return-01",
            itemId: "jayson-tatum-achilles-rupture-2025-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "NBA 官方比賽紀錄顯示，Jayson Tatum 於 2026 年 3 月 6 日完成出賽。",
            factDate: "2026-03-06",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Dallas Mavericks vs Boston Celtics Mar 6, 2026 Game Summary | NBA.com",
              publisher: "NBA Organization",
              account: null,
              canonicalUrl: "https://www.nba.com/game/dal-vs-bos-0022500908",
              finalUrl: "https://www.nba.com/game/dal-vs-bos-0022500908",
              publishedAt: "2026-03-06",
              accessedAt: ACCESSED_AT,
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
    caseSlug: "kevin-durant-achilles-rupture-2019",
    caseId: "CASE-NBAACHILLES-2019-005",
    athleteName: "Kevin Durant",
    injurySearchTerm: "Achilles rupture",
    evidenceStatus: "source-ready",
    categories: {
      treatment: ready("Kevin Durant", "Achilles rupture", "treatment", [
        {
          evidenceId: "kevin-durant-achilles-rupture-2019-treatment-01",
          itemId: "kevin-durant-achilles-rupture-2019-treatment-01",
          kind: "treatment",
          attributedStatement:
            "NBA.com 的 Brian Martin 報導記載，Kevin Durant 因該傷勢缺席 2019-20 賽季並進行復健。",
          factDate: null,
          sourceTier: "team-or-league-official",
          tierBasis: OFFICIAL_TIER_BASIS,
          source: {
            title: "NBA Game Watch Guide: Christmas Week 2020",
            publisher: "NBA.com",
            account: "Brian Martin",
            canonicalUrl:
              "https://www.nba.com/news/nba-game-watch-guide-christmas-week-2020",
            finalUrl:
              "https://www.nba.com/news/nba-game-watch-guide-christmas-week-2020",
            publishedAt: "2020-12-03",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      surgery: ready("Kevin Durant", "Achilles rupture", "surgery", [
        {
          evidenceId: "kevin-durant-achilles-rupture-2019-surgery-01",
          itemId: "kevin-durant-achilles-rupture-2019-surgery-01",
          kind: "surgery",
          attributedStatement:
            "NBA.com 的聯盟報導記載，Kevin Durant 於 2019 年 6 月 12 日接受右阿基里斯腱手術。",
          factDate: "2019-06-12",
          sourceTier: "team-or-league-official",
          tierBasis:
            "NBA.com 直接控制的聯盟報導同時記載球員公開說明與 Warriors 官方聲明，直接支撐已發生手術；不是按網域推定。",
          source: {
            title: "Kevin Durant confirms he suffered ruptured right Achilles",
            publisher: "NBA.com（NBA Twitter and media reports）",
            account: null,
            canonicalUrl:
              "https://www.nba.com/news/warriors-durant-achilles-injury-update",
            finalUrl:
              "https://www.nba.com/news/warriors-durant-achilles-injury-update",
            publishedAt: "2019-06-13",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      injection: empty("Kevin Durant", "Achilles rupture", "injection"),
      "actual-return": ready(
        "Kevin Durant",
        "Achilles rupture",
        "actual-return",
        [
          {
            evidenceId: "kevin-durant-achilles-rupture-2019-actual-return-01",
            itemId: "kevin-durant-achilles-rupture-2019-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "NBA 官方比賽紀錄顯示，Kevin Durant 於 2020 年 12 月 22 日完成出賽。",
            factDate: "2020-12-22",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Golden State Warriors vs Brooklyn Nets Dec 22, 2020 Game Summary | NBA.com",
              publisher: "NBA Organization",
              account: null,
              canonicalUrl: "https://www.nba.com/game/gsw-vs-bkn-0022000001",
              finalUrl: "https://www.nba.com/game/gsw-vs-bkn-0022000001",
              publishedAt: "2020-12-22",
              accessedAt: ACCESSED_AT,
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
    caseSlug: "tyrese-haliburton-achilles-rupture-2025",
    caseId: "CASE-NBAACHILLES-2025-017",
    athleteName: "Tyrese Haliburton",
    injurySearchTerm: "Achilles rupture",
    evidenceStatus: "source-ready",
    categories: {
      treatment: ready("Tyrese Haliburton", "Achilles rupture", "treatment", [
        {
          evidenceId: "tyrese-haliburton-achilles-rupture-2025-treatment-01",
          itemId: "tyrese-haliburton-achilles-rupture-2025-treatment-01",
          kind: "treatment",
          attributedStatement:
            "Associated Press 的 Michael Marot 報導記載，Tyrese Haliburton 當時穿著保護靴並進行傷後復健。",
          factDate: "2025-08-23",
          sourceTier: "mainstream-media-report",
          tierBasis: MAINSTREAM_TIER_BASIS,
          source: {
            title:
              "Tyrese Haliburton taking 'the small wins' as Achilles tendon rehab continues",
            publisher: "Associated Press（由 NBA.com 刊載）",
            account: "Michael Marot",
            canonicalUrl:
              "https://www.nba.com/news/tyrese-haliburton-achilles-rehab",
            finalUrl:
              "https://www.nba.com/news/tyrese-haliburton-achilles-rehab",
            publishedAt: "2025-08-23",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      surgery: ready("Tyrese Haliburton", "Achilles rupture", "surgery", [
        {
          evidenceId: "tyrese-haliburton-achilles-rupture-2025-surgery-01",
          itemId: "tyrese-haliburton-achilles-rupture-2025-surgery-01",
          kind: "surgery",
          attributedStatement:
            "Associated Press 的 Michael Marot 報導記載，Tyrese Haliburton 於 2025 年 6 月 23 日接受右阿基里斯腱手術。",
          factDate: "2025-06-23",
          sourceTier: "mainstream-media-report",
          tierBasis: MAINSTREAM_TIER_BASIS,
          source: {
            title:
              "Pacers star Tyrese Haliburton undergoes surgery on right Achilles tendon",
            publisher: "Associated Press（由 NBA.com 刊載）",
            account: "Michael Marot",
            canonicalUrl:
              "https://www.nba.com/news/star-guard-tyrese-haliburton-tears-right-achilles-tendon-pacers-confirm",
            finalUrl:
              "https://www.nba.com/news/star-guard-tyrese-haliburton-tears-right-achilles-tendon-pacers-confirm",
            publishedAt: "2025-06-23",
            accessedAt: ACCESSED_AT,
            medium: "web-article",
          },
          sourceOpened: true,
          searchSnippetUsedAsEvidence: false,
        },
      ]),
      injection: empty("Tyrese Haliburton", "Achilles rupture", "injection"),
      "actual-return": empty(
        "Tyrese Haliburton",
        "Achilles rupture",
        "actual-return",
        "在本次有限查核邊界內未找到符合 official-only 規則、已發生且具日期的回場紀錄。",
      ),
    },
  },
] as const;
