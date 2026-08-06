/**
 * Registry-shaped taxonomy contract. Sport, league, competition, injury,
 * mechanism, and video-provider tokens are validated against registries, never
 * hard-coded into display components. The shapes already support adding
 * another sport, competition, and many leagues/providers.
 */

import { COMPETITIONS } from "../../data/taxonomy/competitions";
import { INJURIES } from "../../data/taxonomy/injuries";
import { LEAGUES } from "../../data/taxonomy/leagues";
import { MECHANISMS } from "../../data/taxonomy/mechanisms";
import { SPORTS } from "../../data/taxonomy/sports";
import { VIDEO_PROVIDERS } from "../../data/taxonomy/video-providers";
import { issue, type ValidationIssue } from "./canonical";

export type EmbedStatus = "verified" | "external-link-only" | "unavailable";

export interface SportDefinition {
  code: string;
  labelZh: string;
}

export interface LeagueDefinition {
  code: string;
  sportCode: string;
  labelZh: string;
  seasonForm: "two-year" | "single-year";
}

export interface CompetitionDefinition {
  code: string;
  leagueCode: string;
  labelZh: string;
}

export interface InjuryDefinition {
  code: string;
  labelZh: string;
}

export interface MechanismDefinition {
  code: string;
  labelZh: string;
  searchAliases: string[];
  allowedInjuries: string[];
}

export interface VideoProviderDefinition {
  code: string;
  allowedHosts: string[];
  allowedEmbedStatuses: EmbedStatus[];
  canEmbed: boolean;
}

export interface TaxonomyRegistries {
  sports: readonly SportDefinition[];
  leagues: readonly LeagueDefinition[];
  competitions: readonly CompetitionDefinition[];
  injuries: readonly InjuryDefinition[];
  mechanisms: readonly MechanismDefinition[];
  videoProviders: readonly VideoProviderDefinition[];
}

export const defaultTaxonomyRegistries: TaxonomyRegistries = {
  sports: SPORTS,
  leagues: LEAGUES,
  competitions: COMPETITIONS,
  injuries: INJURIES,
  mechanisms: MECHANISMS,
  videoProviders: VIDEO_PROVIDERS,
};

const LOWER_KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Mechanism tokens are observation taxonomy only. Codes and aliases that read
 * as a diagnosis are rejected so the registry can never drift into implying
 * confirmed pathology from video.
 */
const DIAGNOSTIC_STYLE_RE =
  /(^|[^a-z])(acl|mcl|ucl|lcl|pcl)([^a-z]|$)|tear|rupture|fracture|sprain|strain|tendinopathy|diagnos|斷裂|撕裂|骨折|扭傷|拉傷/i;

export function findSport(
  code: string,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): SportDefinition | undefined {
  return registries.sports.find((sport) => sport.code === code);
}

export function findLeague(
  code: string,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): LeagueDefinition | undefined {
  return registries.leagues.find((league) => league.code === code);
}

export function findCompetition(
  code: string,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): CompetitionDefinition | undefined {
  return registries.competitions.find(
    (competition) => competition.code === code,
  );
}

export function findInjury(
  code: string,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): InjuryDefinition | undefined {
  return registries.injuries.find((injury) => injury.code === code);
}

export function findMechanism(
  code: string,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): MechanismDefinition | undefined {
  return registries.mechanisms.find((mechanism) => mechanism.code === code);
}

export function findVideoProvider(
  code: string,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): VideoProviderDefinition | undefined {
  return registries.videoProviders.find((provider) => provider.code === code);
}

export function validateTaxonomyRegistries(
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const injuryCodes = new Set(registries.injuries.map((injury) => injury.code));
  const sportCodes = new Set(registries.sports.map((sport) => sport.code));
  const leagueCodes = new Set(registries.leagues.map((league) => league.code));

  const checkUnique = (values: string[], path: string): void => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) {
        issues.push(
          issue("taxonomy-duplicate", path, `duplicate token ${value}`),
        );
      }
      seen.add(value);
    }
  };

  checkUnique(
    registries.sports.map((sport) => sport.code),
    "sports",
  );
  checkUnique(
    registries.leagues.map((league) => league.code),
    "leagues",
  );
  checkUnique(
    registries.competitions.map((competition) => competition.code),
    "competitions",
  );
  checkUnique(
    registries.injuries.map((injury) => injury.code),
    "injuries",
  );
  checkUnique(
    registries.mechanisms.map((mechanism) => mechanism.code),
    "mechanisms",
  );
  checkUnique(
    registries.videoProviders.map((provider) => provider.code),
    "videoProviders",
  );

  for (const league of registries.leagues) {
    if (!sportCodes.has(league.sportCode)) {
      issues.push(
        issue(
          "taxonomy-unknown-reference",
          `leagues.${league.code}`,
          `league references unknown sport ${league.sportCode}`,
        ),
      );
    }
  }
  for (const competition of registries.competitions) {
    if (!leagueCodes.has(competition.leagueCode)) {
      issues.push(
        issue(
          "taxonomy-unknown-reference",
          `competitions.${competition.code}`,
          `competition references unknown league ${competition.leagueCode}`,
        ),
      );
    }
  }

  const aliasOwners = new Map<string, string>();
  for (const mechanism of registries.mechanisms) {
    const path = `mechanisms.${mechanism.code}`;
    if (!LOWER_KEBAB_RE.test(mechanism.code)) {
      issues.push(
        issue(
          "taxonomy-token",
          path,
          "mechanism code must be lower-kebab-case",
        ),
      );
    }
    if (mechanism.labelZh.trim() === "") {
      issues.push(issue("taxonomy-label", path, "labelZh must be non-empty"));
    }
    if (mechanism.searchAliases.length === 0) {
      issues.push(
        issue("taxonomy-alias", path, "searchAliases must be non-empty"),
      );
    }
    if (DIAGNOSTIC_STYLE_RE.test(mechanism.code)) {
      issues.push(
        issue(
          "taxonomy-diagnostic-style",
          path,
          `mechanism code ${mechanism.code} reads as a diagnosis`,
        ),
      );
    }
    for (const alias of mechanism.searchAliases) {
      const normalized = alias.normalize("NFC").toLowerCase();
      const owner = aliasOwners.get(normalized);
      if (owner !== undefined) {
        issues.push(
          issue(
            "taxonomy-duplicate-alias",
            path,
            `alias ${alias} already used by ${owner}`,
          ),
        );
      }
      aliasOwners.set(normalized, mechanism.code);
      if (DIAGNOSTIC_STYLE_RE.test(alias)) {
        issues.push(
          issue(
            "taxonomy-diagnostic-style",
            path,
            `alias ${alias} reads as a diagnosis`,
          ),
        );
      }
    }
    if (mechanism.allowedInjuries.length === 0) {
      issues.push(
        issue("taxonomy-allowed-injuries", path, "allowedInjuries is empty"),
      );
    }
    for (const injuryCode of mechanism.allowedInjuries) {
      if (!injuryCodes.has(injuryCode)) {
        issues.push(
          issue(
            "taxonomy-unknown-reference",
            path,
            `mechanism allows unknown injury ${injuryCode}`,
          ),
        );
      }
    }
  }

  for (const provider of registries.videoProviders) {
    const path = `videoProviders.${provider.code}`;
    if (provider.allowedHosts.length === 0) {
      issues.push(issue("taxonomy-hosts", path, "allowedHosts is empty"));
    }
    for (const host of provider.allowedHosts) {
      if (!/^[a-z0-9.-]+$/.test(host)) {
        issues.push(
          issue("taxonomy-hosts", path, `invalid host token ${host}`),
        );
      }
    }
    if (provider.allowedEmbedStatuses.length === 0) {
      issues.push(
        issue("taxonomy-embed-capability", path, "allowedEmbedStatuses empty"),
      );
    }
    if (
      !provider.canEmbed &&
      provider.allowedEmbedStatuses.includes("verified")
    ) {
      issues.push(
        issue(
          "taxonomy-embed-capability",
          path,
          "provider without embed capability cannot allow verified embeds",
        ),
      );
    }
  }

  return issues;
}
