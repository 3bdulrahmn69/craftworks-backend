import { User } from '../models/user.model.js';
import { Types } from 'mongoose';
import { ActionLogService } from './actionLog.service.js';
import { NotificationService } from './notification.service.js';

export class WalletService {
  /**
   * Credit amount to craftsman's wallet for visa payments
   */
  static async creditWallet(
    craftsmanId: Types.ObjectId | string,
    amount: number,
    jobId: string,
    description: string = 'Payment from completed job'
  ) {
    const craftsman = await User.findById(craftsmanId);
    if (!craftsman) {
      throw new Error('Craftsman not found');
    }

    if (craftsman.role !== 'craftsman') {
      throw new Error('Only craftsmen can receive payments');
    }

    // Initialize wallet if not exists
    if (!craftsman.wallet) {
      craftsman.wallet = { balance: 0, withdrawableBalance: 0 };
    }

    // Calculate platform fee (assuming 10% fee)
    const platformFeeRate = 0.1;
    const platformFee = amount * platformFeeRate;
    const netAmount = amount - platformFee;

    // Update wallet balances
    craftsman.wallet.balance += netAmount;
    craftsman.wallet.withdrawableBalance += netAmount;

    await craftsman.save();

    // Log the transaction
    await ActionLogService.logAction({
      userId: craftsmanId.toString(),
      action: 'wallet_credit',
      category: 'financial',
      success: true,
      details: {
        amount: netAmount,
        platformFee,
        originalAmount: amount,
        jobId,
        description,
      },
      ipAddress: '127.0.0.1', // System transaction
      userAgent: 'System',
    });

    // Send notification to craftsman
    await NotificationService.sendNotification({
      user: new Types.ObjectId(craftsmanId),
      type: 'payment',
      title: 'Payment Received',
      message: `You received $${netAmount.toFixed(
        2
      )} in your wallet for job completion. Platform fee: $${platformFee.toFixed(
        2
      )}`,
      data: {
        jobId,
        amount: netAmount,
        platformFee,
        originalAmount: amount,
      },
    });

    return {
      success: true,
      netAmount,
      platformFee,
      newBalance: craftsman.wallet.balance,
    };
  }

  /**
   * Get wallet balance for a craftsman
   */
  static async getWalletBalance(craftsmanId: Types.ObjectId | string) {
    const craftsman = await User.findById(craftsmanId).select('wallet');
    if (!craftsman || craftsman.role !== 'craftsman') {
      throw new Error('Craftsman not found');
    }

    return craftsman.wallet || { balance: 0, withdrawableBalance: 0 };
  }

  /**
   * Process withdrawal request (placeholder for future implementation)
   */
  static async requestWithdrawal(
    craftsmanId: Types.ObjectId | string,
    amount: number
  ) {
    const craftsman = await User.findById(craftsmanId);
    if (!craftsman) {
      throw new Error('Craftsman not found');
    }

    if (!craftsman.wallet || craftsman.wallet.withdrawableBalance < amount) {
      throw new Error('Insufficient withdrawable balance');
    }

    // For now, just log the withdrawal request
    await ActionLogService.logAction({
      userId: craftsmanId.toString(),
      action: 'withdrawal_request',
      category: 'financial',
      success: true,
      details: {
        amount,
        requestedAt: new Date(),
        status: 'pending',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'System',
    });

    // TODO: Integrate with payment processor for actual withdrawal
    return {
      success: true,
      message: 'Withdrawal request submitted successfully',
      amount,
      requestId: new Types.ObjectId().toString(),
    };
  }
}
