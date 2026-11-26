import { Scale } from 'lucide-react';

export function CivicHeader() {
  return (
    <header className="w-full pt-6 pb-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-[#93AEB9]/40 shadow-sm px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl bg-[#132D42] text-white flex items-center justify-center shrink-0 shadow-sm"
              aria-hidden="true"
            >
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#132D42]">
                  CivicClear AI
                </h1>
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#8E9E52] text-white whitespace-nowrap shrink-0">
                  SDG 16 · Peace, Justice &amp; Strong Institutions
                </span>
              </div>
              <p className="mt-1 text-sm sm:text-base font-medium text-[#47505A]">
                Plain-Language Ordinance &amp; Policy Navigator
              </p>
            </div>
          </div>

          <p className="text-sm text-[#59616B] lg:max-w-md lg:text-right leading-relaxed">
            Paste any barangay notice, local ordinance, or public service guideline below—or pick a sample policy—to get clear rules, exact requirements, and step-by-step actions.
          </p>
        </div>
      </div>
    </header>
  );
}
