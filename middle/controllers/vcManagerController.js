const vcManagerService = require('../services/vcManagerService')
const express = require('express');
// 注册授权VC
exports.issuerVC = async (req, res) => {
    const { senderAddress, issuerAddress, VCtype, issuerDID, issuer, credentialSubject, VCProof, proofPublicKey, expirationDate, subjectAddress } = req.body;
    console.log("senderAddress:", senderAddress);
    console.log("issuer:", issuer);
    console.log("7897987987979878978979878979");

    try {
        const txHash = await vcManagerService.issuerVC(senderAddress, issuerAddress, VCtype, issuerDID, issuer, credentialSubject, VCProof, proofPublicKey, expirationDate, subjectAddress);
        res.status(200).json({
            message: 'VC registered successfully',
            txHash
        });
    } catch (error) {
        console.error('Error registering VC:', error);
        res.status(500).json({ message: 'Failed to register VC', error: error.message });
    }
};


exports.verifyVC = async (req, res) => {
    console.log("in verifyVC");
    const { senderAddress, vcId, didId } = req.body;


    try {
        console.log("in service");
        const isValid = await vcManagerService.verifyVC(senderAddress, vcId, didId);
        res.status(200).json({
            message: 'Authorization verification completed',
            isValid
        });
    } catch (error) {
        console.error('Error verifying VC:', error);
        res.status(500).json({ message: 'Failed to verify VC', error: error.message });
    }
};

exports.getVC = async (req, res) => {
    console.log("inininin");
    const { senderAddress, vcId } = req.body; // 使用 query 参数
    console.log("senderAddress:", senderAddress);
    try {
        const VCContext = await vcManagerService.getVC(senderAddress, vcId);
        console.log("VCCCC:", VCContext)
        res.status(200).json({
            message: 'User VC fetched successfully',
            VCContext
        });
    } catch (error) {
        console.error("Error fetching user VC:", error);
        res.status(500).json({ message: "Failed to fetch user VC", error: error.message });
    }
};

exports.showVCID = async (req, res) => {
    const { senderAddress, subjectAddress } = req.body;

    try {
        const vcHashList = await vcManagerService.showVCID(senderAddress, subjectAddress);
        res.status(200).json({
            message: 'VC check result',
            vcHashList
        });
    } catch (error) {
        console.error("Error find VCList:", error);
        res.status(500).json({ message: "Error find VCList", error: error.message });
    }
};

exports.showIssuedVCID = async (req, res) => {
    const { senderAddress, issuerAddress } = req.body;
    console.log("senderAddress:", senderAddress);
    console.log("issuerAddress:", issuerAddress);
    try {
        const vcHashsList = await vcManagerService.showIssuedVCID(senderAddress, issuerAddress);
        res.status(200).json({
            message: 'issuered VC List successful',
            vcHashsList
        });
    } catch (error) {
        console.error("Error find VCIssuerList:", error);
        res.status(500).json({ message: "Error find VCIssuerList", error: error.message });
    }
};

exports.revokeVC = async (req, res) => {
    const { senderAddress, vcId } = req.body;
    console.log("senderAddress:", senderAddress);
    console.log("vcId:", vcId);
    try {
        await vcManagerService.revokeVC(senderAddress, vcId);
        res.status(200).json({
            message: 'revoke VC successful',
        });
    } catch (error) {
        console.error("Error revoke VC:", error);
        res.status(500).json({ message: "Error revoke VC", error: error.message });
    }
};


exports.submitApplication = async (req, res) => {
    const { senderAddress, issuerAddress, vcType, data } = req.body;
    console.log("senderAddress:", senderAddress);

    try {
        await vcManagerService.submitApplication(senderAddress, issuerAddress, vcType, data, false);
        res.status(200).json({
            message: 'revoke VC successful',
        });
    } catch (error) {
        console.error("Error revoke VC:", error);
        res.status(500).json({ message: "Error revoke VC", error: error.message });
    }
};
exports.approveApplication = async (req, res) => {
    const { senderAddress, applicationId } = req.body;
    console.log("senderAddress:", senderAddress);
    console.log("applicationId:", applicationId);
    try {
        await vcManagerService.approveApplication(senderAddress, applicationId);
        res.status(200).json({
            message: 'revoke VC successful',
        });
    } catch (error) {
        console.error("Error revoke VC:", error);
        res.status(500).json({ message: "Error revoke VC", error: error.message });
    }
};

exports.getApplicationIds = async (req, res) => {
    const { senderAddress, userAddress } = req.body;

    console.log("getApplicationIds senderAddress:", senderAddress);
    console.log("getApplicationIds userAddress:", userAddress);
    try {
        const appIDList = await vcManagerService.getApplicationIds(senderAddress, userAddress);
        console.log("uuuuuuuuuuuuuuuuuuuuuuuu:", appIDList);
        const appIDLists = appIDList.map(num => Number(num));
        console.log("uuuuuuuuuuuuuuuuuuuuuuuuintArray:", appIDLists);

        res.status(200).json({
            message: 'issuered VC List successful',
            appIDLists
        });
    } catch (error) {
        console.error("Error find VCIssuerList:", error);
        res.status(500).json({ message: "Error find VCIssuerList", error: error.message });
    }
};


exports.getIssuerApplications = async (req, res) => {
    const { issuerAddress } = req.body;
    console.log("issuerAddress:", issuerAddress);
    try {
        const appIDList = await vcManagerService.getIssuerApplications(issuerAddress);
        // console.log("uuuuuuuuuuuuuuuuuuuuuuuu:", appIDList);
        const issuerAppIDLists = appIDList.map(num => Number(num));
        // console.log("uuuuuuuuuuuuuuuuuuuuuuuuintArray:", issuerAppIDLists);
        res.status(200).json({
            message: 'issuered VC List successful',
            issuerAppIDLists
        });
    } catch (error) {
        console.error("Error find VCIssuerList:", error);
        res.status(500).json({ message: "Error find VCIssuerList", error: error.message });
    }
};

exports.getApplication = async (req, res) => {
    const { senderAddress, applicationId } = req.body;
    console.log("senderAddress:", senderAddress);
    console.log("applicationId:", applicationId);
    try {
        const appList = await vcManagerService.getApplication(senderAddress, applicationId);
        res.status(200).json({
            message: 'issuered VC List successful',
            appList
        });
    } catch (error) {
        console.error("Error find VCIssuerList:", error);
        res.status(500).json({ message: "Error find VCIssuerList", error: error.message });
    }
};

exports.setVP = async (req, res) => {
    const { senderAddress, id, vpShow } = req.body;
    console.log("senderAddress:", senderAddress);
    try {
        const appList = await vcManagerService.setVP(senderAddress, id, vpShow);
        res.status(200).json({
            message: 'issuered VC List successful',
            appList
        });
    } catch (error) {
        console.error("Error find VCIssuerList:", error);
        res.status(500).json({ message: "Error find VCIssuerList", error: error.message });
    }
};

exports.getVPShow = async (req, res) => {
    const { senderAddress, vcId } = req.body;
    console.log("senderAddress:", senderAddress);
    console.log("vcId:", vcId);
    try {
        const VPShow = await vcManagerService.getVPShow(senderAddress, vcId);
        res.status(200).json({
            message: 'issuered VC List successful',
            VPShow
        });
    } catch (error) {
        console.error("Error find VCIssuerList:", error);
        res.status(500).json({ message: "Error find VCIssuerList", error: error.message });
    }
};