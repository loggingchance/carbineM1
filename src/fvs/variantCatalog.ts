export interface FvsVariant {
  code: string;
  name: string;
  states: string[];
  defaultState?: string;
  defaultForestLocationCode: number;
  defaultSiteSpeciesCode: number;
  defaultSiteIndex: number;
  notes: string;
}

export function isVerifiedVariant(code: string): boolean {
  return variantCatalog.some((variant) => variant.code === code.trim().toUpperCase());
}

export const variantCatalog: FvsVariant[] = [
  {
    code: "AK",
    name: "Alaska",
    states: ["AK"],
    defaultState: "AK",
    defaultForestLocationCode: 1005,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSak."
  },
  {
    code: "BC",
    name: "British Columbia",
    states: [],
    defaultForestLocationCode: 1,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSbc."
  },
  {
    code: "BM",
    name: "Blue Mountains",
    states: ["OR", "WA"],
    defaultState: "OR",
    defaultForestLocationCode: 614,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSbm."
  },
  {
    code: "CA",
    name: "California",
    states: ["CA"],
    defaultState: "CA",
    defaultForestLocationCode: 610,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSca."
  },
  {
    code: "CI",
    name: "Central Idaho",
    states: ["ID"],
    defaultState: "ID",
    defaultForestLocationCode: 412,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSci."
  },
  {
    code: "CR",
    name: "Central Rockies",
    states: ["CO", "KS", "NE", "SD", "WY"],
    defaultState: "CO",
    defaultForestLocationCode: 303,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVScr."
  },
  {
    code: "CS",
    name: "Central States",
    states: ["IA", "IL", "IN", "MO"],
    defaultState: "MO",
    defaultForestLocationCode: 905,
    defaultSiteSpeciesCode: 19,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVScs."
  },
  {
    code: "EC",
    name: "East Cascades",
    states: ["OR", "WA"],
    defaultState: "OR",
    defaultForestLocationCode: 608,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSec."
  },
  {
    code: "EM",
    name: "Eastern Montana",
    states: ["MT", "ND"],
    defaultState: "MT",
    defaultForestLocationCode: 112,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSem."
  },
  {
    code: "IE",
    name: "Inland Empire",
    states: ["ID", "MT", "WA"],
    defaultState: "ID",
    defaultForestLocationCode: 118,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSie."
  },
  {
    code: "KT",
    name: "Kootenai",
    states: ["ID", "MT"],
    defaultState: "MT",
    defaultForestLocationCode: 11406001,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSkt."
  },
  {
    code: "LS",
    name: "Lake States",
    states: ["MI", "MN", "WI"],
    defaultState: "WI",
    defaultForestLocationCode: 903,
    defaultSiteSpeciesCode: 2,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSls."
  },
  {
    code: "NC",
    name: "North Central",
    states: ["IA", "IL", "IN", "MO"],
    defaultState: "MO",
    defaultForestLocationCode: 505,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSnc."
  },
  {
    code: "NE",
    name: "Northeast",
    states: ["CT", "DE", "MA", "MD", "ME", "NH", "NJ", "NY", "OH", "PA", "RI", "VT", "WV"],
    defaultState: "VT",
    defaultForestLocationCode: 922,
    defaultSiteSpeciesCode: 13,
    defaultSiteIndex: 56,
    notes: "Official FVS source variant FVSne."
  },
  {
    code: "OC",
    name: "Oregon Cascades",
    states: ["OR", "WA"],
    defaultState: "OR",
    defaultForestLocationCode: 711,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSoc."
  },
  {
    code: "ON",
    name: "Ontario",
    states: [],
    defaultForestLocationCode: 1,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSon."
  },
  {
    code: "OP",
    name: "Olympic Peninsula",
    states: ["WA"],
    defaultState: "WA",
    defaultForestLocationCode: 708,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSop."
  },
  {
    code: "PN",
    name: "Pacific Northwest",
    states: ["OR", "WA"],
    defaultState: "OR",
    defaultForestLocationCode: 612,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSpn."
  },
  {
    code: "SN",
    name: "Southern",
    states: ["AL", "AR", "FL", "GA", "LA", "MS", "NC", "OK", "SC", "TN", "TX", "VA"],
    defaultState: "VA",
    defaultForestLocationCode: 801,
    defaultSiteSpeciesCode: 63,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSsn."
  },
  {
    code: "SO",
    name: "South Central Oregon / Southwest Oregon",
    states: ["CA", "OR"],
    defaultState: "OR",
    defaultForestLocationCode: 620,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSso."
  },
  {
    code: "TT",
    name: "Tetons",
    states: ["ID", "UT", "WY"],
    defaultState: "WY",
    defaultForestLocationCode: 415,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVStt."
  },
  {
    code: "UT",
    name: "Utah",
    states: ["AZ", "CO", "NV", "UT"],
    defaultState: "UT",
    defaultForestLocationCode: 407,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSut."
  },
  {
    code: "WC",
    name: "West Cascades",
    states: ["OR", "WA"],
    defaultState: "OR",
    defaultForestLocationCode: 618,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSwc."
  },
  {
    code: "WS",
    name: "Western Sierra",
    states: ["CA", "NV"],
    defaultState: "CA",
    defaultForestLocationCode: 511,
    defaultSiteSpeciesCode: 1,
    defaultSiteIndex: 60,
    notes: "Official FVS source variant FVSws."
  }
];

export function suggestVariantForState(state: string): FvsVariant | undefined {
  const normalized = state.trim().toUpperCase();
  return variantCatalog.find((variant) => variant.states.includes(normalized));
}

export function getVariantByCode(code: string): FvsVariant | undefined {
  const normalized = code.trim().toUpperCase();
  return variantCatalog.find((variant) => variant.code === normalized);
}

export function applyVariantDefaults<T extends { state: string; forestLocationCode: number; siteSpeciesCode: number; siteIndex: number; fvsVariant: string }>(
  project: T,
  variantCode: string
): T {
  const variant = getVariantByCode(variantCode);
  if (!variant) return { ...project, fvsVariant: variantCode.trim().toUpperCase() };
  return {
    ...project,
    fvsVariant: variant.code,
    state: variant.defaultState ?? project.state,
    forestLocationCode: variant.defaultForestLocationCode,
    siteSpeciesCode: variant.defaultSiteSpeciesCode,
    siteIndex: variant.defaultSiteIndex
  };
}
