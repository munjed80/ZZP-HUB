import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccountantSession } from "@/lib/auth/accountant-session";
import { getServerAuthSession } from "@/lib/auth";

/**
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const accountantSession = await getAccountantSession();
    const regularSession = await getServerAuthSession();
    const userId = accountantSession?.userId || regularSession?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Niet geauthenticeerd" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    interface NotificationWhere {
      userId: string;
      isRead?: boolean;
    }

    const where: NotificationWhere = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij ophalen van notificaties" },
      { status: 500 }
    );
  }
}

/**
 * Mark notifications as read
 */
export async function PUT(request: NextRequest) {
  try {
    const accountantSession = await getAccountantSession();
    const regularSession = await getServerAuthSession();
    const userId = accountantSession?.userId || regularSession?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Niet geauthenticeerd" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId, // Ensure user owns these notifications
        },
        data: { isRead: true },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Ontbrekende vereiste velden" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notificaties gemarkeerd als gelezen",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij markeren van notificaties" },
      { status: 500 }
    );
  }
}
