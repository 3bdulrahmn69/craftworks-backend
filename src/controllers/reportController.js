const Report = require('../models/Report');
const asyncHandler = require('express-async-handler');

// Create report (any user)
const createReport = asyncHandler(async (req, res) => {
  const { reported_user_id, reason, job_id } = req.body;
  const report = await Report.create({
    reporter_id: req.user.id,
    reported_user_id,
    reason,
    job_id
  });
  res.status(201).json(report);
});

// List reports (admin or moderator)
const listReports = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can view all reports' });
  const reports = await Report.find();
  res.json(reports);
});

// Get single report (involved users or admin)
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  if (!['admin', 'moderator'].includes(req.user.role) && report.reporter_id.toString() !== req.user.id && report.reported_user_id.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(report);
});

// Delete report (admin or moderator)
const deleteReport = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can delete reports' });
  const report = await Report.findByIdAndDelete(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json({ message: 'Report deleted' });
});

module.exports = { createReport, listReports, getReport, deleteReport }; 