import { useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileCheck2,
  Info,
  ListChecks,
  Printer,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { LanguageOption, PolicyAnalysisResult } from '../types/civic';

interface OutputDashboardProps {
  result: PolicyAnalysisResult | null;
  language: LanguageOption;
  isLoading: boolean;
  apiError: string | null;
  copied: boolean;
  checkedSteps: Record<number, boolean>;
  onToggleStep: (index: number) => void;
  onCopyChecklist: () => void;
  onReset: () => void;
  onRetry: () => void;
}

function isNoneSpecified(items: string[] | undefined): boolean {
  if (!items || items.length === 0) return true;
  return (
    items.length === 1 &&
    items[0].toLowerCase().trim().startsWith('none specified')
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintableHtml(
  result: PolicyAnalysisResult,
  language: LanguageOption,
  checkedSteps: Record<number, boolean>
): string {
  const langLabel =
    language === 'bisaya_tagalog'
      ? 'Conversational Bisaya / Tagalog'
      : 'Plain English';
  const title = result.documentTitle || 'Policy Breakdown';

  const renderListItems = (items: string[] | undefined, fallback = 'None specified') => {
    if (!items || items.length === 0) {
      return `<p class="muted">${escapeHtml(fallback)}</p>`;
    }
    if (isNoneSpecified(items)) {
      return `<p class="muted">None specified</p>`;
    }
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  };

  const rulesHtml =
    result.keyRulesAndObligations.length > 0
      ? `<ul>${result.keyRulesAndObligations
          .map((rule) => `<li>${escapeHtml(rule)}</li>`)
          .join('')}</ul>`
      : '<p class="muted">None specified</p>';

  const stepsHtml =
    result.stepByStepActions.length > 0
      ? `<ol class="steps">${result.stepByStepActions
          .map((step, idx) => {
            const done = Boolean(checkedSteps[idx]);
            const num = String(idx + 1).padStart(2, '0');
            return `<li class="${done ? 'step-done' : ''}">
              <span class="step-badge">${done ? '&#10003;' : num}</span>
              <span class="step-text">${escapeHtml(step)}</span>
            </li>`;
          })
          .join('')}</ol>`
      : '<p class="muted">None specified</p>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} — CivicClear AI</title>
    <style>
      @page { margin: 14mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #132D42;
        background: #ffffff;
        line-height: 1.55;
      }
      .page {
        max-width: 820px;
        margin: 0 auto;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        margin-bottom: 18px;
        border: 1px solid #cbd5e1;
        border-radius: 14px;
        background: #f8fafb;
      }
      .toolbar-note {
        font-size: 13px;
        color: #47505A;
      }
      .print-btn {
        border: none;
        border-radius: 9999px;
        background: #132D42;
        color: #ffffff;
        padding: 9px 18px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .card {
        border: 1px solid #cbd5e1;
        border-radius: 16px;
        padding: 18px 22px;
        margin-bottom: 14px;
        background: #ffffff;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .brand-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .brand-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
      }
      .brand-sub {
        font-size: 13px;
        color: #47505A;
        margin: 2px 0 0 0;
      }
      .pill {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid #8E9E52;
        color: #132D42;
      }
      .doc-title {
        font-size: 19px;
        font-weight: 700;
        margin: 8px 0 0 0;
        line-height: 1.3;
      }
      h3 {
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 10px 0;
        color: #132D42;
      }
      h4 {
        font-size: 12px;
        font-weight: 600;
        color: #59616B;
        margin: 12px 0 6px 0;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      p {
        margin: 0;
        font-size: 14px;
        color: #47505A;
      }
      .muted {
        color: #59616B;
        font-weight: 500;
      }
      ul {
        margin: 0;
        padding-left: 18px;
      }
      li {
        margin-bottom: 6px;
        font-size: 14px;
        color: #47505A;
      }
      .divider {
        border-top: 1px solid #e2e8f0;
        margin-top: 10px;
        padding-top: 10px;
      }
      ol.steps {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      ol.steps li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        margin-bottom: 8px;
      }
      .step-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        padding: 2px 6px;
        border-radius: 9999px;
        border: 1px solid #8E9E52;
        font-size: 11px;
        font-weight: 700;
        color: #132D42;
      }
      .step-done .step-text {
        text-decoration: line-through;
        color: #59616B;
      }
      @media print {
        body { padding: 0; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="toolbar no-print">
        <span class="toolbar-note">CivicClear AI Printable Policy Breakdown — use your browser's Print dialog to print or Save as PDF.</span>
        <button type="button" class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>

      <header class="card">
        <div class="brand-row">
          <div>
            <h1 class="brand-title">CivicClear AI</h1>
            <p class="brand-sub">Plain-Language Ordinance &amp; Policy Navigator</p>
          </div>
          <span class="pill">SDG 16 · Peace, Justice &amp; Strong Institutions</span>
        </div>
      </header>

      <section class="card">
        <span class="pill">${escapeHtml(langLabel)}</span>
        <h2 class="doc-title">${escapeHtml(title)}</h2>
      </section>

      <article class="card">
        <h3>Plain-Language Summary</h3>
        <p>${escapeHtml(result.plainLanguageSummary)}</p>
      </article>

      <article class="card">
        <h3>Key Rules &amp; Citizen Obligations</h3>
        ${rulesHtml}
      </article>

      <article class="card">
        <h3>Deadlines, Fees, or Documentary Requirements</h3>
        <h4>Deadlines &amp; Timeframes</h4>
        ${renderListItems(result.deadlinesFeesRequirements?.deadlines)}
        <div class="divider">
          <h4>Fees, Taxes &amp; Penalties</h4>
          ${renderListItems(result.deadlinesFeesRequirements?.feesAndPenalties)}
        </div>
        <div class="divider">
          <h4>Documentary Requirements</h4>
          ${renderListItems(result.deadlinesFeesRequirements?.documentaryRequirements)}
        </div>
      </article>

      <article class="card">
        <h3>Step-by-Step Next Actions</h3>
        ${stepsHtml}
      </article>

      <aside class="card">
        <h3>Official Verification Reminder</h3>
        <p>${escapeHtml(result.officialVerificationReminder)}</p>
      </aside>
    </main>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          try { window.print(); } catch (e) {}
        }, 250);
      });
    </script>
  </body>
</html>`;
}

export function OutputDashboard({
  result,
  language,
  isLoading,
  apiError,
  copied,
  checkedSteps,
  onToggleStep,
  onCopyChecklist,
  onReset,
  onRetry,
}: OutputDashboardProps) {
  const [downloadedReport, setDownloadedReport] = useState<boolean>(false);

  if (isLoading) {
    return (
      <section
        aria-label="Translating policy"
        aria-busy="true"
        className="flex flex-col gap-4"
      >
        <div className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#93AEB9]/25 flex items-center justify-center shrink-0">
            <span
              className="w-5 h-5 rounded-full border-2 border-[#6C879D]/30 border-t-[#132D42] animate-spin"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#132D42]">
              Simplifying civic language...
            </h2>
            <p className="text-sm text-[#59616B]">
              Extracting obligations, dates, fees, and next steps strictly from your text.
            </p>
          </div>
        </div>

        {[1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="bg-white rounded-3xl border border-[#93AEB9]/35 p-6 animate-pulse"
          >
            <div className="h-4 w-44 bg-[#93AEB9]/30 rounded-full mb-4" />
            <div className="space-y-2.5">
              <div className="h-3.5 w-full bg-[#D6D7D5]/60 rounded-full" />
              <div className="h-3.5 w-11/12 bg-[#D6D7D5]/60 rounded-full" />
              <div className="h-3.5 w-4/5 bg-[#D6D7D5]/60 rounded-full" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (apiError) {
    return (
      <section
        role="alert"
        className="bg-white rounded-3xl border border-[#6C879D]/50 shadow-sm p-6 sm:p-8 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#93AEB9]/25 text-[#132D42] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#132D42]">
              Unable to Complete Translation
            </h2>
            <p className="mt-1 text-sm sm:text-[15px] text-[#47505A] leading-relaxed">
              {apiError}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2.5 rounded-full bg-[#132D42] text-white text-sm font-semibold hover:bg-[#1b3d59] transition-colors cursor-pointer whitespace-nowrap"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-5 py-2.5 rounded-full border border-[#93AEB9] text-[#47505A] text-sm font-medium hover:bg-[#93AEB9]/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear / New Query
          </button>
        </div>
      </section>
    );
  }

  if (result && !result.inScope) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        role="status"
        className="bg-white rounded-3xl border border-[#6C879D]/50 shadow-sm p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#93AEB9]/25 text-[#132D42] flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#93AEB9]/25 text-[#132D42]">
              Civic &amp; Policy Scope Notice
            </span>
            <h2 className="text-xl font-bold text-[#132D42]">
              Outside Civic &amp; Policy Topics
            </h2>
            <p className="text-[15px] text-[#47505A] leading-relaxed max-w-prose">
              {result.refusalMessage ||
                'CivicClear AI is specifically designed to explain local government ordinances, barangay notices, community rules, and public service procedures. Please paste a civic policy document or select one of the sample Philippine presets on the left.'}
            </p>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#132D42] text-white text-sm font-semibold hover:bg-[#1b3d59] transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Clear / New Query</span>
          </button>
        </div>
      </motion.section>
    );
  }

  if (!result) {
    return (
      <section
        aria-label="Output workspace overview"
        className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm p-6 sm:p-8 flex flex-col gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#93AEB9]/25 text-[#132D42] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#132D42]">
              Your Plain-Language Breakdown Appears Here
            </h2>
            <p className="mt-1 text-sm sm:text-[15px] text-[#47505A] leading-relaxed max-w-prose">
              Select one of the Philippine barangay or city presets—or paste your own local notice—and click <strong className="font-semibold text-[#132D42]">Translate Policy</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#93AEB9]/30">
          {[
            {
              num: '01',
              title: 'Plain-Language Summary',
              desc: 'What the notice means in clear everyday words.',
            },
            {
              num: '02',
              title: 'Key Rules & Obligations',
              desc: 'What residents must do, avoid, or are entitled to.',
            },
            {
              num: '03',
              title: 'Dates, Fees & Documents',
              desc: 'Only exact requirements written in the text.',
            },
            {
              num: '04',
              title: 'Step-by-Step Checklist',
              desc: 'Actionable steps you can check off and copy.',
            },
          ].map((item) => (
            <div
              key={item.num}
              className="rounded-2xl bg-[#F8FAFB] border border-[#93AEB9]/30 p-4 flex items-start gap-3"
            >
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono tabular-nums bg-[#8E9E52] text-white shrink-0 mt-0.5">
                {item.num}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#132D42]">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#59616B] mt-0.5 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const {
    documentTitle,
    plainLanguageSummary,
    keyRulesAndObligations,
    deadlinesFeesRequirements,
    stepByStepActions,
    officialVerificationReminder,
  } = result;

  const handlePrintOrSavePdf = () => {
    const html = buildPrintableHtml(result, language, checkedSteps);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    let openedPopup = false;
    try {
      const popup = window.open(blobUrl, '_blank');
      if (popup && !popup.closed) {
        openedPopup = true;
      }
    } catch {
      openedPopup = false;
    }

    if (!openedPopup) {
      const slug = (documentTitle || 'civicclear-policy-breakdown')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${slug || 'civicclear-policy-breakdown'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedReport(true);
      window.setTimeout(() => setDownloadedReport(false), 2500);
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60_000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      aria-label="Translated policy dashboard"
      className="flex flex-col gap-4"
    >
      {/* Dashboard Top Action Bar */}
      <div className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm px-6 py-5 flex flex-col gap-4">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#8E9E52] text-white whitespace-nowrap">
              {language === 'bisaya_tagalog'
                ? 'Conversational Bisaya / Tagalog'
                : 'Plain English'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#132D42] leading-snug">
            {documentTitle || 'Policy Breakdown'}
          </h2>
        </div>

        <div className="civic-print-hidden flex flex-wrap items-center gap-2 pt-3 border-t border-[#93AEB9]/25">
          <button
            type="button"
            onClick={onCopyChecklist}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              copied
                ? 'bg-[#8E9E52] text-white'
                : 'bg-[#132D42] text-white hover:bg-[#1b3d59]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Copied Checklist</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>Copy Checklist</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrintOrSavePdf}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              downloadedReport
                ? 'border-[#8E9E52] bg-[#8E9E52] text-white'
                : 'border-[#93AEB9] bg-white text-[#132D42] hover:bg-[#93AEB9]/15'
            }`}
          >
            {downloadedReport ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Downloaded Printable Report</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span>Print / Save PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#93AEB9] bg-white text-[#47505A] text-xs sm:text-sm font-medium hover:bg-[#93AEB9]/15 hover:text-[#132D42] transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear / New Query</span>
          </button>
        </div>
      </div>

      {/* Card 1: Plain-Language Summary */}
      <article className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm p-6">
        <h3 className="text-base font-bold text-[#132D42] flex items-center gap-2.5 mb-3">
          <BookOpen className="w-4 h-4 text-[#6C879D] shrink-0" aria-hidden="true" />
          <span>Plain-Language Summary</span>
        </h3>
        <p className="text-[15px] text-[#47505A] leading-relaxed max-w-prose">
          {plainLanguageSummary}
        </p>
      </article>

      {/* Card 2: Key Rules & Citizen Obligations */}
      <article className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm p-6">
        <h3 className="text-base font-bold text-[#132D42] flex items-center gap-2.5 mb-4">
          <FileCheck2 className="w-4 h-4 text-[#6C879D] shrink-0" aria-hidden="true" />
          <span>Key Rules &amp; Citizen Obligations</span>
        </h3>
        {keyRulesAndObligations.length > 0 ? (
          <ul className="space-y-3">
            {keyRulesAndObligations.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[15px] text-[#47505A] leading-relaxed">
                <CheckCircle2
                  className="w-4 h-4 text-[#8E9E52] shrink-0 mt-1"
                  aria-hidden="true"
                />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#59616B]">None specified</p>
        )}
      </article>

      {/* Card 3: Deadlines, Fees, or Documentary Requirements */}
      <article className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm p-6">
        <h3 className="text-base font-bold text-[#132D42] flex items-center gap-2.5 mb-4">
          <CalendarClock className="w-4 h-4 text-[#6C879D] shrink-0" aria-hidden="true" />
          <span>Deadlines, Fees, or Documentary Requirements</span>
        </h3>

        <div className="divide-y divide-[#93AEB9]/25">
          {/* Deadlines */}
          <div className="pb-4">
            <h4 className="text-xs font-semibold tracking-wide text-[#59616B] mb-2">
              Deadlines &amp; Timeframes
            </h4>
            {isNoneSpecified(deadlinesFeesRequirements?.deadlines) ? (
              <p className="text-sm font-medium text-[#59616B]">None specified</p>
            ) : (
              <ul className="space-y-1.5">
                {deadlinesFeesRequirements.deadlines.map((item, idx) => (
                  <li key={idx} className="text-[15px] text-[#132D42] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fees & Penalties */}
          <div className="py-4">
            <h4 className="text-xs font-semibold tracking-wide text-[#59616B] mb-2">
              Fees, Taxes &amp; Penalties
            </h4>
            {isNoneSpecified(deadlinesFeesRequirements?.feesAndPenalties) ? (
              <p className="text-sm font-medium text-[#59616B]">None specified</p>
            ) : (
              <ul className="space-y-1.5">
                {deadlinesFeesRequirements.feesAndPenalties.map((item, idx) => (
                  <li key={idx} className="text-[15px] text-[#132D42] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Documentary Requirements */}
          <div className="pt-4">
            <h4 className="text-xs font-semibold tracking-wide text-[#59616B] mb-2">
              Documentary Requirements
            </h4>
            {isNoneSpecified(deadlinesFeesRequirements?.documentaryRequirements) ? (
              <p className="text-sm font-medium text-[#59616B]">None specified</p>
            ) : (
              <ul className="space-y-1.5">
                {deadlinesFeesRequirements.documentaryRequirements.map((item, idx) => (
                  <li key={idx} className="text-[15px] text-[#132D42] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </article>

      {/* Card 4: Step-by-Step Next Actions */}
      <article className="bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-bold text-[#132D42] flex items-center gap-2.5">
            <ListChecks className="w-4 h-4 text-[#6C879D] shrink-0" aria-hidden="true" />
            <span>Step-by-Step Next Actions</span>
          </h3>
          <span className="text-xs font-mono tabular-nums text-[#59616B]">
            {Object.values(checkedSteps).filter(Boolean).length} / {stepByStepActions.length} done
          </span>
        </div>

        {stepByStepActions.length > 0 ? (
          <ol className="space-y-3">
            {stepByStepActions.map((step, idx) => {
              const isChecked = Boolean(checkedSteps[idx]);
              const stepNum = String(idx + 1).padStart(2, '0');
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => onToggleStep(idx)}
                    aria-pressed={isChecked}
                    className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-[#8E9E52]/10 border-[#8E9E52]/40'
                        : 'bg-[#F8FAFB] border-[#93AEB9]/30 hover:bg-[#93AEB9]/15'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono tabular-nums shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? 'bg-[#132D42] text-white'
                          : 'bg-[#8E9E52] text-white'
                      }`}
                    >
                      {isChecked ? <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" /> : stepNum}
                    </span>
                    <span
                      className={`text-[15px] leading-relaxed ${
                        isChecked
                          ? 'line-through text-[#59616B]'
                          : 'text-[#132D42]'
                      }`}
                    >
                      {step}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-[#59616B]">None specified</p>
        )}
      </article>

      {/* Card 5: Official Verification Reminder */}
      <aside className="bg-[#93AEB9]/25 rounded-3xl border border-[#6C879D]/45 p-6 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#6C879D] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#132D42]">
            Official Verification Reminder
          </h3>
          <p className="mt-1 text-sm text-[#47505A] leading-relaxed max-w-prose">
            {officialVerificationReminder}
          </p>
        </div>
      </aside>
    </motion.section>
  );
}
