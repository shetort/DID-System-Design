// routes/identityRoutes.js

const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');

// 注册根DID（POST）
router.post('/registerDID', identityController.registerDID); // 测试通过

// // 注册子DID（POST）
// router.post('/registerSubDID', identityController.registerSubDID);

// 更新DID（POST）
router.post('/updateDID', identityController.updateDID); //测试通过

// 用户登录验证（POST）
router.post('/loginSystem', identityController.loginSystem);// 测试通过

// // 颁发者平台登录验证（POST）
router.post('/loginIssuerPlatform', identityController.loginIssuerPlatform);// 测试通过

// 获取用户 DID 列表（GET，使用 query 参数）
router.post('/getUserDIDs', identityController.getUserDIDs); //测试通过
router.post('/getUserDIDDocument', identityController.getUserDIDDocument);//测试通过
router.post('/getVerifyPrivateKey', identityController.getVerifyPrivateKey);//测试通过


router.post('/addIssuer', identityController.addIssuer); //测试通过
router.post('/removeIssuer', identityController.removeIssuer); // 测试通过
router.post('/showAllUsers', identityController.showAllUsers);//测试通过
router.post('/showAllUsersIden', identityController.showAllUsersIden);//测试通过
router.post('/isAdminUser', identityController.isAdminUser); //测试通过
router.post('/isIssuerUser', identityController.isIssuerUser); //测试通过

router.post('/registerIssuerPlatDID', identityController.registerIssuerPlatDID);
router.post('/getUserPlatDIDs', identityController.getUserPlatDIDs);
router.post('/getUserPlatDIDDocument', identityController.getUserPlatDIDDocument);
router.post('/getIssuerPlatAllUserDIDDoc', identityController.getIssuerPlatAllUserDIDDoc);

module.exports = router;
