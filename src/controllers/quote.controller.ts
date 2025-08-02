import { Response } from 'express';
import { QuoteService } from '../services/quote.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { Types } from 'mongoose';
import { PaginationHelper } from '../utils/paginationHelper.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class QuoteController {
  // POST /api/jobs/:jobId/quotes (Craftsman only)
  static async submitQuote(req: IAuthenticatedRequest, res: Response) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId) return ApiResponse.unauthorized(res, 'Unauthorized');
      const { price, notes } = req.body;
      const quote = await QuoteService.submitQuote(
        req.params.jobId,
        new Types.ObjectId(craftsmanId),
        price,
        notes
      );
      return ApiResponse.success(
        res,
        quote,
        'Quote submitted successfully',
        201
      );
    } catch (error) {
      return ApiResponse.badRequest(
        res,
        error instanceof Error ? error.message : 'Failed to submit quote'
      );
    }
  }

  // GET /api/jobs/:jobId/quotes (Client only)
  static async getQuotesForJob(req: IAuthenticatedRequest, res: Response) {
    try {
      // Optionally, check if req.user is the job owner
      const quotes = await QuoteService.getQuotesForJob(req.params.jobId);
      return ApiResponse.success(res, quotes, 'Quotes retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch quotes', 500);
    }
  }

  // POST /api/jobs/:jobId/quotes/:quoteId/:status (Client only)
  static async updateQuoteStatus(req: IAuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      if (!clientId) return ApiResponse.unauthorized(res, 'Unauthorized');

      const { status } = req.params;

      // Validate status parameter
      if (!['accept', 'reject'].includes(status.toLowerCase()))
        return ApiResponse.badRequest(
          res,
          'Status must be either "accept" or "reject"'
        );

      const { job, quote } = await QuoteService.updateQuoteStatus(
        req.params.jobId,
        req.params.quoteId,
        status.toLowerCase() as 'accept' | 'reject',
        new Types.ObjectId(clientId)
      );

      const message =
        status.toLowerCase() === 'accept'
          ? 'Quote accepted and craftsman hired'
          : 'Quote rejected successfully';

      return ApiResponse.success(res, { job, quote }, message);
    } catch (error) {
      return ApiResponse.badRequest(
        res,
        error instanceof Error
          ? error.message
          : `Failed to ${req.params.status} quote`
      );
    }
  }

  // GET /api/users/me/quotes (Craftsman only)
  static async getCraftsmanQuotes(req: IAuthenticatedRequest, res: Response) {
    try {
      const craftsmanId = req.user?.userId;
      if (!craftsmanId) return ApiResponse.unauthorized(res, 'Unauthorized');

      const { page, limit } = PaginationHelper.parseParams(req.query);
      const { status } = req.query;

      const result = await QuoteService.getCraftsmanQuotes(
        new Types.ObjectId(craftsmanId),
        page,
        limit,
        status as string | undefined
      );

      return ApiResponse.success(
        res,
        { data: result.data, pagination: result.pagination },
        'Craftsman quotes retrieved successfully'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch craftsman quotes', 500);
    }
  }
}
