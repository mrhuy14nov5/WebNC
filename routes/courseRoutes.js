const express = require('express');
const controller = require('../controllers/courseController');
const { requireAuth, requireRole } = require('../middleware/requireAuth');

const router = express.Router();
router.get('/', controller.list);
router.post('/', requireAuth, requireRole('admin'), controller.create);
router.put('/:id', requireAuth, requireRole('admin'), controller.update);
router.delete('/:id', requireAuth, requireRole('admin'), controller.remove);
router.get('/mine', requireAuth, requireRole('student'), controller.registrations);
router.get('/:id', controller.detail);
router.post('/:id/register', requireAuth, requireRole('student'), controller.register);
router.delete('/:id/register', requireAuth, requireRole('student'), controller.unregister);

module.exports = router;
