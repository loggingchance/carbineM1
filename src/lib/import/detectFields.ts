import { fieldSynonyms, normalizeImportToken, standardInventoryFields, type StandardInventoryField } from "./fieldSynonyms";

export interface MappingSuggestion {
  carbineField: StandardInventoryField;
  sourceField: string;
  confidence: number;
  reason: string;
}

export type ConfirmedMappings = Partial<Record<StandardInventoryField, string>>;

export function detectFieldMappings(headers: string[]): MappingSuggestion[] {
  return standardInventoryFields.flatMap((field) => {
    const ranked = headers
      .map((header) => scoreHeader(field, header))
      .filter((suggestion): suggestion is MappingSuggestion => suggestion.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence);
    if (ranked.length === 0) return [];
    const [best, second] = ranked;
    if (second && best.confidence - second.confidence < 0.15) return [];
    return best.confidence >= 0.7 ? [best] : [];
  });
}

export function suggestionsToMappings(suggestions: MappingSuggestion[]): ConfirmedMappings {
  return Object.fromEntries(suggestions.map((suggestion) => [suggestion.carbineField, suggestion.sourceField]));
}

function scoreHeader(field: StandardInventoryField, header: string): MappingSuggestion {
  const normalizedHeader = normalizeImportToken(header);
  if (normalizedHeader === field) {
    return { carbineField: field, sourceField: header, confidence: 1, reason: "exact match" };
  }
  if (fieldSynonyms[field].includes(normalizedHeader)) {
    return { carbineField: field, sourceField: header, confidence: 0.9, reason: "known synonym" };
  }
  const compactHeader = normalizedHeader.replace(/_/g, "");
  const compactField = field.replace(/_/g, "");
  if (compactHeader === compactField) {
    return { carbineField: field, sourceField: header, confidence: 0.85, reason: "punctuation-insensitive match" };
  }
  if (normalizedHeader.includes(field) || fieldSynonyms[field].some((synonym) => normalizedHeader.includes(synonym))) {
    return { carbineField: field, sourceField: header, confidence: 0.7, reason: "contains match" };
  }
  return { carbineField: field, sourceField: header, confidence: 0, reason: "no match" };
}
