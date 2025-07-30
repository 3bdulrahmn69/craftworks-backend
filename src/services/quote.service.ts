import { Quote } from '../models/quote.model.js';
import { Job } from '../models/job.model.js';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service.js';

export class QuoteService {
  static async submitQuote(
    jobId: string,
    craftsmanId: Types.ObjectId,
    price: number,
    notes?: string
  ) {
    // Check if craftsman already applied for this job
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');

    if (job.appliedCraftsmen.includes(craftsmanId))
      throw new Error('You have already applied for this job');

    // Check if craftsman already submitted a quote for this job (additional safety check)
    const existing = await Quote.findOne({
      job: jobId,
      craftsman: craftsmanId,
    });
    if (existing)
      throw new Error('You have already submitted a quote for this job');

    // Add craftsman to appliedCraftsmen array
    job.appliedCraftsmen.push(craftsmanId);
    await job.save();

    const quote = new Quote({
      job: jobId,
      craftsman: craftsmanId,
      price,
      notes,
    });
    await quote.save();

    // Notify client
    const jobForNotification = await Job.findById(jobId).lean();
    if (jobForNotification && jobForNotification.client)
      await NotificationService.sendNotification({
        user: jobForNotification.client,
        type: 'quote',
        title: 'New Quote Received',
        message: `A craftsman has submitted a quote for your job: ${jobForNotification.title}`,
        data: { jobId, quoteId: quote._id, craftsmanId },
      });

    return quote;
  }

  static async getQuotesForJob(jobId: string) {
    return Quote.find({ job: jobId })
      .populate('craftsman', 'fullName profilePicture rating ratingCount')
      .lean();
  }

  static async acceptQuote(
    jobId: string,
    quoteId: string,
    clientId: Types.ObjectId
  ) {
    // Find the quote and job
    const quote = await Quote.findOne({ _id: quoteId, job: jobId });
    if (!quote) throw new Error('Quote not found');

    const job = await Job.findOne({ _id: jobId, client: clientId });
    if (!job) throw new Error('Job not found or not owned by user');

    // Accept the quote
    quote.status = 'Accepted';
    await quote.save();
    // Decline all other quotes for this job
    await Quote.updateMany(
      { job: jobId, _id: { $ne: quoteId } },
      { status: 'Declined' }
    );
    // Update job status and assign craftsman
    job.status = 'Hired';
    job.craftsman = quote.craftsman;
    job.jobPrice = quote.price;
    job.hiredAt = new Date();
    await job.save();
    // Notify craftsman
    await NotificationService.sendNotification({
      user: quote.craftsman,
      type: 'quote',
      title: 'Your Quote Was Accepted',
      message: `Your quote for the job '${job.title}' was accepted. You have been hired!`,
      data: { jobId, quoteId, clientId },
    });
    return { job, quote };
  }

  /**
   * Get all quotes submitted by a specific craftsman
   */
  static async getCraftsmanQuotes(
    craftsmanId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    status?: string
  ) {
    const filter: any = { craftsman: craftsmanId };
    if (status) filter.status = { $regex: new RegExp(`^${status}$`, 'i') };

    const skip = (page - 1) * limit;
    const sort = { createdAt: -1 as const }; // Most recent first

    const [quotes, totalItems] = await Promise.all([
      Quote.find(filter)
        .populate({
          path: 'job',
          select:
            'title description category photos address location status client createdAt',
          populate: {
            path: 'client',
            select: 'fullName profilePicture rating ratingCount',
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Quote.countDocuments(filter),
    ]);

    // Normalize status to lowercase in the returned data
    const normalizedQuotes = quotes.map((q: any) => ({
      ...q,
      status: typeof q.status === 'string' ? q.status.toLowerCase() : q.status,
    }));

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: normalizedQuotes,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
