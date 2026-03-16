const AppDataSource = require('../config/database');
const { notifications } = require('../entities/entities');
const { LessThan } = require('typeorm');

class NotificationService {
    constructor() {
        this.notificationRepository = AppDataSource.getRepository(notifications);
    }

    async createNotification(userId, userType, title, message, type = 'info') {
        try {
            const notification = this.notificationRepository.create({
                user_id: userId,
                user_type: userType,
                title,
                message,
                type,
                is_read: 0
            });
            return await this.notificationRepository.save(notification);
        } catch (err) {
            console.error('Error creating notification:', err.message);
            return null;
        }
    }

    async getNotifications(userId, userType) {
        // Auto-clear logic: Remove notifications older than 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        try {
            // Delete old notifications
            await this.notificationRepository.delete({
                created_at: LessThan(twentyFourHoursAgo)
            });

            // Fetch recent notifications
            return await this.notificationRepository.find({
                where: { user_id: userId, user_type: userType },
                order: { created_at: 'DESC' },
                take: 20
            });
        } catch (err) {
            console.error('Error fetching notifications:', err.message);
            return [];
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            await this.notificationRepository.update(
                { id: notificationId, user_id: userId },
                { is_read: 1 }
            );
            return true;
        } catch (err) {
            console.error('Error marking notification as read:', err.message);
            return false;
        }
    }
}

module.exports = new NotificationService();
