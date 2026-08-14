/**
 * Decision 17 follow-up research seed, batch 1.
 *
 * This is deterministic source-ready evidence only. It deliberately contains
 * no review, approval, reviewer, or medical-signoff state.
 */

const ACCESSED_AT = "2026-08-14";
const AUDIT_LOCATIONS = [
  "球隊／聯盟官方新聞室與比賽頁",
  "具名主流媒體原始頁",
] as const;
const AUDIT_STOPPING_BOUNDARY =
  "開啟原頁並檢查 treatment、surgery、injection、actual-return 四類後停止；沒有符合 nba-v10 的逐條來源就記為 not-found。";
const NOT_FOUND_REASON =
  "在界定的官方新聞室／比賽頁與具名主流媒體原始頁中，未找到符合 nba-v10 且可逐條引用的紀錄。";
const OFFICIAL_TIER_BASIS =
  "球隊／聯盟直接控制的頁面，且內容是直接公告或實際出賽紀錄；不是僅因 nba.com 網域而分類。";
const MAINSTREAM_TIER_BASIS =
  "具名主流媒體或可識別所屬媒體作者的原始編輯報導；不是因 nba.com 網域而升級為官方來源。";
const UNVERIFIED_TIER_BASIS =
  "報導明示關鍵資訊來自未具名消息來源，因此依 nba-v10 保持為未核實報導，不得視覺提升為已確認。";

export const DECISION_17_FOLLOW_UP_BATCH_1 = [
  {
    caseSlug: "danny-green-acl-2022",
    caseId: "CASE-NBAACL-2022-017",
    athleteName: "Danny Green",
    injurySearchTerm: "ACL injury",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Danny Green ACL injury treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "danny-green-acl-2022-treatment-01",
            itemId: "danny-green-acl-2022-treatment-01",
            kind: "treatment",
            attributedStatement:
              "Grind City Media 的 Michael Wallace 報導，Danny Green 當時正在進行傷後復健。",
            factDate: null,
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "MikeCheck: Key statements – and their meanings – as Grizzlies prep for NBA preseason slate",
              publisher: "Grind City Media",
              account: "Michael Wallace",
              canonicalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-key-statements-and-their-meanings-as-grizzlies-prep-for-nba-preseason-slate",
              finalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-key-statements-and-their-meanings-as-grizzlies-prep-for-nba-preseason-slate",
              publishedAt: "2022-09-29",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Danny Green ACL injury surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "danny-green-acl-2022-surgery-01",
            itemId: "danny-green-acl-2022-surgery-01",
            kind: "surgery",
            attributedStatement:
              "Grind City Media 的 Michael Wallace 報導記載，Danny Green 於該年春季接受膝部手術。",
            factDate: null,
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "MikeCheck: Key statements – and their meanings – as Grizzlies prep for NBA preseason slate",
              publisher: "Grind City Media",
              account: "Michael Wallace",
              canonicalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-key-statements-and-their-meanings-as-grizzlies-prep-for-nba-preseason-slate",
              finalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-key-statements-and-their-meanings-as-grizzlies-prep-for-nba-preseason-slate",
              publishedAt: "2022-09-29",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Danny Green ACL injury injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Danny Green ACL injury return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
    },
  },
  {
    caseSlug: "joe-ingles-acl-2022",
    caseId: "CASE-NBAACL-2022-016",
    athleteName: "Joe Ingles",
    injurySearchTerm: "ACL injury",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Joe Ingles ACL injury treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Joe Ingles ACL injury surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "joe-ingles-acl-2022-surgery-01",
            itemId: "joe-ingles-acl-2022-surgery-01",
            kind: "surgery",
            attributedStatement:
              "NBA.com 的 Official release 記載，Joe Ingles 於 2022 年 2 月 23 日接受左膝前十字韌帶修復手術。",
            factDate: "2022-02-23",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Joe Ingles undergoes successful knee surgery to repair torn ACL",
              publisher: "NBA.com",
              account: "Official release",
              canonicalUrl:
                "https://www.nba.com/news/joe-ingles-undergoes-successful-knee-surgery-to-repair-torn-acl",
              finalUrl:
                "https://www.nba.com/news/joe-ingles-undergoes-successful-knee-surgery-to-repair-torn-acl",
              publishedAt: "2022-02-24",
              accessedAt: ACCESSED_AT,
              medium: "press-release",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Joe Ingles ACL injury injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Joe Ingles ACL injury return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "joe-ingles-acl-2022-actual-return-01",
            itemId: "joe-ingles-acl-2022-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "Milwaukee Bucks 官方比賽紀錄顯示，Joe Ingles 於 2022 年 12 月 19 日出賽。",
            factDate: "2022-12-19",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Milwaukee Bucks vs New Orleans Pelicans Dec 19, 2022 Game Details",
              publisher: "Milwaukee Bucks",
              account: null,
              canonicalUrl: "https://www.nba.com/bucks/game/0022200457",
              finalUrl:
                "https://www.nba.com/bucks/game/0022200457-bucks-vs-pelicans-new-orleans-la-12-19-2022",
              publishedAt: "2022-12-19",
              accessedAt: ACCESSED_AT,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
    },
  },
  {
    caseSlug: "kyrie-irving-acl-2025",
    caseId: "CASE-NBAACL-2025-021",
    athleteName: "Kyrie Irving",
    injurySearchTerm: "ACL injury",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Kyrie Irving ACL injury treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "kyrie-irving-acl-2025-treatment-01",
            itemId: "kyrie-irving-acl-2025-treatment-01",
            kind: "treatment",
            attributedStatement:
              "Dallas Mavericks 官方更新稱，Kyrie Irving 於 2026 年 2 月 18 日持續在球隊醫療與表現團隊監督下復健。",
            factDate: "2026-02-18",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Kyrie Irving will Miss Remainder of 2025-26 Season to Continue ACL Recovery",
              publisher: "Dallas Mavericks",
              account: null,
              canonicalUrl:
                "https://www.nba.com/mavs/news/kyrie-irving-to-miss-remainder-of-2025-26-season-as-he-continues-acl-recovery",
              finalUrl:
                "https://www.nba.com/mavs/news/kyrie-irving-to-miss-remainder-of-2025-26-season-as-he-continues-acl-recovery",
              publishedAt: "2026-02-18",
              accessedAt: ACCESSED_AT,
              medium: "press-release",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Kyrie Irving ACL injury surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "kyrie-irving-acl-2025-surgery-01",
            itemId: "kyrie-irving-acl-2025-surgery-01",
            kind: "surgery",
            attributedStatement:
              "Dallas Mavericks 的 Dwain Price 官方報導，Kyrie Irving 於 2025 年 3 月 26 日接受左膝手術。",
            factDate: "2025-03-26",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title: "Kyrie Irving undergoes successful left knee surgery",
              publisher: "Dallas Mavericks",
              account: "Dwain Price",
              canonicalUrl:
                "https://www.nba.com/mavs/irvinghassuccessfulkneesurgery",
              finalUrl:
                "https://www.nba.com/mavs/irvinghassuccessfulkneesurgery",
              publishedAt: "2025-03-26",
              accessedAt: ACCESSED_AT,
              medium: "press-release",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Kyrie Irving ACL injury injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Kyrie Irving ACL injury return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
    },
  },
  {
    caseSlug: "markelle-fultz-acl-2021",
    caseId: "CASE-NBAACL-2021-009",
    athleteName: "Markelle Fultz",
    injurySearchTerm: "ACL injury",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Markelle Fultz ACL injury treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "markelle-fultz-acl-2021-treatment-01",
            itemId: "markelle-fultz-acl-2021-treatment-01",
            kind: "treatment",
            attributedStatement:
              "Orlando Magic 的 Dan Savage 官方更新稱，Markelle Fultz 於 2021 年 12 月 10 日參與球隊練習。",
            factDate: "2021-12-10",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Markelle Fultz Practices with Orlando Magic in L.A., Continues to Make Progress in Rehab",
              publisher: "Orlando Magic",
              account: "Dan Savage",
              canonicalUrl:
                "https://www.nba.com/magic/orlando-magic-markelle-fultz-injury-update-practice-team-los-angeles-20211210",
              finalUrl:
                "https://www.nba.com/magic/orlando-magic-markelle-fultz-injury-update-practice-team-los-angeles-20211210",
              publishedAt: "2021-12-10",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Markelle Fultz ACL injury surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "markelle-fultz-acl-2021-surgery-01",
            itemId: "markelle-fultz-acl-2021-surgery-01",
            kind: "surgery",
            attributedStatement:
              "Bleacher Report 的 Rob Goldberg 引述 Marc J. Spears 與球隊公告報導，Markelle Fultz 於 2021 年 1 月 20 日接受前十字韌帶手術。",
            factDate: "2021-01-20",
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "Magic's Markelle Fultz Undergoes Successful Surgery on Knee Injury",
              publisher: "Bleacher Report",
              account: "Rob Goldberg",
              canonicalUrl:
                "https://bleacherreport.com/articles/2927630-magics-markelle-fultz-undergoes-successful-surgery-on-knee-injury",
              finalUrl:
                "https://bleacherreport.com/articles/2927630-magics-markelle-fultz-undergoes-successful-surgery-on-knee-injury",
              publishedAt: "2021-01-20",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Markelle Fultz ACL injury injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Markelle Fultz ACL injury return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "markelle-fultz-acl-2021-actual-return-01",
            itemId: "markelle-fultz-acl-2021-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "Orlando Magic 的 Josh Cohen 官方賽後報導記錄，Markelle Fultz 於 2022 年 2 月 28 日出賽。",
            factDate: "2022-02-28",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Markelle Fultz Makes Highly Anticipated Return; Magic Roll Past Pacers",
              publisher: "Orlando Magic",
              account: "Josh Cohen",
              canonicalUrl:
                "https://www.nba.com/magic/news/markelle-fultz-makes-highly-anticipated-return-magic-roll-past-pacers-20220228",
              finalUrl:
                "https://www.nba.com/magic/news/markelle-fultz-makes-highly-anticipated-return-magic-roll-past-pacers-20220228",
              publishedAt: "2022-02-28",
              accessedAt: ACCESSED_AT,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
    },
  },
  {
    caseSlug: "moritz-wagner-acl-2024",
    caseId: "CASE-NBAACL-2024-023",
    athleteName: "Moritz Wagner",
    injurySearchTerm: "ACL injury",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Moritz Wagner ACL injury treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "moritz-wagner-acl-2024-treatment-01",
            itemId: "moritz-wagner-acl-2024-treatment-01",
            kind: "treatment",
            attributedStatement:
              "Orlando Magic 的 Josh Cohen 官方報導描述，Moritz Wagner 在出賽前曾進行數月復健。",
            factDate: null,
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Orlando Magic Overpower New Orleans Pelicans Down the Stretch to Win in Moe Wagner’s Return",
              publisher: "Orlando Magic",
              account: "Josh Cohen",
              canonicalUrl:
                "https://www.nba.com/magic/news/orlando-magic-overpower-new-orleans-pelicans-down-the-stretch-to-win-in-moe-wagners-return-20250111",
              finalUrl:
                "https://www.nba.com/magic/news/orlando-magic-overpower-new-orleans-pelicans-down-the-stretch-to-win-in-moe-wagners-return-20250111",
              publishedAt: "2026-01-11",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Moritz Wagner ACL injury surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "moritz-wagner-acl-2024-surgery-01",
            itemId: "moritz-wagner-acl-2024-surgery-01",
            kind: "surgery",
            attributedStatement:
              "Magic on SI 的 Mason Williams 引述未具名 league source 報導，Moritz Wagner 於 2025 年 1 月 8 日接受左膝前十字韌帶修復手術。",
            factDate: "2025-01-08",
            sourceTier: "unverified-report",
            tierBasis: UNVERIFIED_TIER_BASIS,
            source: {
              title: "Latest Updates on Magic's Jalen Suggs and Moe Wagner",
              publisher: "Magic on SI",
              account: "Mason Williams",
              canonicalUrl:
                "https://www.si.com/nba/magic/onsi/news/latest-health-injury-updates-on-orlando-magic-jalen-suggs-moritz-moe-wagner",
              finalUrl:
                "https://www.si.com/nba/magic/onsi/news/latest-health-injury-updates-on-orlando-magic-jalen-suggs-moritz-moe-wagner",
              publishedAt: "2025-01-09",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Moritz Wagner ACL injury injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Moritz Wagner ACL injury return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "moritz-wagner-acl-2024-actual-return-01",
            itemId: "moritz-wagner-acl-2024-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "Orlando Magic 的 Josh Cohen 官方報導記錄，Moritz Wagner 於 2026 年 1 月 11 日出賽。",
            factDate: "2026-01-11",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Orlando Magic Overpower New Orleans Pelicans Down the Stretch to Win in Moe Wagner’s Return",
              publisher: "Orlando Magic",
              account: "Josh Cohen",
              canonicalUrl:
                "https://www.nba.com/magic/news/orlando-magic-overpower-new-orleans-pelicans-down-the-stretch-to-win-in-moe-wagners-return-20250111",
              finalUrl:
                "https://www.nba.com/magic/news/orlando-magic-overpower-new-orleans-pelicans-down-the-stretch-to-win-in-moe-wagners-return-20250111",
              publishedAt: "2026-01-11",
              accessedAt: ACCESSED_AT,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
    },
  },
  {
    caseSlug: "ricky-rubio-acl-2021",
    caseId: "CASE-NBAACL-2021-015",
    athleteName: "Ricky Rubio",
    injurySearchTerm: "ACL injury",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Ricky Rubio ACL injury treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "ricky-rubio-acl-2021-treatment-01",
            itemId: "ricky-rubio-acl-2021-treatment-01",
            kind: "treatment",
            attributedStatement:
              "Associated Press 的 Brian Dulik 報導，Ricky Rubio 於 2022 年 12 月 1 日進行輕量 3 對 3 訓練。",
            factDate: "2022-12-01",
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "Orlando Magic vs Cleveland Cavaliers Dec 2, 2022 Game Summary | NBA.com",
              publisher: "Associated Press",
              account: "Brian Dulik",
              canonicalUrl: "https://www.nba.com/game/orl-vs-cle-0022200330",
              finalUrl: "https://www.nba.com/game/orl-vs-cle-0022200330",
              publishedAt: "2022-12-02",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Ricky Rubio ACL injury surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "ricky-rubio-acl-2021-surgery-01",
            itemId: "ricky-rubio-acl-2021-surgery-01",
            kind: "surgery",
            attributedStatement:
              "Associated Press 報導，Ricky Rubio 曾接受膝部手術。",
            factDate: null,
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "Cavs’ Ricky Rubio to return after missing year with knee injury",
              publisher: "Associated Press",
              account: "Tom Withers",
              canonicalUrl:
                "https://www.nba.com/news/cavs-ricky-rubio-season-debut",
              finalUrl:
                "https://www.nba.com/news/cavs-ricky-rubio-season-debut",
              publishedAt: "2023-01-12",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Ricky Rubio ACL injury injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Ricky Rubio ACL injury return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "ricky-rubio-acl-2021-actual-return-01",
            itemId: "ricky-rubio-acl-2021-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "Cleveland Cavaliers 官方回顧記載，2023 年 1 月 12 日是 Ricky Rubio 在 ACL 傷後的首場比賽。",
            factDate: "2023-01-12",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title: "Cavaliers Reach Buyout Agreement with Ricky Rubio",
              publisher: "Cleveland Cavaliers",
              account: null,
              canonicalUrl:
                "https://www.nba.com/cavaliers/news/releases-ricky-rubio-240104",
              finalUrl:
                "https://www.nba.com/cavaliers/news/releases-ricky-rubio-240104",
              publishedAt: "2024-01-04",
              accessedAt: ACCESSED_AT,
              medium: "press-release",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
    },
  },
  {
    caseSlug: "thomas-bryant-acl-2021",
    caseId: "CASE-NBAACL-2021-010",
    athleteName: "Thomas Bryant",
    injurySearchTerm: "ACL injury",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Thomas Bryant ACL injury treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Thomas Bryant ACL injury surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "thomas-bryant-acl-2021-surgery-01",
            itemId: "thomas-bryant-acl-2021-surgery-01",
            kind: "surgery",
            attributedStatement:
              "Associated Press 報導，Thomas Bryant 於 2021 年 2 月 2 日接受左膝前十字韌帶手術。",
            factDate: "2021-02-02",
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "Portland Trail Blazers vs Washington Wizards Feb 2, 2021 Game Summary | NBA.com",
              publisher: "Associated Press",
              account: "Ian Nicholas Quillen",
              canonicalUrl: "https://www.nba.com/game/por-vs-was-0022000559",
              finalUrl: "https://www.nba.com/game/por-vs-was-0022000559",
              publishedAt: "2021-02-02",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Thomas Bryant ACL injury injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Thomas Bryant ACL injury return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
    },
  },
  {
    caseSlug: "brandon-clarke-achilles-rupture-2023",
    caseId: "CASE-NBAACHILLES-2023-010",
    athleteName: "Brandon Clarke",
    injurySearchTerm: "Achilles rupture",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Brandon Clarke Achilles rupture treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "brandon-clarke-achilles-rupture-2023-treatment-01",
            itemId: "brandon-clarke-achilles-rupture-2023-treatment-01",
            kind: "treatment",
            attributedStatement:
              "Grind City Media 的 Michael Wallace 報導，Brandon Clarke 在復健期間進行球場訓練。",
            factDate: null,
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "MikeCheck: As Clarke eyes return, Grizzlies reflect on long journey back to B.C. being B.C.",
              publisher: "Grind City Media",
              account: "Michael Wallace",
              canonicalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-as-clarke-eyes-return-grizzlies-reflect-on-long-journey-back-to-b-c-being-b-c",
              finalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-as-clarke-eyes-return-grizzlies-reflect-on-long-journey-back-to-b-c-being-b-c",
              publishedAt: "2024-03-26",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Brandon Clarke Achilles rupture surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "brandon-clarke-achilles-rupture-2023-surgery-01",
            itemId: "brandon-clarke-achilles-rupture-2023-surgery-01",
            kind: "surgery",
            attributedStatement:
              "Grind City Media 的 Michael Wallace 報導記載，Brandon Clarke 接受阿基里斯腱修復手術。",
            factDate: null,
            sourceTier: "mainstream-media-report",
            tierBasis: MAINSTREAM_TIER_BASIS,
            source: {
              title:
                "MikeCheck: As Clarke eyes return, Grizzlies reflect on long journey back to B.C. being B.C.",
              publisher: "Grind City Media",
              account: "Michael Wallace",
              canonicalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-as-clarke-eyes-return-grizzlies-reflect-on-long-journey-back-to-b-c-being-b-c",
              finalUrl:
                "https://www.nba.com/grizzlies/news/mikecheck-as-clarke-eyes-return-grizzlies-reflect-on-long-journey-back-to-b-c-being-b-c",
              publishedAt: "2024-03-26",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Brandon Clarke Achilles rupture injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Brandon Clarke Achilles rupture return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "brandon-clarke-achilles-rupture-2023-actual-return-01",
            itemId: "brandon-clarke-achilles-rupture-2023-actual-return-01",
            kind: "actual-return",
            attributedStatement:
              "Memphis Grizzlies 官方賽後報導記錄，Brandon Clarke 於 2024 年 3 月 27 日出賽。",
            factDate: "2024-03-27",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title: "Brandon Clarke returns; Lakers defeat Grizzlies 136-124",
              publisher: "Memphis Grizzlies",
              account: null,
              canonicalUrl:
                "https://www.nba.com/grizzlies/news/brandon-clarke-returns-lakers-defeat-grizzlies-136-124",
              finalUrl:
                "https://www.nba.com/grizzlies/news/brandon-clarke-returns-lakers-defeat-grizzlies-136-124",
              publishedAt: "2024-03-28",
              accessedAt: ACCESSED_AT,
              medium: "game-or-participation-record",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
    },
  },
  {
    caseSlug: "dwight-powell-achilles-rupture-2020",
    caseId: "CASE-NBAACHILLES-2020-008",
    athleteName: "Dwight Powell",
    injurySearchTerm: "Achilles rupture",
    evidenceStatus: "source-ready",
    categories: {
      treatment: {
        queryBoundaries: [
          {
            query: "Dwight Powell Achilles rupture treatment",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "dwight-powell-achilles-rupture-2020-treatment-01",
            itemId: "dwight-powell-achilles-rupture-2020-treatment-01",
            kind: "treatment",
            attributedStatement:
              "Dallas Mavericks 的 Eddie Sefko 官方報導描述，Dwight Powell 於 2020 年 2 月 5 日在術後使用滑板車並開始復健。",
            factDate: "2020-02-05",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title:
                "Dwight Powell ready to attack rehab like he goes after the rim with a lob pass",
              publisher: "Dallas Mavericks",
              account: "Eddie Sefko",
              canonicalUrl:
                "https://www.nba.com/mavs/dwight-powell-scoots-around-locker-room",
              finalUrl:
                "https://www.nba.com/mavs/dwight-powell-scoots-around-locker-room",
              publishedAt: "2020-02-05",
              accessedAt: ACCESSED_AT,
              medium: "web-article",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      surgery: {
        queryBoundaries: [
          {
            query: "Dwight Powell Achilles rupture surgery",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "dwight-powell-achilles-rupture-2020-surgery-01",
            itemId: "dwight-powell-achilles-rupture-2020-surgery-01",
            kind: "surgery",
            attributedStatement:
              "NBA.com 的 Official release 記載，Dwight Powell 於 2020 年 1 月 28 日接受右阿基里斯腱修復手術。",
            factDate: "2020-01-28",
            sourceTier: "team-or-league-official",
            tierBasis: OFFICIAL_TIER_BASIS,
            source: {
              title: "Dwight Powell has surgery on Achilles",
              publisher: "NBA.com",
              account: "Official release",
              canonicalUrl:
                "https://www.nba.com/news/dwight-powell-has-surgery-achilles",
              finalUrl:
                "https://www.nba.com/news/dwight-powell-has-surgery-achilles",
              publishedAt: "2020-01-28",
              accessedAt: ACCESSED_AT,
              medium: "press-release",
            },
            sourceOpened: true,
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
      injection: {
        queryBoundaries: [
          {
            query: "Dwight Powell Achilles rupture injection",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
      "actual-return": {
        queryBoundaries: [
          {
            query: "Dwight Powell Achilles rupture return",
            locationsChecked: AUDIT_LOCATIONS,
            performedAt: ACCESSED_AT,
            stoppingBoundary: AUDIT_STOPPING_BOUNDARY,
          },
        ],
        outcome: "not-found",
        notFoundReason: NOT_FOUND_REASON,
        facts: [],
      },
    },
  },
] as const;
