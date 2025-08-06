import { Response } from 'express';
import { WalletService } from '../services/wallet.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class WalletController {
  /**
   * GET /api/wallet/balance - Get craftsman's wallet balance
   */
  static async getWalletBalance(req: IAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.unauthorized(res, 'Unauthorized');

      const wallet = await WalletService.getWalletBalance(userId);
      return ApiResponse.success(
        res,
        wallet,
        'Wallet balance retrieved successfully'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get wallet balance';
      return ApiResponse.badRequest(res, message);
    }
  }

  /**
   * POST /api/wallet/withdraw - Request withdrawal from wallet
   */
  static async requestWithdrawal(req: IAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.unauthorized(res, 'Unauthorized');

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return ApiResponse.badRequest(
          res,
          'Valid withdrawal amount is required'
        );
      }

      const result = await WalletService.requestWithdrawal(userId, amount);
      return ApiResponse.success(
        res,
        result,
        'Withdrawal request submitted successfully'
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to process withdrawal request';
      return ApiResponse.badRequest(res, message);
    }
  }
}
