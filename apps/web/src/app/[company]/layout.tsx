'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  Command,
  Gauge,
  Headphones,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/CompanySwitcher';
import { useCurrentCompany } from '@/modules/company/use-current-company';
import { DemoStoreProvider } from '@/modules/farm-demo/demo-store';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: 'dashboard' },
  { icon: Boxes, label: 'Batches', href: 'batches' },
  { icon: Gauge, label: 'Operations', href: 'operations' },
  { icon: ClipboardCheck, label: 'Quality Control', href: 'quality' },
  { icon: QrCode, label: 'Traceability', href: 'traceability' },
  { icon: Wrench, label: 'Resources & KPIs', href: 'resources' },
  { icon: BarChart3, label: 'Reports', href: 'reports' },
  { icon: Settings, label: 'Settings', href: 'settings' },
];

function getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() ?? '?';
}

function getCurrentSlug(pathname: string): string | null {
  return pathname.split('/').filter(Boolean)[0] ?? null;
}

function NavLink({
  item,
  slug,
  activePage,
  compact = false,
}: {
  item: (typeof NAV_ITEMS)[number];
  slug: string | null;
  activePage: string;
  compact?: boolean;
}) {
  const active = activePage === item.href;
  return (
    <Link
      href={slug ? `/${slug}/${item.href}` : '#'}
      className={`group relative flex shrink-0 items-center gap-3 rounded-xl text-[12px] font-medium transition-all ${compact ? 'px-3 py-2' : 'px-3 py-2.5'} ${active ? 'bg-white text-[#111a4f] shadow-[0_8px_22px_rgba(0,0,0,0.16)]' : 'text-white/62 hover:bg-white/[0.07] hover:text-white'}`}
    >
      {!compact && active && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-[#ed6a4f]" />}
      <item.icon size={17} strokeWidth={active ? 2 : 1.6} />
      {item.label}
    </Link>
  );
}

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const slug = getCurrentSlug(pathname);
  const currentCompany = useCurrentCompany();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('workspace-search')?.focus();
      }
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setHelpOpen(false);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-[#707070]">
        Loading NAVFarm…
      </div>
    );
  if (!user) return null;

  const activePage = pathname.split('/').filter(Boolean)[1] ?? 'dashboard';

  return (
    <div className="min-h-screen bg-[#f3f5f8] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col overflow-hidden bg-[linear-gradient(180deg,#0a1244_0%,#111b55_58%,#071039_100%)] text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 top-28 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative border-b border-white/[0.08] p-5 pb-4">
          <Link
            href="/company-selection"
            className="mb-5 flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f16d50,#c24332)] text-sm font-black text-white shadow-lg shadow-red-950/20">NF</span>
            <span><span className="block text-xl font-bold tracking-tight">NAV<span className="text-[#f16d50]">Farm</span></span><span className="block text-[8px] font-semibold uppercase tracking-[0.24em] text-white/35">Farm intelligence ERP</span></span>
          </Link>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-1"><CompanySwitcher /></div>
        </div>
        <nav className="relative flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">Company workspace</p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              slug={slug}
              activePage={activePage}
            />
          ))}
        </nav>
        <div className="relative border-t border-white/[0.08] p-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f16d50] text-xs font-bold">{getInitial(user.name || user.email)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{user.name || 'User'}</p><p className="mt-0.5 truncate text-[9px] text-white/40">Company administrator</p></div><ShieldCheck size={15} className="text-emerald-300" /></div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e4e8ef] bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 xl:px-8">
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e8ef] text-[#30364b] lg:hidden">{mobileOpen ? <X size={18}/> : <Menu size={18}/>}</button>
            <div className="hidden min-w-0 lg:block"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9298a8]">{currentCompany?.nobName ?? 'Workspace'}</p><p className="truncate text-sm font-semibold text-[#252b3d]">{currentCompany?.name ?? 'NAVFarm'}</p></div>
            <Link href="/company-selection" className="mr-auto text-lg font-bold text-[#0b1248] lg:hidden">NAV<span className="text-[#c24332]">Farm</span></Link>
            <div className="relative hidden h-10 min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-[#e4e8ef] bg-[#f7f8fa] px-3 text-[#8a90a0] md:flex lg:ml-8"><Search size={15}/><input id="workspace-search" aria-label="Search workspace" placeholder="Search workspace…" value={searchQuery} onChange={(event)=>setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-[#30364b] outline-none"/><span className="flex items-center gap-1 rounded-md border border-[#dfe3ea] bg-white px-1.5 py-1 text-[9px]"><Command size={9}/> K</span>{searchQuery && <span className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white p-2 shadow-2xl">{NAV_ITEMS.filter(item=>item.label.toLowerCase().includes(searchQuery.toLowerCase())).map(item=><Link key={item.href} href={slug?`/${slug}/${item.href}`:'#'} onClick={()=>setSearchQuery('')} className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-[#4e5567] hover:bg-[#f5f7fa]"><item.icon size={15} className="text-[#1c4aa9]"/>{item.label}<ChevronDown size={12} className="ml-auto -rotate-90 text-[#9aa0ae]"/></Link>)}{NAV_ITEMS.every(item=>!item.label.toLowerCase().includes(searchQuery.toLowerCase()))&&<span className="block px-3 py-4 text-center text-xs text-[#8a90a0]">No matching workspace page</span>}</span>}</div>
            <Link href={slug ? `/${slug}/operations` : '#'} className="hidden h-10 items-center gap-2 rounded-xl bg-[#0b1248] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#151d5e] sm:flex"><Sparkles size={14}/> Quick entry</Link>
            <div className="relative hidden sm:block"><button onClick={()=>{setHelpOpen(!helpOpen);setProfileOpen(false);setNotificationsOpen(false);}} aria-label="Help" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e8ef] text-[#646b7c] hover:bg-[#f7f8fa]"><HelpCircle size={17}/></button>{helpOpen&&<div className="absolute right-0 top-12 w-64 rounded-2xl border border-[#e4e8ef] bg-white p-2 shadow-2xl"><p className="px-3 pb-2 pt-2 text-xs font-semibold text-[#252b3d]">Help & resources</p>{[['Product tour','Learn the company workflow'],['Keyboard shortcuts','Navigate NAVFarm faster'],['Demo guide','Understand the sample data']].map(([title,description])=><button key={title} onClick={()=>setHelpOpen(false)} className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#f5f7fa]"><span className="block text-xs font-semibold text-[#4e5567]">{title}</span><span className="mt-1 block text-[9px] text-[#9298a8]">{description}</span></button>)}</div>}</div>
            <div className="relative"><button onClick={() => {setNotificationsOpen(!notificationsOpen);setProfileOpen(false);}} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e8ef] text-[#646b7c] hover:bg-[#f7f8fa]"><Bell size={17}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#e55b43]"/></button>{notificationsOpen && <div className="absolute right-0 top-12 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#edf0f4] px-4 py-3"><p className="text-sm font-semibold text-[#252b3d]">Notifications</p><span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">3 new</span></div>{['QC hold requires disposition','Feed usage crossed warning limit','PLT-2026-035 is ready to close'].map((item,index)=><Link key={item} href={slug ? `/${slug}/${index===0?'quality':index===1?'operations':'batches'}`:'#'} onClick={()=>setNotificationsOpen(false)} className="flex gap-3 border-b border-[#f0f1f4] px-4 py-3 hover:bg-[#f8f9fb]"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${index===0?'bg-red-500':index===1?'bg-amber-500':'bg-blue-500'}`}/><span><span className="block text-xs font-semibold text-[#30364b]">{item}</span><span className="mt-1 block text-[10px] text-[#8a90a0]">Demo alert · {index+2}h ago</span></span></Link>)}</div>}</div>
            <div className="relative"><button onClick={() => {setProfileOpen(!profileOpen);setNotificationsOpen(false);}} className="flex h-10 items-center gap-2 rounded-xl border border-[#e4e8ef] bg-white px-2 hover:bg-[#f7f8fa]"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#1c4aa9,#0b1248)] text-[10px] font-bold text-white">{getInitial(user.name || user.email)}</span><span className="hidden max-w-28 truncate text-xs font-semibold text-[#30364b] xl:block">{user.name || 'User'}</span><ChevronDown size={13} className="text-[#8a90a0]"/></button>{profileOpen && <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white p-2 shadow-2xl"><div className="border-b border-[#edf0f4] px-3 py-3"><p className="text-sm font-semibold text-[#252b3d]">{user.name || 'User'}</p><p className="mt-1 truncate text-[10px] text-[#8a90a0]">{user.email}</p><span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">COMPANY ADMIN</span></div><Link href={slug ? `/${slug}/settings?tab=profile`:'#'} onClick={()=>setProfileOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#4e5567] hover:bg-[#f5f7fa]"><UserRound size={15}/> Profile & preferences</Link><Link href="/tenant-admin" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#4e5567] hover:bg-[#f5f7fa]"><ShieldCheck size={15}/> Tenant administration</Link><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#4e5567] hover:bg-[#f5f7fa]"><Headphones size={15}/> Help & support</button><button onClick={() => {logout();router.push('/login');}} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#c24332] hover:bg-red-50"><LogOut size={15}/> Sign out</button></div>}</div>
          </div>
          {mobileOpen && <nav className="flex gap-1 overflow-x-auto border-t border-[#edf0f4] bg-[#0b1248] px-3 py-2 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                slug={slug}
                activePage={activePage}
                compact
              />
            ))}
          </nav>}
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 xl:p-8">
          {currentCompany ? (
            <DemoStoreProvider company={currentCompany}>{children}</DemoStoreProvider>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
