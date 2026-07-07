// Coerce arbitrary newsroom date strings into ISO so the UI's `Date.parse`
// always succeeds.
//
// Timezone policy: every source here is a UC (California) newsroom, so a date
// string that carries NO timezone is interpreted as Pacific time rather than
// "whatever timezone the crawl machine happened to be in" (CI runs in UTC, a
// laptop runs in local time — previously the stored instant drifted by the
// machine's offset). Strings that DO carry a zone (RFC 2822 `GMT`/`+0000`,
// ISO `Z`/`±HH:MM`) are passed straight through and preserved exactly.
//
// Drupal `<time>` elements occasionally render "Wed, 04/15/2026 - 12:00"
// (UCLA Anderson) where the " - " confuses V8; stripping it lets the
// MM/DD/YYYY parser take over.

const SOURCE_TZ = "America/Los_Angeles";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

interface WallClock {
  y: number;
  mo: number; // 1-12
  d: number;
  h: number;
  mi: number;
  s: number;
}

const num = (v: string | undefined, fallback = 0): number =>
  v === undefined ? fallback : Number(v);

// Reject out-of-range fields instead of letting Date.UTC (or the Date.parse
// fallback — V8 rolls "Feb 30, 2026" to Mar 2 as well) roll them over: a
// day-first "15/04/2026" must not silently become a wrong future instant and
// pin the article to the top of the newest-first feed.
function isValidWallClock(w: WallClock): boolean {
  if (w.mo < 1 || w.mo > 12 || w.d < 1 || w.h > 23 || w.mi > 59 || w.s > 59) return false;
  // Round-trip through Date.UTC to catch day overflow per month (Feb 30, Apr 31).
  const t = new Date(Date.UTC(w.y, w.mo - 1, w.d));
  return t.getUTCMonth() === w.mo - 1 && t.getUTCDate() === w.d;
}

// Does the string carry an explicit timezone we should trust as-is?
function hasExplicitZone(s: string): boolean {
  return (
    /[+-]\d{2}:?\d{2}$/.test(s) || // numeric offset, e.g. -07:00 / +0000
    /\dZ$/i.test(s) || // ISO Z suffix
    /\b(?:UT|UTC|GMT|[ECMP][SD]T)\b/i.test(s) // RFC 2822 / US named zones
  );
}

function parseIso(s: string): WallClock | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: num(m[4]), mi: num(m[5]), s: num(m[6]) };
}

function parseUsSlash(s: string): WallClock | null {
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  return { y: +m[3], mo: +m[1], d: +m[2], h: num(m[4]), mi: num(m[5]), s: 0 };
}

function parseLongMonth(s: string): WallClock | null {
  const m = s.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const mo = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  if (mo < 0) return null;
  return { y: +m[3], mo: mo + 1, d: +m[2], h: 0, mi: 0, s: 0 };
}

function parseWallClock(s: string): WallClock | null {
  return parseIso(s) ?? parseUsSlash(s) ?? parseLongMonth(s);
}

// Offset (ms) of `timeZone` from UTC at a given instant: (wall clock in zone) - UTC.
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - instant;
}

// Interpret a wall-clock time as occurring in SOURCE_TZ, returning the UTC ms.
function pacificWallClockToUtc(w: WallClock): number {
  const naive = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
  const guess = zoneOffsetMs(naive, SOURCE_TZ);
  // Re-resolve once so DST boundaries land on the correct side.
  return naive - zoneOffsetMs(naive - guess, SOURCE_TZ);
}

export function toIsoDate(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/\s+-\s+/, " ").trim();
  if (!hasExplicitZone(cleaned)) {
    const wall = parseWallClock(cleaned);
    if (wall) {
      // A recognized shape with impossible fields is garbage, not a date —
      // return "" rather than fall through to Date.parse, which would roll
      // it over into a wrong (often future) instant.
      if (!isValidWallClock(wall)) return "";
      const t = pacificWallClockToUtc(wall);
      return Number.isFinite(t) ? new Date(t).toISOString() : "";
    }
  }
  const t = Date.parse(cleaned);
  return Number.isFinite(t) ? new Date(t).toISOString() : "";
}
