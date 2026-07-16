import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { CompanyMeta } from '@/modules/company';
import type { DemoState } from './demo-store';

type Series = { trend: string; suffix: string; values: number[]; target: number; performance: string[]; lowerIsBetter?: boolean };

const CARD = 'rounded-2xl border border-[#e3e7ee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]';

const DOMAIN_SERIES: Record<string, Series> = {
  POULTRY: { trend: 'Feed conversion ratio', suffix: '', values: [1.72,1.69,1.65,1.63,1.61,1.58], target: 1.60, performance: ['Survival','Hatchability','Lay rate','Yield'], lowerIsBetter: true },
  LIVESTOCK: { trend: 'Milk yield per animal', suffix: ' L', values: [18,19,20,21,20,22], target: 21, performance: ['Health','Breeding','Feed efficiency','Mature assets'] },
  AGRICULTURE: { trend: 'Yield forecast', suffix: ' t', values: [12,18,25,31,38,46], target: 44, performance: ['Sowing','Input plan','Harvest forecast','Grade A'] },
  AQUACULTURE: { trend: 'Biomass growth', suffix: ' t', values: [4,7,11,16,23,31], target: 30, performance: ['Survival','Water quality','Feed efficiency','Harvest yield'] },
  INSECT: { trend: 'Honey yield', suffix: ' kg', values: [90,118,145,170,210,238], target: 225, performance: ['Colony strength','Active hives','Purity pass','Grade 1'] },
  PROCESSING: { trend: 'Production yield', suffix: ' t', values: [18,21,20,24,26,29], target: 28, performance: ['Recipe match','Protein target','QC release','Uptime'] },
};

function CardHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-[#252b3d]">{title}</h2><p className="mt-1 text-[11px] text-[#828899]">{subtitle}</p></div>{badge && <span className="shrink-0 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[9px] font-semibold text-[#1c4aa9]">{badge}</span>}</div>;
}

function TrendChart({ series }: { series: Series }) {
  const data = ['Feb','Mar','Apr','May','Jun','Jul'].map((label,index)=>({label,value:series.values[index]}));
  const all = [...series.values, series.target];
  const min = Math.min(...all) * .92;
  const max = Math.max(...all) * 1.06;
  const x = (index:number) => 34 + (index * 336) / Math.max(1,data.length-1);
  const y = (value:number) => 142 - ((value-min)/(max-min || 1))*105;
  const points = data.map((item,index)=>`${x(index)},${y(item.value)}`).join(' ');
  const latest = data[data.length-1].value;
  const delta = ((latest-data[0].value)/data[0].value)*100;
  const favourable = series.lowerIsBetter ? delta <= 0 : delta >= 0;
  return <section className={`${CARD} p-5 sm:p-6`}><CardHeader title={series.trend} subtitle="Actual performance against configured operating target" badge="6 PERIODS"/><div className="mt-5 flex items-end gap-3"><p className="text-3xl font-semibold tracking-tight text-[#252b3d]">{latest}{series.suffix}</p><span className={`mb-1 inline-flex items-center gap-1 text-[11px] font-semibold ${favourable ? 'text-emerald-600':'text-red-600'}`}>{delta>=0?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {Math.abs(delta).toFixed(1)}%</span><span className="mb-1 text-[10px] text-[#9298a8]">vs Feb</span></div><svg role="img" aria-label={`${series.trend} trend`} viewBox="0 0 400 178" className="mt-2 h-52 w-full"><defs><linearGradient id="operatingTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f66d0" stopOpacity=".24"/><stop offset="100%" stopColor="#2f66d0" stopOpacity="0"/></linearGradient></defs>{[38,72,107,142].map((line)=><line key={line} x1="34" x2="370" y1={line} y2={line} stroke="#edf0f4"/>)}<line x1="34" x2="370" y1={y(series.target)} y2={y(series.target)} stroke="#e79b37" strokeDasharray="5 5"/><text x="368" y={y(series.target)-5} textAnchor="end" fontSize="8" fill="#b87520">Target {series.target}{series.suffix}</text><polygon points={`34,148 ${points} 370,148`} fill="url(#operatingTrendFill)"/><polyline points={points} fill="none" stroke="#2459bd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{data.map((item,index)=><g key={item.label}><circle cx={x(index)} cy={y(item.value)} r="4" fill="white" stroke="#2459bd" strokeWidth="2.5"/><text x={x(index)} y="169" textAnchor="middle" fontSize="9" fill="#878d9d">{item.label}</text></g>)}</svg></section>;
}

function BatchMix({ state }: { state: DemoState }) {
  const active = state.batches.filter((item)=>['APPROVED','ACTIVE','PAUSED'].includes(item.status)).length;
  const hold = state.batches.filter((item)=>item.status==='QC_HOLD').length;
  const close = state.batches.filter((item)=>item.status==='READY_TO_CLOSE').length;
  const other = Math.max(0,state.batches.length-active-hold-close);
  const total = Math.max(1,state.batches.length);
  const parts = [{label:'Operating',value:active,color:'#2459bd'},{label:'Ready to close',value:close,color:'#25a477'},{label:'On hold',value:hold,color:'#e69a32'},{label:'Draft / closed',value:other,color:'#c9ced8'}];
  let offset=0;
  const gradient=parts.map((part)=>{const from=(offset/total)*100;offset+=part.value;return `${part.color} ${from}% ${(offset/total)*100}%`;}).join(',');
  return <section className={`${CARD} p-5 sm:p-6`}><CardHeader title="Batch portfolio" subtitle="Current lifecycle distribution" badge={`${state.batches.length} TOTAL`}/><div className="mt-7 flex items-center justify-center gap-7"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{background:`conic-gradient(${gradient})`}}><div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white"><span className="text-3xl font-semibold text-[#252b3d]">{active}</span><span className="text-[9px] font-semibold uppercase tracking-wide text-[#9298a8]">Operating</span></div></div><div className="min-w-0 space-y-3">{parts.map((part)=><div key={part.label} className="flex items-center gap-2.5 text-[11px]"><span className="h-2.5 w-2.5 rounded-full" style={{background:part.color}}/><span className="min-w-0 flex-1 text-[#717789]">{part.label}</span><span className="font-semibold text-[#30364b]">{part.value}</span></div>)}</div></div></section>;
}

function Performance({ labels, values }: { labels: string[]; values: number[] }) {
  return <section className={`${CARD} p-5`}><CardHeader title="Operational scorecard" subtitle="Actual vs configured target"/><div className="mt-5 space-y-4">{labels.map((label,index)=><div key={label}><div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="text-[#666d7e]">{label}</span><span className="font-semibold text-[#30364b]">{values[index]}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0f4]"><div className={`h-full rounded-full ${values[index]>=90?'bg-emerald-500':values[index]>=80?'bg-[#2f66d0]':'bg-amber-500'}`} style={{width:`${values[index]}%`}}/></div></div>)}</div></section>;
}

function CostComposition({ state }: { state: DemoState }) {
  const wip = state.batches.reduce((sum,item)=>sum+item.wip,0);
  const values = [{label:'Feed & inputs',value:54,color:'bg-[#2459bd]'},{label:'Labour',value:18,color:'bg-[#6d55c7]'},{label:'Resources',value:16,color:'bg-[#25a477]'},{label:'Overheads',value:12,color:'bg-[#e69a32]'}];
  return <section className={`${CARD} p-5`}><CardHeader title="Cost composition" subtitle={`WIP ₹${(wip/100000).toFixed(2)}L across active production`}/><div className="mt-6 flex h-3 overflow-hidden rounded-full">{values.map(item=><span key={item.label} className={item.color} style={{width:`${item.value}%`}}/>)}</div><div className="mt-5 grid grid-cols-2 gap-3">{values.map(item=><div key={item.label} className="rounded-xl bg-[#f8f9fb] p-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${item.color}`}/><span className="text-[10px] text-[#7c8292]">{item.label}</span></div><p className="mt-1 text-lg font-semibold text-[#30364b]">{item.value}%</p></div>)}</div></section>;
}

function FinancialPulse({ state }: { state: DemoState }) {
  const values=[38,52,45,68,61,82];
  const max=Math.max(...values);
  return <section className={`${CARD} p-5`}><CardHeader title="Production value" subtitle="Monthly output value · ₹ lakh"/><div className="mt-6 flex h-32 items-end gap-3">{values.map((value,index)=><div key={index} className="flex h-full flex-1 flex-col justify-end gap-2"><div className={`w-full rounded-t-md ${index===values.length-1?'bg-[linear-gradient(180deg,#3d75dc,#1c4aa9)]':'bg-[#dbe5f8]'}`} style={{height:`${(value/max)*100}%`}}/><span className="text-center text-[8px] text-[#9298a8]">{['Feb','Mar','Apr','May','Jun','Jul'][index]}</span></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-[#edf0f4] pt-4"><div><p className="text-[10px] text-[#9298a8]">July value</p><p className="mt-1 text-xl font-semibold text-[#252b3d]">₹82.4L</p></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"><ArrowUpRight size={12}/> 13.2%</span></div></section>;
}

function HealthMatrix({ state }: { state: DemoState }) {
  const rows=['Production plan','Input availability','Quality release','Resource capacity','Cost efficiency'];
  const cells=[[3,3,3,2,3,3],[3,3,2,2,3,3],[3,2,2,3,3,3],[3,3,3,3,2,3],[2,2,3,2,3,3]];
  const issueCount=state.batches.filter(item=>item.riskStatus!=='ON_TRACK'||item.status==='QC_HOLD').length;
  return <section className={`${CARD} p-5 sm:p-6`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><CardHeader title="Workspace health matrix" subtitle="Six-period view of production, controls and capacity"/><div className="flex gap-2"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">ON TRACK</span>{issueCount>0&&<span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-semibold text-amber-700">{issueCount} ATTENTION</span>}</div></div><div className="mt-5 overflow-x-auto"><div className="min-w-[560px]"><div className="grid grid-cols-[150px_repeat(6,1fr)] gap-2 pb-2"><span/>{['Feb','Mar','Apr','May','Jun','Jul'].map(item=><span key={item} className="text-center text-[9px] text-[#9298a8]">{item}</span>)}</div>{rows.map((row,rowIndex)=><div key={row} className="mb-2 grid grid-cols-[150px_repeat(6,1fr)] items-center gap-2"><span className="text-[10px] font-medium text-[#646b7c]">{row}</span>{cells[rowIndex].map((value,index)=><span key={index} className={`h-7 rounded-md ${value===3?'bg-emerald-100':value===2?'bg-amber-100':'bg-red-100'}`} title={value===3?'On track':value===2?'Watch':'Action required'}/>)}</div>)}</div></div></section>;
}

export function DashboardCharts({ company, state }: { company: CompanyMeta; state: DemoState }) {
  const series = DOMAIN_SERIES[company.nobCode] ?? { trend:'Output trend',suffix:'',values:[12,16,19,24,28,33],target:31,performance:['Output plan','Quality pass','Resource availability','Cost efficiency'] };
  const active=state.batches.filter(item=>!['CLOSED','CANCELLED'].includes(item.status)).length;
  const quality=state.qualityLots.length?Math.round(state.qualityLots.filter(item=>item.status==='PASS').length/state.qualityLots.length*100):0;
  const values=[Math.min(98,88+active),quality||92,86,Math.max(60,94-state.batches.filter(item=>item.status==='QC_HOLD').length*7)];
  return <div className="space-y-5"><div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]"><TrendChart series={series}/><BatchMix state={state}/></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><Performance labels={series.performance} values={values}/><CostComposition state={state}/><FinancialPulse state={state}/></div><HealthMatrix state={state}/></div>;
}
