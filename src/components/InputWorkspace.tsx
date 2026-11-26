import { FileText, Languages, RotateCcw, Send, AlertCircle } from 'lucide-react';
import type { LanguageOption, PolicyPreset } from '../types/civic';

interface InputWorkspaceProps {
  presets: PolicyPreset[];
  selectedPresetId: string | null;
  inputText: string;
  language: LanguageOption;
  isLoading: boolean;
  validationError: string | null;
  onSelectPreset: (preset: PolicyPreset) => void;
  onChangeText: (value: string) => void;
  onChangeLanguage: (language: LanguageOption) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function InputWorkspace({
  presets,
  selectedPresetId,
  inputText,
  language,
  isLoading,
  validationError,
  onSelectPreset,
  onChangeText,
  onChangeLanguage,
  onSubmit,
  onReset,
}: InputWorkspaceProps) {
  const charCount = inputText.length;

  return (
    <section
      aria-label="Policy input workspace"
      className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm p-6 sm:p-7 flex flex-col gap-6"
    >
      {/* Sample Philippine Policy Presets */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-[#132D42] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6C879D]" aria-hidden="true" />
            <span>Sample Philippine Policies</span>
          </h2>
          <span className="text-xs text-[#59616B]">One-click load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((preset) => {
            const isActive = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                disabled={isLoading}
                className={`w-full min-w-0 px-3.5 py-2.5 rounded-full text-xs sm:text-[13px] font-medium leading-snug text-center transition-colors border cursor-pointer disabled:opacity-60 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#6C879D] text-white border-[#6C879D] shadow-xs'
                    : 'bg-[#93AEB9]/15 text-[#132D42] border-[#93AEB9]/45 hover:bg-[#93AEB9]/30'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textarea Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="policy-text-input"
            className="text-sm font-semibold text-[#132D42]"
          >
            Ordinance, Barangay Notice, or Policy Text
          </label>
          <span className="text-xs font-mono tabular-nums text-[#59616B]">
            {charCount.toLocaleString()} / 15,000 chars
          </span>
        </div>

        <textarea
          id="policy-text-input"
          value={inputText}
          onChange={(e) => onChangeText(e.target.value)}
          disabled={isLoading}
          rows={11}
          maxLength={15000}
          placeholder="Paste a local ordinance, barangay advisory, permit renewal notice, or community procedure here..."
          className="w-full rounded-2xl border border-[#93AEB9]/55 bg-[#F8FAFB] px-4 py-3.5 text-sm sm:text-[15px] leading-relaxed text-[#132D42] placeholder:text-[#59616B]/70 focus:bg-white focus:border-[#132D42] focus:outline-none transition-colors resize-y min-h-[240px] disabled:opacity-60"
        />

        {validationError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl bg-[#93AEB9]/20 border border-[#6C879D]/50 px-4 py-3 text-sm text-[#132D42]"
          >
            <AlertCircle className="w-4 h-4 text-[#132D42] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Language & Clarity Selector */}
      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold text-[#132D42] flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#6C879D]" aria-hidden="true" />
          <span>Language &amp; Clarity Mode</span>
        </span>

        <div
          role="radiogroup"
          aria-label="Output language"
          className="flex flex-col sm:flex-row items-stretch gap-1.5 p-1.5 rounded-2xl bg-[#D6D7D5]/45 border border-[#93AEB9]/35"
        >
          <button
            type="button"
            role="radio"
            aria-checked={language === 'english'}
            onClick={() => onChangeLanguage('english')}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-medium leading-snug text-center transition-all cursor-pointer disabled:opacity-60 sm:shrink-0 ${
              language === 'english'
                ? 'bg-[#6C879D] text-white shadow-xs'
                : 'text-[#47505A] hover:text-[#132D42] hover:bg-white/60'
            }`}
          >
            Plain English
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={language === 'bisaya_tagalog'}
            onClick={() => onChangeLanguage('bisaya_tagalog')}
            disabled={isLoading}
            className={`flex-1 min-w-0 px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-medium leading-snug text-center transition-all cursor-pointer disabled:opacity-60 ${
              language === 'bisaya_tagalog'
                ? 'bg-[#6C879D] text-white shadow-xs'
                : 'text-[#47505A] hover:text-[#132D42] hover:bg-white/60'
            }`}
          >
            Conversational Bisaya / Tagalog
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#132D42] text-white text-sm font-semibold hover:bg-[#1b3d59] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
        >
          {isLoading ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                aria-hidden="true"
              />
              <span>Translating Policy...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Translate Policy</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={isLoading && !inputText}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white border border-[#93AEB9] text-[#47505A] text-sm font-medium hover:bg-[#93AEB9]/15 hover:text-[#132D42] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Clear / New Query</span>
        </button>
      </div>
    </section>
  );
}
