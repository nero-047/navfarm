import type {
  NotificationItem,
  NotificationListResponse,
} from '../../contracts/api';
import { api } from '../../lib/api-client';

export function listNotifications() {
  return api.get<NotificationListResponse>('/notifications');
}

export function getUnreadNotificationCount() {
  return api.get<{ unreadCount: number }>('/notifications/unread-count');
}

export function markNotificationRead(notificationId: string) {
  return api.patch<NotificationItem>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  );
}

export function markAllNotificationsRead() {
  return api.post<NotificationListResponse>('/notifications/read-all');
}
