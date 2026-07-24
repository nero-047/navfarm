'use client';

import { useEffect, useState } from 'react';
import { ApplicationShell } from '../../components/shell/application-shell';
import { useAuth } from '../../contexts/AuthContext';
import { activeCompanyMembership } from '../../lib/authorization';
import { api } from '../../lib/api-client';

export default function ProfilePage() {
  const { session, refreshSession } = useAuth();
  const [fullName, setFullName] = useState(session?.user.fullName || '');
  const [language, setLanguage] = useState(session?.user.language || 'en');
  const [timezone, setTimezone] = useState(session?.user.timezone || 'Asia/Kolkata');
  const [message, setMessage] = useState('');
  useEffect(() => setFullName(session?.user.fullName || ''), [session?.user.fullName]);
  if (!session) return null;
  const scope = session.user.platformRole === 'SYSTEM_ADMIN' ? 'platform' : activeCompanyMembership(session) ? 'company' : 'tenant';
  const company = activeCompanyMembership(session);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    await api.patch('/users/me', { fullName, language, timezone });
    await refreshSession();
    setMessage('Profile preferences saved.');
  }
  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api.post('/auth/change-password', { currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') });
    setMessage('Password changed.');
    event.currentTarget.reset();
  }

  return (
    <ApplicationShell scope={scope} companySlug={company?.companySlug}>
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
        {message && <div className="lg:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{message}</div>}
        <form onSubmit={saveProfile} className="rounded-2xl border border-[#e1e5ec] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">My profile</h2>
          <p className="mt-1 text-xs text-[#707789]">{session.user.email}</p>
          <label className="mt-5 block text-xs font-medium">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe3ea] px-3 text-sm" /></label>
          <label className="mt-4 block text-xs font-medium">Language<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe3ea] px-3 text-sm"><option value="en">English</option><option value="hi">Hindi</option></select></label>
          <label className="mt-4 block text-xs font-medium">Timezone<select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe3ea] px-3 text-sm"><option>Asia/Kolkata</option><option>UTC</option></select></label>
          <label className="mt-4 flex items-center gap-2 text-xs"><input type="checkbox" defaultChecked /> Receive operational notifications</label>
          <button className="mt-5 rounded-xl bg-[#0b1248] px-4 py-2.5 text-xs font-semibold text-white">Save preferences</button>
        </form>
        <div className="space-y-5">
          <form onSubmit={changePassword} className="rounded-2xl border border-[#e1e5ec] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Security</h2>
            <input name="currentPassword" type="password" required placeholder="Current password" className="mt-5 h-11 w-full rounded-xl border border-[#dfe3ea] px-3 text-sm" />
            <input name="newPassword" type="password" required minLength={8} placeholder="New password" className="mt-3 h-11 w-full rounded-xl border border-[#dfe3ea] px-3 text-sm" />
            <button className="mt-4 rounded-xl border border-[#dfe3ea] px-4 py-2.5 text-xs font-semibold">Change password</button>
          </form>
          <section className="rounded-2xl border border-[#e1e5ec] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Active session</h2>
            <dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><dt className="text-[#707789]">Expires</dt><dd>{new Date(session.expiresAt).toLocaleString()}</dd></div><div className="flex justify-between"><dt className="text-[#707789]">MFA</dt><dd>{session.user.mfaEnabled ? 'Enabled' : 'Not enabled'}</dd></div></dl>
          </section>
        </div>
      </div>
    </ApplicationShell>
  );
}
