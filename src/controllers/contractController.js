const Contract = require('../models/Contract');
const Proposal = require('../models/Proposal');
const Job = require('../models/Job');
const asyncHandler = require('express-async-handler');

// Create contract (when proposal is accepted)
const createContract = asyncHandler(async (req, res) => {
  const { proposal_id, start_date, end_date, final_price } = req.body;
  const proposal = await Proposal.findById(proposal_id);
  if (!proposal || proposal.status !== 'accepted') return res.status(400).json({ message: 'Proposal must be accepted' });
  const job = await Job.findById(proposal.job_id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  const contract = await Contract.create({
    job_id: proposal.job_id,
    craftsman_id: proposal.craftsman_id,
    client_id: job.client_id,
    start_date,
    end_date,
    status: 'active',
    final_price
  });
  res.status(201).json(contract);
});

// List contracts (involved users or admin)
const listContracts = asyncHandler(async (req, res) => {
  const filter = ['admin', 'moderator'].includes(req.user.role) ? {} : { $or: [{ client_id: req.user.id }, { craftsman_id: req.user.id }] };
  const contracts = await Contract.find(filter);
  res.json(contracts);
});

// Get single contract
const getContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  if (!['admin', 'moderator'].includes(req.user.role) && contract.client_id.toString() !== req.user.id && contract.craftsman_id.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(contract);
});

// Update contract (admin only)
const updateContract = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can update contracts' });
  const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.json(contract);
});

// Delete contract (admin only)
const deleteContract = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can delete contracts' });
  const contract = await Contract.findByIdAndDelete(req.params.id);
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.json({ message: 'Contract deleted' });
});

module.exports = { createContract, listContracts, getContract, updateContract, deleteContract }; 