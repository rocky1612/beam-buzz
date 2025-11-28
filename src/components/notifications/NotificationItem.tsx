import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle2, AlertCircle, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    link?: string;
  };
  onClose: () => void;
}

export const NotificationItem = ({ notification, onClose }: NotificationItemProps) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "info":
        return <Info className="h-5 w-5 text-info" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    onClose();
  };

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg transition-all cursor-pointer hover:bg-accent",
        !notification.is_read && "bg-accent/50"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="flex-shrink-0 h-2 w-2 rounded-full bg-notification" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          deleteNotification(notification.id);
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
