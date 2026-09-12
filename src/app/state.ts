import type { BorderTreatmentId, GoldTreatmentId, Locale, PaletteId, PatternMatrix, PatternProposal, PatternRecipe, WeaveMode, WishAnalysis } from "../core/types";

export type AppPhase = "input" | "analyzing" | "plan-selection" | "pattern-coding" | "role-selection" | "weaving" | "result-rendering" | "result";

export interface AppState {
  phase: AppPhase;
  locale: Locale;
  wishInput: string;
  wish: string;
  error: string;
  analysis?: WishAnalysis;
  proposals: PatternProposal[];
  selectedCandidate: number;
  planChosen: boolean;
  selectedPalette: PaletteId;
  colourChosen: boolean;
  weaveMode: WeaveMode;
  recipe?: PatternRecipe;
  matrix?: PatternMatrix;
  completedRows: number;
  committingRow?: number;
  qrUrl: string;
  qrDataUrl: string;
}

export type AppAction =
  | { type: "SET_LOCALE"; locale: Locale }
  | { type: "SET_INPUT"; value: string }
  | { type: "SET_ERROR"; error: string }
  | { type: "START_ANALYSIS"; wish: string; analysis: WishAnalysis; proposals: PatternProposal[]; recipe: PatternRecipe; matrix: PatternMatrix }
  | { type: "OPEN_PLAN_SELECTION" }
  | { type: "SELECT_PLAN"; index: number; recipe: PatternRecipe; matrix: PatternMatrix }
  | { type: "SELECT_PALETTE"; palette: PaletteId; recipe: PatternRecipe; matrix: PatternMatrix }
  | { type: "CONFIRM_PLAN" }
  | { type: "COMPLETE_PATTERN_CODING" }
  | { type: "SET_GOLD_TREATMENT"; treatment: GoldTreatmentId }
  | { type: "SET_BORDER_TREATMENT"; treatment: BorderTreatmentId }
  | { type: "SET_WEAVE_MODE"; mode: WeaveMode }
  | { type: "START_WEAVING" }
  | { type: "START_ROW"; row: number }
  | { type: "COMMIT_ROW" }
  | { type: "START_RESULT" }
  | { type: "RESULT_READY"; qrUrl: string; qrDataUrl: string }
  | { type: "RESET" };

export const initialState: AppState = {
  phase: "input",
  locale: "zh",
  wishInput: "",
  wish: "",
  error: "",
  proposals: [],
  selectedCandidate: 0,
  planChosen: false,
  selectedPalette: "indigo-gold",
  colourChosen: false,
  weaveMode: "player-weaver",
  completedRows: 0,
  qrUrl: "",
  qrDataUrl: "",
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOCALE": return { ...state, locale: action.locale, error: "" };
    case "SET_INPUT": return { ...state, wishInput: action.value, error: "" };
    case "SET_ERROR": return { ...state, error: action.error };
    case "START_ANALYSIS":
      return {
        ...state,
        phase: "analyzing",
        wish: action.wish,
        wishInput: action.wish,
        analysis: action.analysis,
        proposals: action.proposals,
        selectedCandidate: 0,
        planChosen: false,
        selectedPalette: action.recipe.palette,
        colourChosen: false,
        recipe: action.recipe,
        matrix: action.matrix,
        completedRows: 0,
        committingRow: undefined,
        error: "",
      };
    case "OPEN_PLAN_SELECTION": return { ...state, phase: "plan-selection" };
    case "SELECT_PLAN":
      return { ...state, selectedCandidate: action.index, planChosen: true, recipe: action.recipe, matrix: action.matrix };
    case "SELECT_PALETTE":
      return { ...state, selectedPalette: action.palette, colourChosen: true, recipe: action.recipe, matrix: action.matrix };
    case "CONFIRM_PLAN": return state.planChosen ? { ...state, phase: "pattern-coding" } : state;
    case "COMPLETE_PATTERN_CODING": return state.phase === "pattern-coding" ? { ...state, phase: "role-selection" } : state;
    case "SET_GOLD_TREATMENT":
      return state.recipe ? { ...state, recipe: { ...state.recipe, goldTreatment: action.treatment } } : state;
    case "SET_BORDER_TREATMENT":
      return state.recipe ? { ...state, recipe: { ...state.recipe, borderTreatment: action.treatment } } : state;
    case "SET_WEAVE_MODE": return { ...state, weaveMode: action.mode };
    case "START_WEAVING": return { ...state, phase: "weaving" };
    case "START_ROW": {
      const awaitingChoice = (state.completedRows === 6 && !state.colourChosen)
        || (state.completedRows === 12 && !state.recipe?.goldTreatment)
        || (state.completedRows === 18 && !state.recipe?.borderTreatment);
      return !awaitingChoice && state.committingRow === undefined && state.completedRows < 24
        ? { ...state, committingRow: action.row }
        : state;
    }
    case "COMMIT_ROW": return { ...state, completedRows: Math.min(24, state.completedRows + 1), committingRow: undefined };
    case "START_RESULT": return { ...state, phase: "result-rendering", committingRow: undefined };
    case "RESULT_READY": return { ...state, phase: "result", qrUrl: action.qrUrl, qrDataUrl: action.qrDataUrl };
    case "RESET": return { ...initialState, locale: state.locale };
    default: return state;
  }
}
