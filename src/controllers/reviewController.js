const Review = require('../models/Review');
const Job = require('../models/Job');
const User = require('../models/User');
const Contract = require('../models/Contract');
const asyncHandler = require('express-async-handler');

// Create review (only users involved in a job)
const createReview = asyncHandler(async (req, res) => {
  const { to_user_id, job_id, rating, comment } = req.body;
  const job = await Job.findById(job_id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  // Find completed contract for this job and users
  const contract = await Contract.findOne({ job_id, status: 'completed', $or: [
    { client_id: req.user.id, craftsman_id: to_user_id },
    { client_id: to_user_id, craftsman_id: req.user.id }
  ] });
  if (!contract) return res.status(403).json({ message: 'No completed contract between users for this job' });
  if (contract.reviewed) return res.status(400).json({ message: 'Review already submitted for this contract' });
  const review = await Review.create({
    from_user_id: req.user.id,
    to_user_id,
    job_id,
    rating,
    comment
  });
  // Mark contract as reviewed
  contract.reviewed = true;
  await contract.save();
  // Update reviewed user's rating
  const reviews = await Review.find({ to_user_id });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await User.findByIdAndUpdate(to_user_id, { rating: avgRating, rating_count: reviews.length });
  res.status(201).json(review);
});

// List reviews (all authenticated users)
const listReviews = asyncHandler(async (req, res) => {
  const { job_id, to_user_id } = req.query;
  const filter = {};
  if (job_id) filter.job_id = job_id;
  if (to_user_id) filter.to_user_id = to_user_id;
  const reviews = await Review.find(filter);
  res.json(reviews);
});

// Get single review
const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  res.json(review);
});

// Update review (only author)
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (review.from_user_id.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  Object.assign(review, req.body);
  await review.save();
  res.json(review);
});

// Delete review (admin or moderator only)
const deleteReview = asyncHandler(async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Only admin or moderator can delete reviews' });
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  res.json({ message: 'Review deleted' });
});

module.exports = { createReview, listReviews, getReview, updateReview, deleteReview }; 