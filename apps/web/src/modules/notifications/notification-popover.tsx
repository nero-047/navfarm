'use client';

import Link from 'next/link';
import { Bell, CheckCheck, RefreshCw, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { NotificationItem } from '../../contracts/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './client';

function notificationTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function NotificationPopover() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    bellRef.current?.focus();
  }, []);

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
    if (!session?.user.userId) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    void getUnreadNotificationCount()
      .then((response) => setUnreadCount(response.unreadCount))
      .catch(() => setUnreadCount(0));
  }, [session?.user.userId]);

  useEffect(() => {
    if (!open) return;
    void load();
    const panel = panelRef.current;
    panel
      ?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const handlePointer = (event: PointerEvent) => {
      if (
        !panelRef.current?.contains(event.target as Node) &&
        !bellRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    window.addEventListener('pointerdown', handlePointer);
    return () => {
      window.removeEventListener('keydown', handleKeyboard);
      window.removeEventListener('pointerdown', handlePointer);
    };
  }, [close, load, open]);

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
    <div className="relative">
      <button
        ref={bellRef}
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notification-popover"
        onClick={() => setOpen((current) => !current)}
        className="nf-touch relative flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)]"
      >
        <Bell size={17} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          id="notification-popover"
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-20 z-50 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:max-h-[min(650px,calc(100vh-5rem))] sm:w-[400px]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] p-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Notifications
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {unreadCount
                  ? `${unreadCount} unread for this account`
                  : 'You are all caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close notifications"
              className="nf-touch flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            >
              <X size={17} aria-hidden />
            </button>
          </div>
          {items.some((item) => !item.read) ? (
            <div className="border-b border-[var(--border-subtle)] px-4 py-2">
              <button
                type="button"
                onClick={() => void markAll()}
                className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--accent)]"
              >
                <CheckCheck size={15} aria-hidden />
                Mark all as read
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
                <RefreshCw size={15} className="animate-spin" aria-hidden />
                Loading notifications…
              </div>
            ) : error ? (
              <div role="alert" className="m-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">
                <p>{error}</p>
                <button type="button" onClick={() => void load()} className="mt-3 min-h-11 font-semibold underline">
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto text-[var(--text-muted)]" size={24} aria-hidden />
                <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">No notifications</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Updates for your accessible work will appear here.</p>
              </div>
            ) : (
              <ul aria-label="Notification list" className="divide-y divide-[var(--border-subtle)]">
                {items.map((item) => (
                  <li key={item.notificationId} className={item.read ? '' : 'bg-[var(--accent-muted)]'}>
                    <div className="p-4">
                      <div className="flex gap-3">
                        <span
                          aria-hidden
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            item.read ? 'bg-transparent' : 'bg-[var(--accent)]'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-5 text-[var(--text-primary)]">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                            {item.description}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--text-muted)]">
                            <span>{notificationTime(item.occurredAt)}</span>
                            <span aria-hidden>·</span>
                            <span>{item.context.label}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
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
                                  setOpen(false);
                                }}
                                className="inline-flex min-h-11 items-center text-xs font-semibold text-[var(--text-primary)]"
                              >
                                Open
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-[var(--border-subtle)] p-3">
            <Link
              href="/console/notifications"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-xl text-xs font-semibold text-[var(--accent)] hover:bg-[var(--surface-raised)]"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
