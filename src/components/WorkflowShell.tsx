export type WorkflowStep = "Inventory" | "Scenario" | "Run" | "Results" | "Report" | "Advanced" | "About";

export function WorkflowShell({
  steps,
  activeStep,
  onChange
}: {
  steps: WorkflowStep[];
  activeStep: WorkflowStep;
  onChange: (step: WorkflowStep) => void;
}) {
  return (
    <nav className="stepper" aria-label="CARBINE workflow">
      {steps.map((step, index) => (
        <button
          type="button"
          key={step}
          className={step === activeStep ? "active" : ""}
          onClick={() => onChange(step)}
          aria-current={step === activeStep ? "step" : undefined}
        >
          <span>{index + 1}</span>
          {step}
        </button>
      ))}
    </nav>
  );
}
