"use client";

import GlassButton from "@/components/GlassButton";

interface WizardStepProps {
  question: string;
  hint?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  canAdvance: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  nextLabel?: string;
}

export default function WizardStep({
  question,
  hint,
  children,
  onNext,
  onBack,
  onSkip,
  canAdvance,
  isFirst,
  isLast,
  nextLabel,
}: WizardStepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1">
        <h1 className="wizard-question mb-3">{question}</h1>
        {hint && <p className="wizard-hint mb-12">{hint}</p>}
        <div className="mt-10">{children}</div>
      </div>
      <div className="mt-14 flex items-center gap-3">
        {!isFirst && onBack && (
          <GlassButton variant="ghost" onClick={onBack}>
            Back
          </GlassButton>
        )}
        <div className="flex-1" />
        {onSkip && (
          <GlassButton variant="ghost" onClick={onSkip}>
            Skip
          </GlassButton>
        )}
        <GlassButton
          variant="coral"
          onClick={onNext}
          disabled={!canAdvance}
        >
          {nextLabel || (isLast ? "Plan My Trip" : "Continue")}
        </GlassButton>
      </div>
    </div>
  );
}
