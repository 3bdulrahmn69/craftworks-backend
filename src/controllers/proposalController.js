const Proposal = require('../models/Proposal');
const Job = require('../models/Job');
const asyncHandler = require('express-async-handler');

// Create proposal (craftsman only)
const createProposal = asyncHandler(async (req, res) => {
  if (req.user.role !== 'craftsman') return res.status(403).json({ message: 'Only craftsmen can submit proposals' });
  const { job_id, cover_letter, price_offer } = req.body;
  const job = await Job.findById(job_id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  const proposal = await Proposal.create({
    job_id,
    craftsman_id: req.user.id,
    cover_letter,
    price_offer
  });
  res.status(201).json(proposal);
});

// List proposals (paginated, only for job owner, craftsman, or admin)
const listProposals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, job_id, status } = req.query;
  const filter = {};
  if (job_id) filter.job_id = job_id;
  if (status) filter.status = status;
  if (req.user.role === 'craftsman') filter.craftsman_id = req.user.id;
  if (req.user.role === 'client') filter.job_id = { $in: await Job.find({ client_id: req.user.id }).distinct('_id') };
  const proposals = await Proposal.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ created_at: -1 });
  res.json(proposals);
});

// Get single proposal (only involved users or admin)
const getProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
  if (
    req.user.role !== 'admin' &&
    proposal.craftsman_id.toString() !== req.user.id &&
    !(await Job.findOne({ _id: proposal.job_id, client_id: req.user.id }))
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(proposal);
});

// Update proposal status (only job owner or admin)
const updateProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
  const job = await Job.findById(proposal.job_id);
  if (job.client_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (req.body.status) proposal.status = req.body.status;
  await proposal.save();
  res.json(proposal);
});

// Delete proposal (only craftsman or admin)
const deleteProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
  if (proposal.craftsman_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await proposal.deleteOne();
  res.json({ message: 'Proposal deleted' });
});

module.exports = { createProposal, listProposals, getProposal, updateProposal, deleteProposal }; 