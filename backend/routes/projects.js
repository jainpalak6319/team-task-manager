const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, projectRole } = require('../middleware/auth');

// GET /api/projects — list projects user is part of
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const taskCount = await Task.countDocuments({ project: p._id });
      const completedCount = await Task.countDocuments({ project: p._id, status: 'done' });
      return { ...p.toJSON(), taskCount, completedCount };
    }));

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects.' });
  }
});

// POST /api/projects — create project
router.post('/', protect, [
  body('name').trim().isLength({ min: 3 }).withMessage('Project name must be at least 3 characters'),
  body('description').optional().trim(),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline format')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, description, deadline, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      deadline,
      tags,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    await project.populate('owner', 'name email');
    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    res.status(500).json({ message: 'Error creating project.' });
  }
});

// GET /api/projects/:id — get single project
router.get('/:id', protect, projectRole(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project.' });
  }
});

// PUT /api/projects/:id — update project (admin only)
router.put('/:id', protect, projectRole('admin'), [
  body('name').optional().trim().isLength({ min: 3 }),
  body('status').optional().isIn(['active', 'completed', 'on-hold', 'cancelled'])
], async (req, res) => {
  try {
    const { name, description, deadline, status, tags } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, deadline, status, tags },
      { new: true, runValidators: true }
    ).populate('owner', 'name email').populate('members.user', 'name email');

    res.json({ message: 'Project updated', project });
  } catch (error) {
    res.status(500).json({ message: 'Error updating project.' });
  }
});

// DELETE /api/projects/:id — delete project (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete it.' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project and all its tasks deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project.' });
  }
});

// POST /api/projects/:id/members — add member
router.post('/:id/members', protect, projectRole('admin'), [
  body('email').isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member'])
], async (req, res) => {
  try {
    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found with that email.' });

    const project = req.project;
    const alreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member.' });

    project.members.push({ user: userToAdd._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ message: `${userToAdd.name} added to project`, project });
  } catch (error) {
    res.status(500).json({ message: 'Error adding member.' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', protect, projectRole('admin'), async (req, res) => {
  try {
    const project = req.project;
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    res.json({ message: 'Member removed from project.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member.' });
  }
});

// GET /api/projects/:id/tasks — get tasks for a project
router.get('/:projectId/tasks', protect, projectRole(), async (req, res) => {
  try {
    const { status, priority, assignee } = req.query;
    const filter = { project: req.params.projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks.' });
  }
});

module.exports = router;
