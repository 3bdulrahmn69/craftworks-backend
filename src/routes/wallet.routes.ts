import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = Router();

// All wallet routes require authentication and craftsman role
router.use(authenticateJWT);
router.use(authorizeRoles('craftsman'));

/**
 * @route GET /api/wallet/balance
 * @desc Get craftsman's wallet balance
 * @access Private (Craftsman only)
 */
router.get('/balance', WalletController.getWalletBalance);

/**
 * @route POST /api/wallet/withdraw
 * @desc Request withdrawal from wallet
 * @access Private (Craftsman only)
 */
router.post('/withdraw', WalletController.requestWithdrawal);

export { router as walletRoutes };
