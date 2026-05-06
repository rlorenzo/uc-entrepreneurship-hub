import type { Program } from "@/data/types";
import { CAMPUS_BY_ID } from "@/data/campuses";
import { TYPE_BY_ID } from "@/data/types-list";

export function programGradient(p: Program): string {
  const tColor = TYPE_BY_ID[p.type]?.color ?? "#1295D8";
  const cColor = CAMPUS_BY_ID[p.campus]?.color ?? "#002033";
  return `linear-gradient(135deg, ${cColor} 0%, ${tColor} 100%)`;
}
