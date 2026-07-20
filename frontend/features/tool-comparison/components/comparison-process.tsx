import { processSteps } from "../data/tool-comparison-content";
import { Fragment } from "react";

export function ComparisonProcess() {
  return (
    <section className="site-container mt-4">
      <div className="mx-auto grid min-h-[78px] max-w-[1680px] grid-cols-[1fr_96px_1fr_96px_1fr] items-center rounded-[18px] border border-brand-line bg-white px-28 py-2 shadow-panel max-lg:grid-cols-1 max-lg:gap-5 max-lg:px-8 max-lg:py-5">
        {processSteps.map(({ icon: Icon, number, text, title }, index) => (
          <Fragment key={title}>
            <div className="flex items-center gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-blue text-lg font-black text-white">{number}</span>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-brand-line bg-blue-50 text-brand-blue">
                <Icon size={27} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold leading-tight text-brand-blue">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-brand-muted">{text}</p>
              </div>
            </div>
            {index < processSteps.length - 1 ? <span className="h-px w-full border-t-2 border-dashed border-blue-200 max-lg:hidden" /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
