// identityController.js
const express = require('express');
const router = express.Router();
// const web3Service = require('../services/web3Service');
// const { ethers } = require('ethers');

const identityService = require('../services/identityService');


exports.registerDID = async (req, res) => {
    const { senderAddress, userAddress, controller, verificationMethods, authenticationID, service, keyAgreements, capabilityDelegationID, capabilityInvocationID, verifyPrivateKey, keyAgrPrivateKey } = req.body;

    console.log("IN REGISTERDID");
    console.log("senderAddress:", senderAddress);
    console.log("userAddress:", userAddress);
    console.log("controller:", controller);
    console.log("verificationMethods:", verificationMethods);
    console.log("authenticationID:", authenticationID);
    console.log("service:", service);
    console.log("keyAgreements:", keyAgreements);
    console.log("capabilityDelegationID:", capabilityDelegationID);
    console.log("capabilityInvocationID:", capabilityInvocationID);

    try {
        const result = await identityService.registerDID({ senderAddress, userAddress, controller, verificationMethods, authenticationID, service, keyAgreements, capabilityDelegationID, capabilityInvocationID, verifyPrivateKey, keyAgrPrivateKey });
        res.status(200).json({ message: 'Root DID registered successfully', result });
    } catch (error) {
        res.status(500).json({ message: 'Failed to register root DID', error: error.message });
    }
};


exports.loginSystem = async (req, res) => {
    const { senderAddress, id, derSignatureHex, msgHash, userVeriPublic } = req.body;
    try {
        const isValid = await identityService.loginSystem({ senderAddress, id, derSignatureHex, msgHash, userVeriPublic });
        res.status(200).json({ message: 'Login successful', isValid });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

exports.loginIssuerPlatform = async (req, res) => {
    const { senderAddress, id, issuerAddress } = req.body;
    try {
        const isValid = await identityService.loginIssuerPlatform({ senderAddress, id, issuerAddress });
        res.status(200).json({ message: 'Login successful', isValid });
    } catch (error) {
        res.status(500).json({ message: 'Issuer login failed', error: error.message });
    }
};


exports.updateDID = async (req, res) => {
    const { senderAddress, userAddress, controller, verificationMethods, authenticationID, service, keyAgreements, capabilityDelegationID, capabilityInvocationID, verifyPrivateKey, keyAgrPrivateKey } = req.body;
    try {
        const result = await identityService.updateDID({ senderAddress, userAddress, controller, verificationMethods, authenticationID, service, keyAgreements, capabilityDelegationID, capabilityInvocationID, verifyPrivateKey, keyAgrPrivateKey });
        res.status(200).json({ message: 'DID updated successfully', result });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update DID', error: error.message });
    }
};



exports.getUserDIDs = async (req, res) => {
    const { senderAddress, userAddress } = req.body;
    try {
        const dids = await identityService.getUserDIDs({ senderAddress, userAddress });
        res.status(200).json({ message: 'User DID list fetched successfully', dids });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch DIDs', error: error.message });
    }
};

exports.getUserDIDDocument = async (req, res) => {
    const { senderAddress, did } = req.body;
    try {
        const doc = await identityService.getUserDIDDocument({ senderAddress, did });
        // console.log("DID doc:", doc);
        res.status(200).json({ message: 'User DIDDocument fetched successfully', doc });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch DIDs', error: error.message });
    }
};

exports.getVerifyPrivateKey = async (req, res) => {
    const { senderAddress, did } = req.body;
    try {
        const doc = await identityService.getVerifyPrivateKey({ senderAddress, did });
        console.log("Verify publickey and privateKey:", doc);
        res.status(200).json({ message: 'User DIDDocument fetched successfully', doc });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch DIDs', error: error.message });
    }
};

exports.addIssuer = async (req, res) => {
    const { senderAddress, issuerAddress } = req.body;

    try {
        const Successful = await identityService.addIssuer({ senderAddress, issuerAddress });
        res.status(200).json({
            message: 'Issuer has Added',
            Successful
        });
    } catch (error) {
        console.error("Error adding Issuer:", error);
        res.status(500).json({ message: "Failed to add issuer", error: error.message });

    }
};

exports.removeIssuer = async (req, res) => {
    const { senderAddress, issuerAddress } = req.body;

    try {
        const Successful = await identityService.removeIssuer({ senderAddress, issuerAddress });
        res.status(200).json({
            message: 'Issuer has removed',
            Successful
        });
    } catch (error) {
        console.error("Error removed Issuer:", error);
        res.status(500).json({ message: "Failed to removed issuer", error: error.message });

    }
};

exports.showAllUsers = async (req, res) => {
    const { senderAddress } = req.body;

    console.log("in showAllUsers and address:", senderAddress);

    try {
        const allUsersList = await identityService.showAllUsers(senderAddress);
        res.status(200).json({
            message: 'Issuer has Added',
            allUsersList
        });
    } catch (error) {
        console.error("Error Get user:", error);
        res.status(500).json({ message: "Failed to Get user", error: error.message });

    }
};

exports.showAllUsersIden = async (req, res) => {
    const { senderAddress } = req.body;
    console.log("in showAllUsersIden and address:", senderAddress);

    try {
        const allUsersIdenList = await identityService.showAllUsersIden(senderAddress);
        console.log("1231321331321:", allUsersIdenList);
        const intArray = allUsersIdenList[1].map(num => Number(num));
        res.status(200).json({
            message: 'Issuer has Added',
            UserAddress: allUsersIdenList[0],
            UserIndenti: intArray
        });
    } catch (error) {
        console.error("Error Get user:", error);
        res.status(500).json({ message: "Failed to Get user", error: error.message });

    }
};

exports.isAdminUser = async (req, res) => {
    const { senderAddress } = req.body;

    try {
        const isAdmin = await identityService.isAdminUser(senderAddress);
        res.status(200).json({
            message: 'is Admin',
            isAdmin
        });
    } catch (error) {
        console.error("Error check user:", error);
        res.status(500).json({ message: "Failed to Get user", error: error.message });

    }
};


exports.isIssuerUser = async (req, res) => {
    const { senderAddress } = req.body;

    try {
        const isIssuer = await identityService.isIssuerUser(senderAddress);
        res.status(200).json({
            message: 'is issuer',
            isIssuer
        });
    } catch (error) {
        console.error("Error check user:", error);
        res.status(500).json({ message: "Failed to Get user", error: error.message });

    }
};


exports.registerIssuerPlatDID = async (req, res) => {
    // console.log(req.body);
    const { senderAddress, userAddress, issuerAddress, newDIDid, parentDIDid, verfyMethod, controller, issuerDIDid } = req.body;

    console.log("IN CONTROLLER");
    console.log("senderAddress:", senderAddress);
    console.log("userAddress:", userAddress);
    console.log("issuerAddress:", issuerAddress);
    console.log("newDIDid:", newDIDid);
    console.log("parentDIDid:", parentDIDid);
    console.log("verfyMethod:", verfyMethod);
    console.log("controller:", controller);
    console.log("issuerDIDid:", issuerDIDid);

    try {
        const result = await identityService.registerIssuerPlatDID({ senderAddress, userAddress, issuerAddress, newDIDid, parentDIDid, verfyMethod, controller, issuerDIDid });
        res.status(200).json({ message: 'Sub DID registered successfully', result });
    } catch (error) {
        console.error("Error registering Sub DID:", error);
        res.status(500).json({ message: 'Failed to register sub DID', error: error.message });
    }
};

exports.getUserPlatDIDs = async (req, res) => {
    const { senderAddress, userAddress } = req.body;
    try {
        const dids = await identityService.getUserPlatDIDs({ senderAddress, userAddress });
        res.status(200).json({ message: 'Sub DID registered successfully', dids });
    } catch (error) {
        console.error("Error registering Sub DID:", error);
        res.status(500).json({ message: 'Failed to register sub DID', error: error.message });
    }
};

exports.getUserPlatDIDDocument = async (req, res) => {
    const { senderAddress, did } = req.body;
    try {
        const doc = await identityService.getUserPlatDIDDocument({ senderAddress, did });
        res.status(200).json({ message: 'Sub DID registered successfully', doc });
    } catch (error) {
        console.error("Error registering Sub DID:", error);
        res.status(500).json({ message: 'Failed to register sub DID', error: error.message });
    }
};

exports.getIssuerPlatAllUserDIDDoc = async (req, res) => {
    const { senderAddress } = req.body;
    console.log("THE SENDERADDRESS:", senderAddress);
    try {
        const result = await identityService.getIssuerPlatAllUserDIDDoc(senderAddress);
        res.status(200).json({ message: 'Sub DID registered successfully', result });
    } catch (error) {
        console.error("Error registering Sub DID:", error);
        res.status(500).json({ message: 'Failed to register sub DID', error: error.message });
    }
};



