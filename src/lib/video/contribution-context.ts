/** Known course context only; never fetch submitted URLs or redirect to arbitrary hosts. */
const COURSES: Record<string, string> = {
  "hip-imaging-course.pages.dev": "髖關節",
  "ankle-foot-imaging-course.pages.dev": "踝與足",
  "shoulder-imaging.sportsmedicine.tw": "肩部",
  "shoulder-imaging-course.pages.dev": "肩部",
  "cervical-imaging-course.pages.dev": "頸椎",
  "lumbar-imaging-course.pages.dev": "腰椎",
  "wrist-hand-imaging-course.pages.dev": "腕與手",
  "knee-imaging.sportsmedicine.tw": "膝關節",
  "knee-ultrasound-course.pages.dev": "膝關節",
  "imaging-course-hub.sportsmedicine.tw": "課程總覽",
  "imaging-course-hub.pages.dev": "課程總覽",
};
export function contributionContext(
  value: unknown,
): { url: string; label: string } | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const label = COURSES[url.hostname];
    if (
      !label ||
      url.protocol !== "https:" ||
      url.port ||
      url.username ||
      url.password
    )
      return null;
    // Keep course location, never incidental query parameters or tracking data.
    const tab = url.searchParams.get("tab");
    url.search = "";
    if (tab && /^[a-z-]{1,30}$/.test(tab)) url.searchParams.set("tab", tab);
    if (!/^#[a-zA-Z0-9_-]{1,120}$/.test(url.hash)) url.hash = "";
    return { url: url.href, label };
  } catch {
    return null;
  }
}
