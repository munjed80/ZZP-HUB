"use client";

import { useState, useEffect } from "react";
import { Bell, Check, MessageSquare, FileText, Receipt, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  showUnreadOnly?: boolean;
  limit?: number;
}

export function NotificationsPanel({ showUnreadOnly = false, limit = 50 }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const params = new URLSearchParams({
        unreadOnly: showUnreadOnly.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Only set up auto-refresh if page is visible
    let interval: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      } else {
        loadNotifications();
        interval = setInterval(loadNotifications, 60000);
      }
    };
    
    // Initial setup
    if (!document.hidden) {
      interval = setInterval(loadNotifications, 60000);
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnreadOnly, limit]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(notifications.map(n => 
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - notificationIds.length));
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("Alle notificaties gemarkeerd als gelezen");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Fout bij markeren van notificaties");
    }
  };

  const getIcon = (type: string) => {
    if (type.includes("note")) return MessageSquare;
    if (type.includes("invoice")) return FileText;
    if (type.includes("expense")) return Receipt;
    if (type.includes("event")) return Calendar;
    return Bell;
  };

  const getLink = (notification: Notification): string | null => {
    if (!notification.entityType || !notification.entityId) return null;

    switch (notification.entityType) {
      case "invoice":
        return `/facturen/${notification.entityId}`;
      case "expense":
        return `/uitgaven/${notification.entityId}`;
      case "event":
        return `/agenda`;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Zojuist";
    if (diffMins < 60) return `${diffMins} min geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays < 7) return `${diffDays} dag${diffDays > 1 ? "en" : ""} geleden`;

    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Notificaties</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Markeer alles als gelezen
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Geen notificaties</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const link = getLink(notification);

              const content = (
                <div
                  className={`px-6 py-4 transition-colors hover:bg-muted/50 cursor-pointer ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead([notification.id]);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-2 rounded-lg ${
                        !notification.isRead
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            !notification.isRead ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );

              if (link) {
                return (
                  <Link key={notification.id} href={link}>
                    {content}
                  </Link>
                );
              }

              return <div key={notification.id}>{content}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
