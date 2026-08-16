import { Check } from 'lucide-react';

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="w-full mb-8">
      <p className="text-lg font-semibold text-slate-700 mb-4">
        Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}
      </p>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <div key={step.label} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${isComplete ? 'bg-green-600 text-white' : ''}
                    ${isCurrent ? 'bg-blue-700 text-white ring-4 ring-blue-200' : ''}
                    ${!isComplete && !isCurrent ? 'bg-slate-200 text-slate-600' : ''}
                  `}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span
                  className={`mt-2 text-xs sm:text-sm text-center truncate w-full px-1 ${
                    isCurrent ? 'font-semibold text-blue-800' : 'text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-1 rounded ${
                    index < currentStep ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
