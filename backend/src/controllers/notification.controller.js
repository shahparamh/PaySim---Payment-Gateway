const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userType = req.user.type; // Assuming req.user has type (customer/merchant)
        
        const notifications = await notificationService.getNotifications(userId, userType);
        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (err) {
        next(err);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const success = await notificationService.markAsRead(parseInt(id), userId);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or access denied'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (err) {
        next(err);
    }
};
