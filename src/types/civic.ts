export type LanguageOption = 'english' | 'bisaya_tagalog';

export interface PolicyPreset {
  id: string;
  label: string;
  category: string;
  jurisdiction: string;
  text: string;
}

export interface DeadlinesFeesRequirements {
  deadlines: string[];
  feesAndPenalties: string[];
  documentaryRequirements: string[];
}

export interface PolicyAnalysisResult {
  inScope: boolean;
  refusalMessage?: string;
  documentTitle: string;
  plainLanguageSummary: string;
  keyRulesAndObligations: string[];
  deadlinesFeesRequirements: DeadlinesFeesRequirements;
  stepByStepActions: string[];
  officialVerificationReminder: string;
}
