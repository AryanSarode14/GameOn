export const SPORTS = [
  "basketball",
  "soccer",
  "tennis",
  "volleyball",
  "pickleball",
];
export const SKILLS = ["beginner", "intermediate", "advanced"];

export const COURTS = [
  { court: "Carter Playground", neighborhood: "South End", sports: ["tennis"] },
  {
    court: "Titus Sparrow Park",
    neighborhood: "South End",
    sports: ["basketball", "tennis"],
  },
  {
    court: "Peters Park",
    neighborhood: "South End",
    sports: ["basketball", "tennis", "pickleball"],
  },
  { court: "Malcolm X Park", neighborhood: "Roxbury", sports: ["basketball"] },
  { court: "Ringer Park", neighborhood: "Allston", sports: ["basketball"] },
  {
    court: "Joe Moakley Park",
    neighborhood: "South Boston",
    sports: ["basketball", "soccer", "tennis", "pickleball"],
  },
  {
    court: "Carson Beach",
    neighborhood: "South Boston",
    sports: ["volleyball"],
  },
  {
    court: "Northeastern Sand Volleyball Court",
    neighborhood: "Fenway",
    sports: ["volleyball"],
  },
  {
    court: "Boston Common Tennis Courts",
    neighborhood: "Downtown",
    sports: ["tennis", "pickleball"],
  },
  {
    court: "East Boston Memorial Park",
    neighborhood: "East Boston",
    sports: ["tennis", "pickleball"],
  },
  { court: "LoPresti Park", neighborhood: "East Boston", sports: ["soccer"] },
  {
    court: "South Street Courts",
    neighborhood: "Jamaica Plain",
    sports: ["pickleball"],
  },
  {
    court: "Moynihan Recreation Area",
    neighborhood: "Hyde Park",
    sports: ["pickleball"],
  },
];

export const NEIGHBORHOODS = [...new Set(COURTS.map((c) => c.neighborhood))];
