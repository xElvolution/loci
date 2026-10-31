/**
 * Comfort filters a person or clinician ticks. loci never infers any of these from a
 * specialty or a check-in. Each maps to a Qloo place tag that Qloo can actually filter
 * on, or to a local rule we apply after Qloo answers.
 */
export type FilterGroup = "food" | "service" | "outing" | "media";
export type ComfortFilter = { id: string; label: string; group: FilterGroup; tag?: string; local?: "no_alcohol" | "kid_safe" };

export const COMFORT_FILTERS: ComfortFilter[] = [
  { id: "vegetarian", label: "Vegetarian", group: "food", tag: "urn:tag:dietary_option:qloo:vegetarian" },
  { id: "vegan", label: "Vegan", group: "food", tag: "urn:tag:dietary_option:qloo:vegan" },
  { id: "halal", label: "Halal", group: "food", tag: "urn:tag:dietary_option:qloo:halal" },
  { id: "kosher", label: "Kosher", group: "food", tag: "urn:tag:dietary_option:qloo:kosher" },
  { id: "gluten_free", label: "Gluten free options", group: "food", tag: "urn:tag:dietary_option:qloo:gluten_free" },
  { id: "dairy_free", label: "Dairy free options", group: "food", tag: "urn:tag:dietary_option:qloo:dairy_free" },
  { id: "soups", label: "Soups and broths", group: "food", tag: "urn:tag:genre:place:restaurant:soup" },
  { id: "delivery", label: "Delivers to home", group: "service", tag: "urn:tag:service_options:place:delivery" },
  { id: "takeout", label: "Takeout", group: "service", tag: "urn:tag:service_options:place:takeout" },
  { id: "no_alcohol", label: "Skip bars and pubs", group: "service", local: "no_alcohol" },
  { id: "step_free", label: "Step-free entrance", group: "outing", tag: "urn:tag:accessibility:place:wheelchair_accessible_entrance" },
  { id: "quiet", label: "Quiet places", group: "outing", tag: "urn:tag:ambience:qloo:quiet" },
  { id: "kid_safe", label: "Family-rated shows and films", group: "media", local: "kid_safe" },
];

export const FILTER_GROUP_LABEL: Record<FilterGroup, string> = {
  food: "Food",
  service: "How it arrives",
  outing: "Outings",
  media: "Screen time",
};

export function cleanFilters(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const known = new Set(COMFORT_FILTERS.map((f) => f.id));
  return [...new Set(ids.filter((x): x is string => typeof x === "string" && known.has(x)))];
}

export function tagsFor(ids: string[], group: FilterGroup | FilterGroup[]): string[] {
  const groups = Array.isArray(group) ? group : [group];
  return COMFORT_FILTERS.filter((f) => ids.includes(f.id) && groups.includes(f.group) && f.tag).map((f) => f.tag as string);
}

const ADULT_PLACE = /\b(bar|pub|nightclub|night club|lounge|liquor|brewery|wine|cocktail|casino|tavern|beer|taproom|saloon)\b/i;
export function looksLikeBar(text: string): boolean {
  return ADULT_PLACE.test(text);
}
