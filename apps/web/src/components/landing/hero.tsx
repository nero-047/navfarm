import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Cpu, Scale, Terminal, Database, TrendingUp } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface HeroProps {
  onRegisterClick: () => void;
  onLaunchClick: () => void;
  isLoggedIn?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onRegisterClick, onLaunchClick, isLoggedIn = false }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Live rotating operational events feed
  const [logs, setLogs] = useState([
    { id: 1, time: "17:00:00", desc: "DOC flock placement (10k birds)", batch: "BATCH-REAR-3", value: "₹1,85,000", type: "WIP" },
    { id: 2, time: "16:58:12", desc: "Feed issue (40 bags Corn Mix)", batch: "BATCH-REAR-3", value: "₹35,000", type: "POSTED" },
    { id: 3, time: "16:55:04", desc: "Slaughter joint-cost split settle", batch: "BATCH-SLA-01", value: "₹2,10,000", type: "SETTLE" },
    { id: 4, time: "16:50:30", desc: "Milk yield collect (1,200 Liters)", batch: "HERD-DAIRY-B", value: "₹54,000", type: "ASSET" }
  ]);

  const [counter, setCounter] = useState(5);

  useEffect(() => {
    const events = [
      { desc: "Batch close & variance settlement", batch: "BATCH-HATCH-2025-001", value: "₹46,175", type: "SETTLE" },
      { desc: "Vaccination batch issue", batch: "BATCH-REAR-3", value: "₹12,400", type: "WIP" },
      { desc: "IAS 41 Fair Value gain revaluation", batch: "HERD-DAIRY-B", value: "₹84,500", type: "ASSET" },
      { desc: "FIFO harvest lot serialized", batch: "CROP-APPLE-ORCH", value: "₹95,000", type: "POSTED" },
      { desc: "Bearer plant nurturing cap", batch: "ORCH-APPLE-C", value: "₹18,200", type: "WIP" },
      { desc: "Feed transfer to Silo-4", batch: "MILL-JOB-09", value: "₹62,000", type: "POSTED" }
    ];

    const interval = setInterval(() => {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      setLogs(prev => {
        const nextLogs = [
          {
            id: counter,
            time: timeStr,
            desc: randomEvent.desc,
            batch: randomEvent.batch,
            value: randomEvent.value,
            type: randomEvent.type
          },
          ...prev.slice(0, 3)
        ];
        return nextLogs;
      });
      setCounter(c => c + 1);
    }, 4500);

    return () => clearInterval(interval);
  }, [counter]);

  return (
    <section className="relative pt-20 pb-28 px-6 max-w-7xl mx-auto">
      {/* Dynamic Background Elements */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center relative z-10">

        {/* Left Column (Hero Content) */}
        <div className="lg:col-span-6 flex flex-col gap-8 text-center lg:text-left">

          {/* Badge */}
          <div className="inline-flex self-center lg:self-start items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-teal-500/5 dark:bg-teal-950/40 border border-teal-500/20 text-teal-650 dark:text-teal-400 text-[10.5px] font-semibold tracking-wider uppercase font-mono shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>Agricultural ERP & Compliance Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08] relative">
            Double-Entry Ledger
            <span className="block mt-2 bg-gradient-to-r from-teal-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent filter drop-shadow-sm">
              Agricultural Costing
            </span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            NAVFarm is an enterprise SaaS platform bridging the gap between farm operations and financial compliance. Auto-calculate costing variances, manage bio-assets (IAS 41), and track production lots from rearing to packaging.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            <button
              onClick={onLaunchClick}
              className="group relative overflow-hidden py-4 px-9 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 via-blue-600 to-blue-700 text-white shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-teal-400/20 hover:shadow-teal-500/25"
            >
              <span>{isLoggedIn ? 'Go to Dashboard' : 'Launch Console Dashboard'}</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Bottom Info Grid */}
          <div className="pt-10 border-t border-[var(--border)] w-full max-w-xl mx-auto lg:mx-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full justify-items-stretch">

              {/* Card 1: Multi Tenant */}
              <div className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-teal-500/30 transition-all duration-300 shadow-sm flex flex-col gap-3 group/card cursor-pointer items-center lg:items-start text-center lg:text-left">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-655 dark:text-teal-400 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[var(--text-primary)]">Multi-Tenant</div>
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">Schema Isolation</div>
                </div>
              </div>

              {/* Card 2: Auto GL */}
              <div className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-blue-500/30 transition-all duration-300 shadow-sm flex flex-col gap-3 group/card cursor-pointer items-center lg:items-start text-center lg:text-left">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-655 dark:text-blue-400 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[var(--text-primary)]">100% Auto</div>
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">Double-Entry GL</div>
                </div>
              </div>

              {/* Card 3: IAS 41 */}
              <div className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/30 transition-all duration-300 shadow-sm flex flex-col gap-3 group/card cursor-pointer items-center lg:items-start text-center lg:text-left">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-655 dark:text-emerald-400 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                  <Scale className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[var(--text-primary)]">IAS 41 & 16</div>
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] mt-0.5">Asset Accounting</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column (Interactive Code Mockup Dashboard) */}
        <div className="lg:col-span-6 relative flex items-center justify-center lg:pl-4 w-full">
          {/* Ambient background glows */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-blue-500/5 to-transparent rounded-[32px] blur-3xl pointer-events-none transform -rotate-3 scale-95" />
          <div className="absolute -inset-1.5 rounded-[36px] bg-gradient-to-r from-teal-500/20 via-blue-500/10 to-emerald-500/10 opacity-30 blur-md pointer-events-none" />

          {/* Interactive Console Frame */}
          <div className={`w-full max-w-xl rounded-3xl border p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 font-sans select-none overflow-hidden relative transition-all duration-300 ${
            isDark
              ? 'bg-[#070b13]/85 border-gray-800 border-t-white/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)]'
              : 'bg-white border-gray-200 border-t-gray-100 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)]'
          }`}>
            {/* Header / OS Buttons */}
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-gray-800/80' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className={`text-[9px] sm:text-[10px] font-mono ml-1 sm:ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>NAV_COMPLIANCE_ENGINE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-[9px] sm:text-[10px] font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>WORKSPACE: ACTIVE</span>
              </div>
            </div>

            {/* Metrics cards row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 border rounded-xl flex flex-col gap-1 sm:gap-1.5 transition-colors ${
                isDark ? 'bg-[#0d1220]/70 border-gray-800/70' : 'bg-gray-50/70 border-gray-100'
              }`}>
                <div className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Live FCR Rate</div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm sm:text-base font-extrabold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>1.62</span>
                  <span className={`text-[8px] sm:text-[9px] font-bold flex items-center ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" /> +2.1%
                  </span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 border rounded-xl flex flex-col gap-1 sm:gap-1.5 transition-colors ${
                isDark ? 'bg-[#0d1220]/70 border-gray-800/70' : 'bg-gray-50/70 border-gray-100'
              }`}>
                <div className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Current WIP</div>
                <div className={`text-sm sm:text-base font-extrabold font-mono truncate ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>₹1,24,050</div>
              </div>
              <div className={`p-2 sm:p-3 border rounded-xl flex flex-col gap-1 sm:gap-1.5 transition-colors ${
                isDark ? 'bg-[#0d1220]/70 border-gray-800/70' : 'bg-gray-50/70 border-gray-100'
              }`}>
                <div className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>IAS 41 Valuation</div>
                <div className={`text-sm sm:text-base font-extrabold font-mono truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>₹4,52,380</div>
              </div>
            </div>

            {/* Ledger Ticker */}
            <div className={`flex flex-col gap-2 border rounded-xl p-2.5 sm:p-3 transition-colors ${
              isDark ? 'bg-[#080d16] border-gray-800/60' : 'bg-gray-50/50 border-gray-200/50'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isDark ? 'border-gray-800/60' : 'border-gray-200'}`}>
                <span className={`text-[9px] sm:text-[10px] font-extrabold flex items-center gap-1 sm:gap-1.5 font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Terminal className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-500'}`} /> OPERATIONAL TRANSACTION STACK
                </span>
                <span className={`text-[8px] sm:text-[9px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Auto-Sync</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[175px]">
                {logs.map((log) => (
                  <div key={log.id} className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg border transition-colors animate-fade-in ${
                    isDark
                      ? 'bg-[#0e1624]/60 border-gray-800/30 hover:border-gray-800'
                      : 'bg-white border-gray-150/70 hover:border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className={`text-[8px] sm:text-[9px] font-mono shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{log.time}</span>
                      <div className="flex flex-col text-left min-w-0">
                        <span className={`text-[11px] sm:text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{log.desc}</span>
                        <span className={`text-[8px] sm:text-[9px] font-mono mt-0.5 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Batch: {log.batch}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                      <span className={`text-[11px] sm:text-xs font-black font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{log.value}</span>
                      <span className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded border ${
                        log.type === 'WIP'
                          ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-500/5 border-amber-500/15 text-amber-700'
                          : log.type === 'SETTLE'
                          ? isDark ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-teal-500/5 border-teal-500/15 text-teal-700'
                          : log.type === 'ASSET'
                          ? isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-500/5 border-blue-500/15 text-blue-700'
                          : isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-700'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Ledger Account Postings */}
            <div className={`flex flex-col gap-2 border rounded-xl p-2.5 sm:p-3 transition-colors ${
              isDark ? 'bg-[#080d16] border-gray-800/60' : 'bg-gray-50/50 border-gray-200/50'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isDark ? 'border-gray-800/60' : 'border-gray-200'}`}>
                <span className={`text-[9px] sm:text-[10px] font-extrabold flex items-center gap-1 sm:gap-1.5 font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Database className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} /> LIVE COMPLIANCE GENERAL LEDGER
                </span>
                <span className={`text-[8px] sm:text-[9px] font-bold font-mono ${isDark ? 'text-teal-400' : 'text-teal-650'}`}>BALANCED: YES</span>
              </div>
              <div className={`grid grid-cols-12 gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-mono font-bold p-1 border-b ${isDark ? 'border-gray-800/35 text-gray-400' : 'border-gray-150 text-gray-500'}`}>
                <span className="col-span-6">GL Account</span>
                <span className="col-span-3 text-right">Debit (Dr)</span>
                <span className="col-span-3 text-right">Credit (Cr)</span>
              </div>
              <div className="space-y-1.5 font-mono text-[9.5px] sm:text-[10.5px]">
                <div className="grid grid-cols-12 gap-1 sm:gap-2">
                  <span className={`col-span-6 text-left truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>1190 Work-in-Progress (WIP)</span>
                  <span className={`col-span-3 text-right font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>₹35,000</span>
                  <span className={`col-span-3 text-right ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>-</span>
                </div>
                <div className="grid grid-cols-12 gap-1 sm:gap-2">
                  <span className={`col-span-6 text-left truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>1100 Raw Feed Silo Stock</span>
                  <span className={`col-span-3 text-right ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>-</span>
                  <span className={`col-span-3 text-right font-bold ${isDark ? 'text-rose-500' : 'text-rose-600'}`}>₹35,000</span>
                </div>
                <div className="grid grid-cols-12 gap-1 sm:gap-2">
                  <span className={`col-span-6 text-left truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>6120 Usage Cost Variance</span>
                  <span className={`col-span-3 text-right font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>₹8</span>
                  <span className={`col-span-3 text-right ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
