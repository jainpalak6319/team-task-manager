const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/dashboard — dashboard stats for current user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Projects user is part of
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }]
    });
    const projectIds = projects.map(p => p._id);

    // Task stats
    const [
      totalTasks, todoTasks, inProgressTasks,
      reviewTasks, doneTasks, overdueTasks, myTasks
    ] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'todo' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'review' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: now },
        status: { $ne: 'done' }
      }),
      Task.countDocuments({ assignee: userId, status: { $ne: 'done' } })
    ]);

    // Recent tasks (last 5 updated)
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Overdue tasks list
    const overdueTasksList = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'done' }
    })
      .populate('assignee', 'name')
      .populate('project', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    // Tasks due soon (next 3 days)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const dueSoonTasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $gte: now, $lte: threeDaysFromNow },
      status: { $ne: 'done' }
    })
      .populate('assignee', 'name')
      .populate('project', 'name')
      .sort({ dueDate: 1 });

    // Admin: total users
    let totalUsers = null;
    if (req.user.role === 'admin') {
      totalUsers = await User.countDocuments();
    }

    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks, todoTasks, inProgressTasks,
        reviewTasks, doneTasks, overdueTasks, myTasks,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        totalUsers
      },
      recentTasks,
      overdueTasksList,
      dueSoonTasks,
      projects: projects.slice(0, 5)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching dashboard data.' });
  }
});

module.exports = router;
