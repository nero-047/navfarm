import React from 'react';
import {
  ArrowRight,
  Egg,
  Beef,
  Sprout,
  Waves,
  CheckCircle2,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface VerticalHubProps {
  selectedVertical: 'poultry' | 'livestock' | 'agri' | 'aqua';
  setSelectedVertical: (
    vertical: 'poultry' | 'livestock' | 'agri' | 'aqua',
  ) => void;
}

export const VerticalHub: React.FC<VerticalHubProps> = ({
  selectedVertical,
  setSelectedVertical,
}) => {
  const verticals = {
    poultry: {
      title: 'Poultry Operations',
      subtitle: 'Broilers, Eggs, Hatchery',
      description:
        'Track bird flocks from Day-Old Chick (DOC) placement in Rearing, through laying cycles, incubator settings, and joint-cost split slaughter lines.',
      badges: ['Standard Costing', 'Hatchability KPI', 'Traceability'],
      metrics: [
        'Hatchability Target: 87%',
        'Feed Conversion Ratio (FCR)',
        'Laying Rate KPI',
      ],
      accentBg: 'bg-(--accent-muted) text-(--accent) border-(--accent)/20',
      icon: Egg,
    },
    livestock: {
      title: 'Livestock & Herd Management',
      subtitle: 'Dairy, Cattle, Feedlots',
      description:
        'Manage cows, buffaloes, and pigs. Fully supports biological asset stage reclassifications (e.g., transition from premature heifer to milking cow).',
      badges: [
        'IAS 41 Bio-Assets',
        'Amortization Schedules',
        'Quarantine Checks',
      ],
      metrics: [
        'Premature/Mature Transition',
        'Daily Milk Yield Logs',
        'Unrealized Fair Value Gain',
      ],
      accentBg: 'bg-(--accent-muted) text-(--accent) border-(--accent)/20',
      icon: Beef,
    },
    agri: {
      title: 'Smart Agriculture',
      subtitle: 'Bearer Plants & Crops',
      description:
        'Monitor fruit orchards (IAS 16 Bearer Plants) and seasonal crop batches. Capitalize tree nurturing costs, copy crop batches, and generate FIFO lots.',
      badges: ['Bearer Plants', 'FIFO Cost Layers', 'Batch Duplication'],
      metrics: [
        'Fruit/Crop Yield tracking',
        'Yearly Amortization',
        'UOM Conversions',
      ],
      accentBg: 'bg-(--accent-muted) text-(--accent) border-(--accent)/20',
      icon: Sprout,
    },
    aqua: {
      title: 'Aquaculture & Processing',
      subtitle: 'Fisheries & Filleting',
      description:
        'Stock ponds with fingerlings. Track feed conversion, record partial harvests as separate FIFO lots, and perform joint-product yield allocations.',
      badges: ['Biomass Calculation', 'QC Inspection', 'QR Code Packing'],
      metrics: [
        'Water Temp & pH Alerts',
        'Slaughter Joint Costs',
        'Farm-to-Fork QR payload',
      ],
      accentBg: 'bg-(--accent-muted) text-(--accent) border-(--accent)/20',
      icon: Waves,
    },
  };

  const ActiveIcon = verticals[selectedVertical].icon;

  return (
    <section
      id="verticals"
      className="py-24 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 px-6 relative overflow-hidden"
    >
      {/* Dynamic background decoration */}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-4 mb-16">
          <div className="inline-flex self-center items-center gap-2 px-3 py-1 rounded-full bg-(--accent-muted) border border-(--accent)/20 text-(--accent) text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" /> Domain Specialization
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Built for Every Agriculture Domain
          </h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">
            NAVFarm manages complex biological cycles across all farming
            verticals, providing granular cost allocations and traceability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Vertical Selector Buttons */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {(Object.keys(verticals) as Array<keyof typeof verticals>).map(
              (key) => {
                const item = verticals[key];
                const IconComp = item.icon;
                const isActive = selectedVertical === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedVertical(key)}
                    className={`w-full text-left p-5 rounded-[var(--radius-lg)] border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? `bg-[var(--surface)] border-l-4 border-l-(--accent) border-[var(--border)] shadow-[var(--shadow-md)] scale-[1.02]`
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-(--accent)/30 hover:bg-[var(--surface-raised)]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center transition-colors duration-300 ${
                          isActive
                            ? 'bg-(--accent) text-white'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`font-bold text-base transition-colors ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}
                        >
                          {item.title}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 transition-all ${
                        isActive
                          ? 'text-(--accent) translate-x-1'
                          : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>
                );
              },
            )}
          </div>

          {/* Active Detail Panel */}
          <div className="lg:col-span-8 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 md:p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between shadow-lg">
            {/* Visual glow element on active */}

            <div className="flex flex-col gap-6">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                {verticals[selectedVertical].badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${verticals[selectedVertical].accentBg}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Title Section */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-(--accent-muted) flex items-center justify-center text-(--accent)">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {verticals[selectedVertical].title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed max-w-3xl">
                {verticals[selectedVertical].description}
              </p>
            </div>

            {/* KPIs Block */}
            <div className="pt-8 border-t border-[var(--border)] mt-8">
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-(--accent)" /> Operational
                KPIs Supported
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {verticals[selectedVertical].metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--surface-raised)] border border-[var(--border)] text-xs md:text-sm text-[var(--text-primary)] font-medium hover:border-(--accent)/20 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-(--accent) shrink-0" />
                    <span>{metric}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default VerticalHub;
