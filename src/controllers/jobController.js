const Job = require('../models/Job');
const asyncHandler = require('express-async-handler');

// Create job (client only)
const createJob = asyncHandler(async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can post jobs' });
  const { title, description, budget, category, location, deadline } = req.body;
  const job = await Job.create({
    client_id: req.user.id,
    title, description, budget, category, location, deadline
  });
  res.status(201).json(job);
});

// List jobs with pagination/filtering
const listJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, category } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  const jobs = await Job.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ created_at: -1 });
  res.json(jobs);
});

// Get single job
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

// Update job (owner or admin)
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.client_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  Object.assign(job, req.body);
  await job.save();
  res.json(job);
});

// Delete job (owner or admin)
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.client_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await job.deleteOne();
  res.json({ message: 'Job deleted' });
});

module.exports = { createJob, listJobs, getJob, updateJob, deleteJob }; 