export interface FvsVariant {
  code: string;
  name: string;
  states: string[];
  notes: string;
}

export const verifiedVariantCodes = ["NE"] as const;

export function isVerifiedVariant(code: string): boolean {
  return verifiedVariantCodes.includes(code.trim().toUpperCase() as (typeof verifiedVariantCodes)[number]);
}

export const variantCatalog: FvsVariant[] = [
  {
    code: "AK",
    name: "Alaska",
    states: ["AK"],
    notes: "Official FVS source variant FVSak."
  },
  {
    code: "BC",
    name: "British Columbia",
    states: [],
    notes: "Official FVS source variant FVSbc."
  },
  {
    code: "BM",
    name: "Blue Mountains",
    states: ["OR", "WA"],
    notes: "Official FVS source variant FVSbm."
  },
  {
    code: "CA",
    name: "California",
    states: ["CA"],
    notes: "Official FVS source variant FVSca."
  },
  {
    code: "CI",
    name: "Central Idaho",
    states: ["ID"],
    notes: "Official FVS source variant FVSci."
  },
  {
    code: "CR",
    name: "Central Rockies",
    states: ["CO", "KS", "NE", "SD", "WY"],
    notes: "Official FVS source variant FVScr."
  },
  {
    code: "CS",
    name: "Central States",
    states: ["IA", "IL", "IN", "MO"],
    notes: "Official FVS source variant FVScs."
  },
  {
    code: "EC",
    name: "East Cascades",
    states: ["OR", "WA"],
    notes: "Official FVS source variant FVSec."
  },
  {
    code: "EM",
    name: "Eastern Montana",
    states: ["MT", "ND"],
    notes: "Official FVS source variant FVSem."
  },
  {
    code: "IE",
    name: "Inland Empire",
    states: ["ID", "MT", "WA"],
    notes: "Official FVS source variant FVSie."
  },
  {
    code: "KT",
    name: "Kootenai",
    states: ["ID", "MT"],
    notes: "Official FVS source variant FVSkt."
  },
  {
    code: "LS",
    name: "Lake States",
    states: ["MI", "MN", "WI"],
    notes: "Official FVS source variant FVSls."
  },
  {
    code: "NC",
    name: "North Central",
    states: ["IA", "IL", "IN", "MO"],
    notes: "Official FVS source variant FVSnc."
  },
  {
    code: "NE",
    name: "Northeast",
    states: ["CT", "DE", "MA", "MD", "ME", "NH", "NJ", "NY", "OH", "PA", "RI", "VT", "WV"],
    notes: "Official FVS source variant FVSne."
  },
  {
    code: "OC",
    name: "Oregon Cascades",
    states: ["OR", "WA"],
    notes: "Official FVS source variant FVSoc."
  },
  {
    code: "ON",
    name: "Ontario",
    states: [],
    notes: "Official FVS source variant FVSon."
  },
  {
    code: "OP",
    name: "Olympic Peninsula",
    states: ["WA"],
    notes: "Official FVS source variant FVSop."
  },
  {
    code: "PN",
    name: "Pacific Northwest",
    states: ["OR", "WA"],
    notes: "Official FVS source variant FVSpn."
  },
  {
    code: "SN",
    name: "Southern",
    states: ["AL", "AR", "FL", "GA", "LA", "MS", "NC", "OK", "SC", "TN", "TX", "VA"],
    notes: "Official FVS source variant FVSsn."
  },
  {
    code: "SO",
    name: "South Central Oregon / Southwest Oregon",
    states: ["CA", "OR"],
    notes: "Official FVS source variant FVSso."
  },
  {
    code: "TT",
    name: "Tetons",
    states: ["ID", "UT", "WY"],
    notes: "Official FVS source variant FVStt."
  },
  {
    code: "UT",
    name: "Utah",
    states: ["AZ", "CO", "NV", "UT"],
    notes: "Official FVS source variant FVSut."
  },
  {
    code: "WC",
    name: "West Cascades",
    states: ["OR", "WA"],
    notes: "Official FVS source variant FVSwc."
  },
  {
    code: "WS",
    name: "Western Sierra",
    states: ["CA", "NV"],
    notes: "Official FVS source variant FVSws."
  }
];

export function suggestVariantForState(state: string): FvsVariant | undefined {
  const normalized = state.trim().toUpperCase();
  return variantCatalog.find((variant) => variant.states.includes(normalized));
}
