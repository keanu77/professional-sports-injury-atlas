# D34 other sports research

Checked 2026-09-06; 8 selected drafts in `clips.json` and `events.json`. All eight have a successful native iframe probe by root in `/tmp/atlas34/main/probes*.json`; actual injury scene observation and final seek timestamps are root's final check. No external LLM was called by this sub-agent (other research agents cover the actual multi-LLM CLI calls). Research used web searches, source article reads and direct article fetches.

## Playback and attribution

- Samir Aït Saïd `Bt7EHTIivuA`, Olympic Games, 314 seconds, root visually confirmed vault approach at 60 seconds, aftermath 75–90, rehab 105+. Start 58.
- Sofia Goggia `QDOJL9lwYdI`, Paweł Fish (Fishu), 47 seconds. Personal channel redistributes event footage, not athlete self-upload; do not describe channel as FISI or official.
- Yuzuru Hanyu `Jf84VzlzLhI`, white silver charcoal, 117 seconds. Alternative `r0MTsxj8hoI` is the same event and must not be counted as an extra video.
- Aleksander Kilde `OymcZdTQfnM`, Atomic Ski Fans, 137 seconds. Fan channel, not an official Atomic corporate attribution.
- Liu Xiang `Pa50gXELqp0`, elsanto26, 82 seconds.
- Fabio Jakobsen `RvDqK9NnqyI`, Sports History Channel, 63 seconds. The YouTube description's early head/brain injury assertion is NOT the source of the diagnosis; the Aug 18 athlete statement is.
- Mikaela Shiffrin `nFbLC6Dv6Xk`, TNT Sports, 259 seconds. Root locating the crash timestamp. NBC `AHXAIi0qLrk` failed embedding. Replaces Nina O'Brien CBC `W4pJf4HI1XQ`, which could not be played in root's iframe probe.
- Remco Evenepoel `o8mXn1hwdtA`, Andrew Block, 58 seconds. FloBikes `5gPJ3r_BXL8` was blocked in embedding. Root confirmed alternative played.

## Source quality and exact return definitions

1. **Samir**: FIG's 2017-10-01 report confirms left tibia/fibula fracture, surgery, September international return on rings. Athlete's Le Parisien interview published Saturday 2017-08-19 explicitly says Friday INSEP selection was his first official routines since Rio. Therefore date is **2017-08-18**, with selection vs September World Challenge Cup clearly distinguished; not the September medal date. He says medical clearance preceded finishing physiotherapy studies, so elapsed time is not pure biological healing time.
2. **Goggia**: FISI 2022-01-23 MRI/CT notice gives left knee twist, partial injury to previously operated cruciate ligament, small fibula fracture and musculotendinous injury. The wording deliberately does not expand generic `legamento crociato` into a newly inferred complete ACL tear. FISI's 2022-02-15 athlete interview confirms downhill Olympic silver; no earlier competitive event between injury and this return is supported. Training is excluded.
3. **Hanyu**: NBC 2014-11-10 summary of JSF/AP gives head/chin/thigh bruises and ankle sprain. It does not confirm concussion. He returned to the same-day free skate, but this cannot mean healed in zero days; **returnDate=null**. AFP/L'Équipe 2014-11-28 confirms later NHK short-program participation, explicitly after the collision. Text distinguishes same-day continuation from the later event.
4. **Kilde**: SRF article displays publication 2024-01-13 but includes Sunday Jan 14 updates quoting Norwegian association/team doctor: shoulder dislocation and calf cut. Later media add calf nerve damage; this draft sticks to the earlier confirmed basic injuries and does not repeat the initial 'no nerve damage' denial. FIS 2025-11-27 race report confirms World Cup comeback in Copper Mountain super-G. Use full context rather than treating first race as full performance restoration.
5. **Liu**: World Athletics 2012-08-07 preliminary event report and 2015-04-07 retirement report confirm Achilles rupture and no subsequent competition. Initial report visually guessed left foot; draft intentionally omits laterality rather than reproducing that inconsistent visual guess. **returnDate=null** and retirement is explicitly not a return date.
6. **Jakobsen**: early reports disagree about structural brain injury. Athlete's 2020-08-18 statement through team, reproduced by Cyclingnews, explicitly states severe concussion and future facial surgeries. This later first-person source supports concise diagnosis. Cyclingnews race reporting 2021-04-11 confirms actual Tour of Turkey stage 1 return, not a planned date; first stage completed but did not contest sprint.
7. **Shiffrin**: U.S. Ski & Snowboard 2024-12-01 confirms right abdominal puncture and severe muscle trauma. FIS 2025-01-30 race report explicitly says racing for first time since injury, finish 10th in Courchevel slalom. It was slalom return, not simultaneous full return to giant slalom.
8. **Remco**: RTVE 2020-08-15 reproduces team X-ray diagnosis of pelvic fracture and right lung contusion. Cyclingnews 2021-05-08 live report documents him starting and completing Giro stage 1. Giro organizer original `la-migliore-inaugurazione` confirms 7th 9:06. This is his return competition; rollers and training excluded. No claim of complete healing or restored stage-race endurance.

## Article evidence receipts

`source-fetch-manifest.json` records URLs, checked time, HTTP status, SHA256 and file paths for 12 successfully fetched original HTML documents. Titles inspected to reject challenge/error documents masquerading as HTTP 200. The remaining 5 direct fetch failures are explicitly logged (FIG system CA failure; Le Parisien/U.S. Ski 403; FISI 503). Their actual text was read through the web tool and saved in `web-source-evidence.txt`; this is tool-rendered page text rather than a raw publisher HTTP receipt. Do not call those direct-fetch successes. Root independent source review is still required.

Known web-tool open failures despite direct-fetch success: World Athletics 403, Cyclingnews Turkey timeout, Giro cache miss. Direct HTTP successfully retrieved the genuine articles with correct titles; full raw copies are in sources and hashes in manifest.

## Additional leads, not selected / not counted

- Nina O'Brien 2022 Beijing: US team original injury https://www.usskiandsnowboard.org/news/obrien-injury-update confirms compound left tibia/fibula fracture; CBC video could not embed. 11Alive `rW4uXh2HVkY` is an unprobed alternative and may be news-only, so not counted. FIS athlete competitorid187620 and Levi race114038 show early 2022/23 return; do not blindly label 2022-11-26 Killington as first race because Levi happened earlier.
- Vanessa Ferrari 2017 Montreal floor Achilles: FIG athlete profile https://www.gymnastics.sport/site/athletes/bio_detail.php?id=17051 confirms left Achilles rupture and https://www.vanessaferrari.com/biografia/ is athlete's recovery account. Sportfair article identifies original FIG finals full broadcast at 2:55:36, but YouTube ID not extracted or tested yet; not a ready backup.
- Yohan Blake 2014 Glasgow: early next-day manager said cramp/no tear, later July23 surgery and IAAF biography confirm severe hamstring injury. Would require later update source, actual event video and first subsequent race before inclusion. Not a ready backup.
