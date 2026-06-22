const steps = [
  { key: "PICKED_UP",  label: "Recogido" },
  { key: "IN_TRANSIT", label: "En camino" },
  { key: "DELIVERED",  label: "Entregado" },
];

const statusOrder = ["CONFIRMED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export default function DeliveryTimeline({ currentStatus }) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isActive = currentIndex >= stepIndex;
        const isCurrent = currentStatus === step.key;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-apple-body text-[13px] font-semibold transition-all ${
                  isActive
                    ? "bg-[#0066cc] text-white"
                    : "bg-[#f5f5f7] text-[#7a7a7a]"
                } ${isCurrent ? "ring-2 ring-[#0066cc] ring-offset-2" : ""}`}
              >
                {isActive && currentIndex > stepIndex ? "✓" : idx + 1}
              </div>
              <span className={`font-apple-body text-[11px] whitespace-nowrap ${isActive ? "text-[#1d1d1f] font-medium" : "text-[#7a7a7a]"}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-[2px] mx-2 mt-[-18px] ${currentIndex > stepIndex ? "bg-[#0066cc]" : "bg-[#e0e0e0]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
