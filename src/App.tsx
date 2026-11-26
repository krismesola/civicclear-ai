import { useRef, useState } from 'react';
import { CivicHeader } from './components/CivicHeader';
import { InputWorkspace } from './components/InputWorkspace';
import { OutputDashboard } from './components/OutputDashboard';
import { POLICY_PRESETS } from './data/presets';
import type {
  LanguageOption,
  PolicyAnalysisResult,
  PolicyPreset,
} from './types/civic';

function formatChecklistText(
  result: PolicyAnalysisResult,
  language: LanguageOption
): string {
  const langLabel =
    language === 'bisaya_tagalog'
      ? 'Conversational Bisaya / Tagalog'
      : 'Plain English';
  const lines: string[] = [
    `CivicClear AI — ${result.documentTitle}`,
    `Language: ${langLabel}`,
    '',
    'PLAIN-LANGUAGE SUMMARY',
    result.plainLanguageSummary,
    '',
    'KEY RULES & CITIZEN OBLIGATIONS',
    ...result.keyRulesAndObligations.map((r) => `• ${r}`),
    '',
    'DEADLINES, FEES & DOCUMENTARY REQUIREMENTS',
    `Deadlines: ${result.deadlinesFeesRequirements.deadlines.join('; ')}`,
    `Fees & Penalties: ${result.deadlinesFeesRequirements.feesAndPenalties.join('; ')}`,
    `Documentary Requirements: ${result.deadlinesFeesRequirements.documentaryRequirements.join('; ')}`,
    '',
    'STEP-BY-STEP NEXT ACTIONS',
    ...result.stepByStepActions.map((s, i) => `${i + 1}. [ ] ${s}`),
    '',
    'OFFICIAL VERIFICATION REMINDER',
    result.officialVerificationReminder,
  ];
  return lines.join('\n');
}

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageOption>('english');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<PolicyAnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const resultCacheRef = useRef<Map<string, PolicyAnalysisResult>>(new Map());

  const handleSelectPreset = (preset: PolicyPreset) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.text);
    setValidationError(null);
    setApiError(null);
  };

  const handleChangeText = (value: string) => {
    setInputText(value);
    if (selectedPresetId) {
      const currentPreset = POLICY_PRESETS.find((p) => p.id === selectedPresetId);
      if (currentPreset && currentPreset.text !== value) {
        setSelectedPresetId(null);
      }
    }
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleAnalyze = async (targetLanguage: LanguageOption = language) => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setValidationError(
        'Please paste a local ordinance, barangay notice, or select a sample policy preset before translating.'
      );
      return;
    }
    if (trimmed.length < 10) {
      setValidationError(
        'Please enter a complete policy excerpt or notice (at least 10 characters) so we can summarize it accurately.'
      );
      return;
    }

    const cacheKey = `${targetLanguage}::${trimmed}`;
    const cached = resultCacheRef.current.get(cacheKey);
    if (cached) {
      setValidationError(null);
      setApiError(null);
      setResult(cached);
      setCheckedSteps({});
      setCopied(false);
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    setCopied(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          language: targetLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setApiError(
          data?.error ||
            'Unable to process your request right now. Please try again.'
        );
        setResult(null);
        return;
      }

      const parsed = data as PolicyAnalysisResult;
      resultCacheRef.current.set(cacheKey, parsed);
      setResult(parsed);
      setCheckedSteps({});
    } catch {
      setApiError(
        'Network connection error while reaching the policy analysis service. Please check your connection and try again.'
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeLanguage = (nextLang: LanguageOption) => {
    setLanguage(nextLang);
  };

  const handleReset = () => {
    setInputText('');
    setSelectedPresetId(null);
    setValidationError(null);
    setApiError(null);
    setResult(null);
    setCopied(false);
    setCheckedSteps({});
  };

  const handleToggleStep = (index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopyChecklist = async () => {
    if (!result || !result.inScope) return;
    const formatted = formatChecklistText(result, language);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy method if clipboard permission is restricted in iframe
      const textarea = document.createElement('textarea');
      textarea.value = formatted;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#D6D7D5] text-[#132D42] flex flex-col">
      <CivicHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <InputWorkspace
              presets={POLICY_PRESETS}
              selectedPresetId={selectedPresetId}
              inputText={inputText}
              language={language}
              isLoading={isLoading}
              validationError={validationError}
              onSelectPreset={handleSelectPreset}
              onChangeText={handleChangeText}
              onChangeLanguage={handleChangeLanguage}
              onSubmit={() => void handleAnalyze(language)}
              onReset={handleReset}
            />
          </div>

          <div className="lg:col-span-7">
            <OutputDashboard
              result={result}
              language={language}
              isLoading={isLoading}
              apiError={apiError}
              copied={copied}
              checkedSteps={checkedSteps}
              onToggleStep={handleToggleStep}
              onCopyChecklist={() => void handleCopyChecklist()}
              onReset={handleReset}
              onRetry={() => void handleAnalyze(language)}
            />
          </div>
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <p className="text-xs text-[#59616B] text-center">
          CivicClear AI · Empowering transparent, accessible local governance aligned with UN SDG 16.
        </p>
      </footer>
    </div>
  );
}
