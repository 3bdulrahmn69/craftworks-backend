const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const contractController = require('../controllers/contractController');

router.post('/', auth, contractController.createContract);
router.get('/', auth, contractController.listContracts);
router.get('/:id', auth, contractController.getContract);
router.put('/:id', auth, contractController.updateContract);
router.delete('/:id', auth, contractController.deleteContract);

module.exports = router; 