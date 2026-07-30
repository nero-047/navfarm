'use client';

import Link from 'next/link';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { NotificationItem } from '../../../contracts/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../modules/notifications/client';

function notificationTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const { session, status } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listNotifications();
      setItems(response.items);
      setUnreadCount(response.unreadCount);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Notifications could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session) void load();
  }, [load, session, status]);

  async function markOne(notificationId: string) {
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.notificationId === notificationId
          ? { ...item, read: true }
          : item,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      await markNotificationRead(notificationId);
    } catch (cause) {
      setItems(previous);
      setUnreadCount(previous.filter((item) => !item.read).length);
      setError(
        cause instanceof Error
          ? cause.message
          : 'The notification could not be updated.',
      );
    }
  }

  async function markAll() {
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (cause) {
      setItems(previous);
      setUnreadCount(previous.filter((item) => !item.read).length);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Notifications could not be updated.',
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Account updates
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            Notifications
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Review updates from companies and workspaces available to this account.
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void markAll()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--accent)]"
          >
            <CheckCheck size={16} aria-hidden />
            Mark all as read
          </button>
        ) : null}
      </header>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-xs leading-5 text-[var(--text-secondary)]">
        Delivery integrations are not enabled in this demo. These in-app updates
        are restored by Reset demo data.
      </div>

      {error ? (
        <div role="alert" className="nf-danger-state rounded-xl border p-4 text-sm">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 min-h-11 font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <div role="status" className="flex min-h-48 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-secondary)]">
          <RefreshCw size={17} className="animate-spin" aria-hidden />
          Loading notifications…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <Bell className="mx-auto text-[var(--text-muted)]" size={28} aria-hidden />
          <h2 className="mt-3 text-base font-semibold text-[var(--text-primary)]">
            No notifications
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Updates for your accessible work will appear here.
          </p>
        </div>
      ) : (
        <section aria-label="All notifications" className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {unreadCount
                ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'All notifications are read'}
            </p>
          </div>
          <ul className="divide-y divide-[var(--border-subtle)]">
            {items.map((item) => (
              <li
                key={item.notificationId}
                className={`p-5 ${item.read ? '' : 'bg-[var(--accent-muted)]'}`}
              >
                <div className="flex gap-3">
                  <span
                    aria-hidden
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                      item.read ? 'bg-transparent' : 'bg-[var(--accent)]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {notificationTime(item.occurredAt)} · {item.context.label}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      {!item.read ? (
                        <button
                          type="button"
                          onClick={() => void markOne(item.notificationId)}
                          className="min-h-11 text-xs font-semibold text-[var(--accent)]"
                        >
                          Mark as read
                        </button>
                      ) : null}
                      {item.context.href ? (
                        <Link
                          href={item.context.href}
                          onClick={() => {
                            if (!item.read) void markOne(item.notificationId);
                          }}
                          className="inline-flex min-h-11 items-center text-xs font-semibold text-[var(--text-primary)]"
                        >
                          Open related page
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
