// routes/authorizationRoutes.js
const express = require('express');
const router = express.Router();
const vcManagerController = require('../controllers/vcManagerController');

router.post('/issuerVC', vcManagerController.issuerVC); //测试通过
router.post('/verifyVC', vcManagerController.verifyVC); //测试通过
router.post('/getVC', vcManagerController.getVC); //测试通过
router.post('/showVCID', vcManagerController.showVCID); //测试通过
router.post('/showIssuedVCID', vcManagerController.showIssuedVCID);//测试通过
router.post('/revokeVC', vcManagerController.revokeVC);

router.post('/submitApplication', vcManagerController.submitApplication);
router.post('/approveApplication', vcManagerController.approveApplication);
router.post('/getApplicationIds', vcManagerController.getApplicationIds);
router.post('/getIssuerApplications', vcManagerController.getIssuerApplications);
router.post('/getApplication', vcManagerController.getApplication);

router.post('/setVP', vcManagerController.setVP);
router.post('/getVPShow', vcManagerController.getVPShow);

module.exports = router;
