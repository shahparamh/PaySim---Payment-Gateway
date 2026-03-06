const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { validate, profileSchema, pinChangeSchema } = require('../middleware/validator');

// All profile routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', profileSchema, validate, userController.updateProfile);
router.patch('/profile/pin', pinChangeSchema, validate, userController.changePin);

module.exports = router;
