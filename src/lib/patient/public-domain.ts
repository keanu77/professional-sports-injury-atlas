/** Domain authorization is separate from the original medical release approval. */
import { z } from "astro/zod";
import data from "../../data/public-domain.v1.json";

export const publicDomain = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-35"),
    origin: z.literal("https://injury.sportsmedicine.tw"),
    previousOrigin: z.literal("https://sports-injury-atlas.pages.dev"),
    authorizationQuote: z.literal(
      "injury.sportsmedicine.tw：獨立子網域，設定與維護較簡單",
    ),
    authorizedAt: z.iso.datetime(),
  })
  .parse(data);
