// Notification.interface: Module file for the Notification.interface functionality.



export interface NotificationFilters {
    limit?: number;
    isRead?: boolean;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
}