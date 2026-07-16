import type { CompanyMeta } from '@/modules/company';
import type { DemoState } from './demo-store';

type Point = { label: string; value: number };

function LineChart({ title, subtitle, data, color = '#1c4aa9', suffix = '' }: { title: string; subtitle: string; data: Point[]; color?: string; suffix?: string }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => `${16 + (index * 268) / Math.max(1, data.length - 1)},${112 - (item.value / max) * 88}`).join(' ');
  return <section className="rounded-2xl border border-[#e7e7e7] bg-white p-5"><h2 className="text-sm font-semibold text-[#2e313f]">{title}</h2><p className="mt-1 text-xs text-[#707070]">{subtitle}</p><svg role="img" aria-label={title} viewBox="0 0 300 145" className="mt-4 h-44 w-full"><defs><linearGradient id={`fill-${title.replace(/\W/g,'')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.24"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>{[24,68,112].map((y)=><line key={y} x1="16" x2="284" y1={y} y2={y} stroke="#eceef2" strokeWidth="1"/>)}<polygon points={`16,120 ${points} 284,120`} fill={`url(#fill-${title.replace(/\W/g,'')})`}/><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{data.map((item,index)=>{const x=16+(index*268)/Math.max(1,data.length-1);const y=112-(item.value/max)*88;return <g key={item.label}><circle cx={x} cy={y} r="3.5" fill="white" stroke={color} strokeWidth="2"/><text x={x} y="138" textAnchor="middle" fontSize="8" fill="#7a7d88">{item.label}</text>{index===data.length-1&&<text x={x-2} y={y-9} textAnchor="end" fontSize="9" fontWeight="600" fill="#2e313f">{item.value}{suffix}</text>}</g>})}</svg></section>;
}

function BarChart({ title, subtitle, data }: { title: string; subtitle: string; data: Point[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return <section className="rounded-2xl border border-[#e7e7e7] bg-white p-5"><h2 className="text-sm font-semibold text-[#2e313f]">{title}</h2><p className="mt-1 text-xs text-[#707070]">{subtitle}</p><div className="mt-5 space-y-4">{data.map((item,index)=><div key={item.label}><div className="mb-1.5 flex justify-between text-xs"><span className="text-[#606372]">{item.label}</span><span className="font-semibold text-[#2e313f]">{item.value.toLocaleString('en-IN')}</span></div><div className="h-2.5 rounded-full bg-[#eef0f4]"><div className={`h-2.5 rounded-full ${index===0?'bg-[#1c4aa9]':index===1?'bg-emerald-500':index===2?'bg-amber-500':'bg-violet-500'}`} style={{width:`${Math.max(5,(item.value/max)*100)}%`}}/></div></div>)}</div></section>;
}

const DOMAIN_SERIES: Record<string, { trend: string; suffix: string; values: number[]; comparison: string; bars: string[] }> = {
  POULTRY: { trend: 'Feed conversion ratio', suffix: '', values: [1.72,1.69,1.65,1.63,1.61,1.58], comparison: 'Poultry performance', bars: ['Survival %','Hatchability %','Lay rate %','Slaughter yield %'] },
  LIVESTOCK: { trend: 'Milk yield per animal', suffix: ' L', values: [18,19,20,21,20,22], comparison: 'Livestock performance', bars: ['Health score','Breeding success %','Feed efficiency %','Mature assets %'] },
  AGRICULTURE: { trend: 'Yield forecast', suffix: ' t', values: [12,18,25,31,38,46], comparison: 'Crop performance', bars: ['Sowing complete %','Input plan %','Harvest forecast %','Grade A %'] },
  AQUACULTURE: { trend: 'Biomass growth', suffix: ' t', values: [4,7,11,16,23,31], comparison: 'Pond performance', bars: ['Survival %','Water quality %','Feed efficiency %','Harvest yield %'] },
  INSECT: { trend: 'Honey yield', suffix: ' kg', values: [90,118,145,170,210,238], comparison: 'Apiary performance', bars: ['Colony strength %','Active hives %','Purity pass %','Grade 1 %'] },
  PROCESSING: { trend: 'Production yield', suffix: ' t', values: [18,21,20,24,26,29], comparison: 'BOR performance', bars: ['Ingredient match %','Protein target %','QC release %','Uptime %'] },
};

export function DashboardCharts({ company, state }: { company: CompanyMeta; state: DemoState }) {
  const series = DOMAIN_SERIES[company.nobCode] ?? { trend: 'Output trend', suffix: '', values: [12,16,19,24,28,33], comparison: `${company.nobName} performance`, bars: ['Output plan %','Quality pass %','Resource availability %','Cost efficiency %'] };
  const months = ['Feb','Mar','Apr','May','Jun','Jul'];
  const active = state.batches.filter((item)=>item.status !== 'CLOSED').length;
  const quality = state.qualityLots.length ? Math.round((state.qualityLots.filter((item)=>item.status==='PASS').length/state.qualityLots.length)*100) : 0;
  const barValues = [Math.min(99,88+active), quality, 86, Math.max(60,94-state.batches.filter((item)=>item.status==='QC_HOLD').length*7)];
  return <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><LineChart title={series.trend} subtitle={`Six-period ${company.nobName.toLowerCase()} operating trend · Demo data`} data={months.map((label,index)=>({label,value:series.values[index]}))} suffix={series.suffix}/><BarChart title={series.comparison} subtitle="Current operating position against configured targets" data={series.bars.map((label,index)=>({label,value:barValues[index]}))}/></div>;
}
