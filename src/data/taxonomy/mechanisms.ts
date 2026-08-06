import type { MechanismDefinition } from "../../lib/contracts/taxonomy";

/**
 * Controlled observation-only mechanism registry. Codes and aliases describe
 * what is visible on video; they are never a diagnosis, and UI must label them
 * as visible-mechanism tags.
 */
export const MECHANISMS: readonly MechanismDefinition[] = [
  {
    code: "non-contact-cut",
    labelZh: "非接觸切入變向",
    searchAliases: ["cutting", "變向", "切入"],
    allowedInjuries: ["acl"],
  },
  {
    code: "non-contact-landing",
    labelZh: "非接觸落地",
    searchAliases: ["landing", "落地", "跳躍落地"],
    allowedInjuries: ["acl", "ankle-sprain", "achilles-rupture"],
  },
  {
    code: "contact-at-knee",
    labelZh: "膝部受到接觸",
    searchAliases: ["knee contact", "膝部碰撞"],
    allowedInjuries: ["acl"],
  },
  {
    code: "hyperextension-visible",
    labelZh: "可見膝過度伸直",
    searchAliases: ["hyperextension", "過度伸直"],
    allowedInjuries: ["acl"],
  },
  {
    code: "inversion-landing",
    labelZh: "足內翻落地",
    searchAliases: ["inversion", "內翻", "翻船"],
    allowedInjuries: ["ankle-sprain"],
  },
  {
    code: "contact-landing",
    labelZh: "接觸後落地",
    searchAliases: ["contact landing", "碰撞落地"],
    allowedInjuries: ["acl", "ankle-sprain"],
  },
  {
    code: "stepped-on-foot",
    labelZh: "踩到他人腳部",
    searchAliases: ["stepped on", "踩腳"],
    allowedInjuries: ["ankle-sprain"],
  },
  {
    code: "push-off-acceleration",
    labelZh: "蹬地加速",
    searchAliases: ["push off", "蹬地", "起跑"],
    allowedInjuries: ["achilles-rupture"],
  },
  {
    code: "deceleration",
    labelZh: "急停減速",
    searchAliases: ["sudden stop", "急停", "減速"],
    allowedInjuries: ["acl", "achilles-rupture"],
  },
  {
    code: "unclear",
    labelZh: "機轉不明",
    searchAliases: ["unknown mechanism", "不明"],
    allowedInjuries: ["acl", "ankle-sprain", "achilles-rupture"],
  },
];
