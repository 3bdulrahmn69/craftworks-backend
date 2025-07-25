import { Response } from 'express';
import { QuoteService } from '../services/quote.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';
import { PaginationHelper } from '../utils/paginationHelper.js';

export class QuoteController {
  // POST /api/jobs/:jobId/quotes (Craftsman only)
  static async submitQuote(req: IAuthenticatedRequest, res: Response) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId)
        return res.status(401).json({ message: 'Unauthorized' });
      const { price, notes } = req.body;
      const quote = await QuoteService.submitQuote(
        req.params.jobId,
        new Types.ObjectId(craftsmanId),
        price,
        notes
      );
      return res.status(201).json({ data: quote });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to submit quote',
      });
    }
  }

  // GET /api/jobs/:jobId/quotes (Client only)
  static async getQuotesForJob(req: IAuthenticatedRequest, res: Response) {
    try {
      // Optionally, check if req.user is the job owner
      const quotes = await QuoteService.getQuotesForJob(req.params.jobId);
      return res.json({ data: quotes });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch quotes' });
    }
  }

  // POST /api/jobs/:jobId/quotes/:quoteId/accept (Client only)
  static async acceptQuote(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return res.status(401).json({ message: 'Unauthorized' });
      const { job, quote } = await QuoteService.acceptQuote(
        req.params.jobId,
        req.params.quoteId,
        new Types.ObjectId(clientId)
      );
      return res.json({
        message: 'Quote accepted and craftsman hired',
        job,
        quote,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to accept quote',
      });
    }
  }

  // GET /api/users/me/quotes (Craftsman only)
  static async getCraftsmanQuotes(req: IAuthenticatedRequest, res: Response) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId)
        return res.status(401).json({ message: 'Unauthorized' });

      const { page, limit } = PaginationHelper.parseParams(req.query);
      const { status } = req.query;

      const result = await QuoteService.getCraftsmanQuotes(
        new Types.ObjectId(craftsmanId),
        page,
        limit,
        status as string | undefined
      );

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Failed to fetch craftsman quotes',
        success: false,
      });
    }
  }
}
