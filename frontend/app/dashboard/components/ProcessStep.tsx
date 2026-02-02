"use client";

interface ProcessStepProps {
  content: string;
  isProcessing: boolean;
  isComplete: boolean;
  showConnector?: boolean;
}

export default function ProcessStep({
  content,
  isProcessing,
  isComplete,
  showConnector = true,
}: ProcessStepProps) {
  const squareColor = isComplete ? "bg-green-500" : "bg-blue-500";
  const spinnerColor = isComplete ? "border-green-500" : "border-blue-500";
  const lineColor = isComplete ? "bg-green-500" : "bg-blue-500";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {isProcessing && !isComplete && (
          <div className="absolute inset-0 -m-3">
            <div
              className={`w-[calc(100%+24px)] h-[calc(100%+24px)] rounded-full border-4 border-t-transparent ${spinnerColor} animate-spin`}
            />
          </div>
        )}

        {isComplete && (
          <div className="absolute inset-0 -m-3">
            <div
              className={`w-[calc(100%+24px)] h-[calc(100%+24px)] rounded-full border-4 ${spinnerColor}`}
            />
          </div>
        )}

        <div
          className={`relative z-10 w-40 h-16 ${squareColor} rounded-lg flex items-center justify-center px-4`}
        >
          <span className="text-white text-sm font-medium text-center leading-tight">
            {content}
          </span>
        </div>
      </div>

      {showConnector && <div className={`w-1 h-8 ${lineColor} my-2`} />}
    </div>
  );
}
