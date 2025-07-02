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

// List reports (admin only)
const listReports = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can view all reports' });
  const reports = await Report.find();
  res.json(reports);
});

// Get single report (involved users or admin)
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  if (
    req.user.role !== 'admin' &&
    report.reporter_id.toString() !== req.user.id &&
    report.reported_user_id.toString() !== req.user.id
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(report);
});

// Delete report (admin only)
const deleteReport = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can delete reports' });
  const report = await Report.findByIdAndDelete(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json({ message: 'Report deleted' });
});

module.exports = { createReport, listReports, getReport, deleteReport }; 