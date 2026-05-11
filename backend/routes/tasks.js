const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect, projectRole } = require('../middleware/auth');

// Helper: verify user is project member
const isMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  const isOwner = project.owner.toString() === userId.toString();
  const isMem = project.members.some(m => m.user.toString() === userId.toString());
  return isOwner || isMem;
};

// POST /api/tasks — create task
router.post('/', protect, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { title, description, project, assignee, priority, dueDate, tags } = req.body;

    const canAccess = await isMember(project, req.user._id);
    if (!canAccess) return res.status(403).json({ message: 'Not a project member.' });

    const task = await Task.create({
      title, description, project,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority, dueDate, tags
    });

    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task.' });
  }
});

// GET /api/tasks/:id — get single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email')
      .populate('project', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const canAccess = await isMember(task.project._id, req.user._id);
    if (!canAccess) return res.status(403).json({ message: 'Access denied.' });

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task.' });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', protect, [
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const canAccess = await isMember(task.project._id, req.user._id);
    if (!canAccess) return res.status(403).json({ message: 'Access denied.' });

    const { title, description, assignee, status, priority, dueDate, tags } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ message: 'Task updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task.' });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const project = await Project.findById(task.project._id);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = project.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isOwner && !isCreator && !isAdmin) {
      return res.status(403).json({ message: 'You cannot delete this task.' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task.' });
  }
});

// POST /api/tasks/:id/comments — add comment
router.post('/:id/comments', protect, [
  body('text').trim().notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const canAccess = await isMember(task.project._id, req.user._id);
    if (!canAccess) return res.status(403).json({ message: 'Access denied.' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email');

    res.json({ message: 'Comment added', comments: task.comments });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment.' });
  }
});

// GET /api/tasks/my/assigned — tasks assigned to me
router.get('/my/assigned', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assigned tasks.' });
  }
});

module.exports = router;
