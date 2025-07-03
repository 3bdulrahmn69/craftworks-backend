const Review = require('../models/Review');
const Job = require('../models/Job');
const asyncHandler = require('express-async-handler');

// Create review (only users involved in a job)
const createReview = asyncHandler(async (req, res) => {
  const { to_user_id, job_id, rating, comment } = req.body;
  const job = await Job.findById(job_id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.client_id.toString() !== req.user.id && req.user.role !== 'craftsman') {
    return res.status(403).json({ message: 'Not allowed to review for this job' });
  }
  const review = await Review.create({
    from_user_id: req.user.id,
    to_user_id,
    job_id,
    rating,
    comment
  });
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