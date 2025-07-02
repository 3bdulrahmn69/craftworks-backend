const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const proposalController = require('../controllers/proposalController');

router.post('/', auth, proposalController.createProposal);
router.get('/', auth, proposalController.listProposals);
router.get('/:id', auth, proposalController.getProposal);
router.put('/:id', auth, proposalController.updateProposal);
router.delete('/:id', auth, proposalController.deleteProposal);

module.exports = router; 