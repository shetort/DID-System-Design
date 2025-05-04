const { ethers } = require('ethers');
const {
    getVCManagerContract
} = require('./web3Service');

const { ec } = require('elliptic')
const EC = new ec('secp256k1');

const { uploadDataToIPFS, readDataFromIPFS } = require('../ipfs/ipfsService');
const contractConfig = require('../config/contractConfig');
const { getUserDIDDocument, getVerifyPrivateKey } = require('./identityService')
const { sha256 } = require('@noble/hashes/sha256')
const Buffer = require('buffer')

// npm install json-canonicalize

const { canonicalize } = require('json-canonicalize')
const { createHash } = require('crypto')
const logger = require('../utils/Logger');

const mockUploadToIPFS = async (data) => {
    // 模拟一个伪 CID，例如将字符串 JSON 数据做 hash（简单模拟）
    const fakeCID = 'Qm' + Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 44);
    return fakeCID;
};


const issuerVC = async (senderAddress, issuerAddress, VCtype, issuerDID, issuer, credentialSubject, VCProof, proofPublicKey, expirationDate, subjectAddress) => {
    try {

        const contexts = [
            "https://www.w3.org/2018/credentials/v1",
            "https://schema.org"
        ];

        const vcId = `vc:${issuerDID}:${Date.now()}`
        const issuanceDate = Date.now();
        const issuanceDateISO = new Date().toISOString();


        const vcProofMethod = VCProof.verificationMethod;
        const did = issuerDID;

        const vcIssuerDIDDoc = await getUserDIDDocument({ senderAddress, did });
        const vcIssuerDIDVerfyMethods = vcIssuerDIDDoc.verificationMethod;

        const vcIssuerPPKey = await getVerifyPrivateKey({ senderAddress, did });

        let vcIssuerVeriPrivate;
        for (let i = 0; i < vcIssuerDIDVerfyMethods.length; i++) {
            if (vcProofMethod == vcIssuerDIDVerfyMethods[i].id) {
                vcIssuerVeriPrivate = vcIssuerPPKey.verifyPrivateKey[i];
                break;
            }
        }

        const keyPair = EC.keyFromPrivate(vcIssuerVeriPrivate, 'hex');

        const vcDocObWithOutProof = {
            "context": contexts,
            "id": vcId,
            "type": VCtype,
            "issuer": issuer,
            "issuanceDate": issuanceDateISO,
            "expirationDate": expirationDate,
            "credentialSubject": credentialSubject
        };

        const canonicalJSON = canonicalize(vcDocObWithOutProof);
        const hash = createHash('sha256').update(canonicalJSON).digest('hex');
        console.log('哈希值:', hash);
        const signatureDer = keyPair.sign(hash, 'hex', { canonical: true });

        const derHex = signatureDer.toDER('hex');

        VCProof.proofValue = derHex;

        const vcDocOb = {
            "context": contexts,
            "id": vcId,
            "type": VCtype,
            "issuer": issuer,
            "issuanceDate": issuanceDateISO,
            "expirationDate": expirationDate,
            "credentialSubject": credentialSubject,
            "proof": VCProof
        };

        const doc = canonicalize(vcDocOb)
        const filename = `${vcId}.txt`;
        const cid = await uploadDataToIPFS(doc, filename);
        if (!cid) return;

        const idenManage = await getVCManagerContract(issuerAddress);
        const tx = await idenManage.issuerVC(subjectAddress, vcId, cid, issuerDID, proofPublicKey, issuanceDate, Math.floor(Date.now() / 1000) + 365 * 86400);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "issuerVC",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });

        return { txHash: tx.hash };

    } catch (error) {
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "issuerVC",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

}

const verifyVC = async (senderAddress, vcId, didId) => {

    //获取issuer的DID
    const did = didId;
    const VCIssuerDIDDoc = await getUserDIDDocument({ senderAddress, did })
    console.log("OASDOAJSDOIHASOIDD:", VCIssuerDIDDoc);


    const idenManage = await getVCManagerContract(senderAddress);
    console.log("Available functions on contract:", Object.keys(idenManage));
    const VCInfo = await idenManage.verifyVC(vcId, didId);
    console.log("VCInfo exist:", VCInfo);

    const VCCID = VCInfo[1];

    const data = await readDataFromIPFS(VCCID);
    const VCDocData = JSON.parse(data);

    const VCProof = VCDocData.proof;
    const derSignatureHex = VCProof.proofValue;

    let VerpublicKey;
    for (let i = 0; i < VCIssuerDIDDoc.verificationMethod.length; i++) {
        if (VCProof.verificationMethod == VCIssuerDIDDoc.verificationMethod[i].id) {
            VerpublicKey = VCIssuerDIDDoc.verificationMethod[i].publicKey;
        }
    }

    const vcDocObWithOutProof = {
        "context": VCDocData.context,
        "id": VCDocData.id,
        "type": VCDocData.type,
        "issuer": VCDocData.issuer,
        "issuanceDate": VCDocData.issuanceDate,
        "expirationDate": VCDocData.expirationDate,
        "credentialSubject": VCDocData.credentialSubject
    };

    const canonicalJSON = canonicalize(vcDocObWithOutProof);
    console.log("vcDocObWithOutProof", vcDocObWithOutProof);
    const hash = createHash('sha256').update(canonicalJSON).digest('hex');
    console.log('哈希值:', hash);

    const publicKeyT = EC.keyFromPublic(VerpublicKey, 'hex');

    const isValid = publicKeyT.verify(hash, derSignatureHex);

    console.log("isValid:", isValid);

    if (VCInfo[0] && isValid) {
        return true;
    } else {
        return false;
    }
}

const getVC = async (senderAddress, vcId) => {
    console.log("senderAddress:", senderAddress);
    console.log("vcHash:", vcId);
    const contract = await getVCManagerContract(senderAddress);
    const vcCID = await contract.getVC(vcId);
    console.log("vcCID:", vcCID);

    const data = await readDataFromIPFS(vcCID);
    return JSON.parse(data);
}

const showVCID = async (senderAddress, subjectAddress) => {
    const contract = await getVCManagerContract(senderAddress);
    const vcIDs = await contract.showVCID(subjectAddress);
    console.log("vcIDs:", vcIDs);
    return vcIDs;
}

const showIssuedVCID = async (senderAddress, issuerAddress) => {

    console.log("senderAddress:", senderAddress);
    console.log("issuerAddress:", issuerAddress);
    const contract = await getVCManagerContract(senderAddress);
    const vcIDs = await contract.showIssuedVCID(issuerAddress);
    console.log("vcIssuerIDs:", vcIDs);
    return vcIDs;
}

const revokeVC = async (senderAddress, vcId) => {

    try {
        console.log("senderAddress:", senderAddress);
        console.log("vcId:", vcId);
        const contract = await getVCManagerContract(senderAddress);

        const tx = await contract.revokeVC(vcId);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "revokeVC",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });

    } catch (error) {

        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "revokeVC",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

}

const submitApplication = async (senderAddress, issuerAddress, vcType, data, approved) => {

    try {
        console.log("senderAddress:", senderAddress);
        console.log("issuerAddress:", issuerAddress);
        console.log("vcType:", vcType);
        console.log("data:", data);
        console.log("approved:", approved);
        const userAddress = senderAddress;


        const vcApplyData = {
            "senderAddress": senderAddress,
            "issuerAddress": issuerAddress,
            "vcType": vcType,
            "data": data
        };

        const doc = JSON.stringify(vcApplyData)

        const filename = `${issuerAddress}_${Date.now()}.txt`;
        const dataCid = await uploadDataToIPFS(doc, filename);
        if (!dataCid) return;
        console.log("cidcidcidcid:", dataCid);

        const contract = await getVCManagerContract(senderAddress);
        const tx = await contract.submitApplication({ userAddress, issuerAddress, vcType, dataCid, approved });

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "submitApplication",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });
    } catch (error) {

        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "submitApplication",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

}

const approveApplication = async (senderAddress, applicationId) => {
    try {
        console.log("senderAddress:", senderAddress);
        console.log("applicationId:", applicationId);
        const contract = await getVCManagerContract(senderAddress);
        const tx = contract.approveApplication(applicationId);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "approveApplication",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });
    } catch (error) {
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "approveApplication",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });

    }
}


const getApplicationIds = async (senderAddress, userAddress) => {
    console.log("senderAddress:", senderAddress);
    console.log("issuerAddress:", userAddress);
    const contract = await getVCManagerContract(senderAddress);
    const vcApplyIDs = await contract.getApplicationIds(userAddress);
    console.log("vcApplyIDs:", vcApplyIDs);
    return vcApplyIDs;
}

const getIssuerApplications = async (issuerAddress) => {
    console.log("issuerAddress:", issuerAddress);
    const contract = await getVCManagerContract(issuerAddress);
    const vcApplyIDs = await contract.getIssuerApplications();
    console.log("vcApplyIDs:", vcApplyIDs);
    return vcApplyIDs;
}

const getApplication = async (senderAddress, applicationId) => {
    console.log("senderAddress:", senderAddress);
    const contract = await getVCManagerContract(senderAddress);
    const vcApplys = await contract.getApplication(applicationId);

    console.log("VCAPPPPPP:", vcApplys);

    const data = await readDataFromIPFS(vcApplys.dataCid);
    console.log("读取成功！内容:");
    console.log(data);
    return JSON.parse(data);
}

const setVP = async (senderAddress, id, vpShow) => {

    try {
        console.log("senderAddress:", senderAddress);
        console.log("id:", id);
        console.log("vpShow:", vpShow);


        const doc = canonicalize(vpShow)

        const hash = createHash('sha256').update(doc).digest('hex');
        const filename = `${id}_${hash}.txt`;
        const cid = await uploadDataToIPFS(doc, filename);
        if (!cid) return;

        console.log("cid:", cid);


        const contract = await getVCManagerContract(senderAddress);
        const tx = await contract.setVP(id, cid);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "setVP",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });
        return tx;
    } catch (error) {
        await logger.addLog({
            contractAddress: contractConfig.contracts.vcManager.address,
            from: senderAddress,
            method: "setVP",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

}

const getVPShow = async (senderAddress, vcId) => {
    console.log("senderAddress:", senderAddress);
    console.log("vcId:", vcId);
    const contract = await getVCManagerContract(senderAddress);
    const vpCID = await contract.getVPShow(vcId);

    const data = await readDataFromIPFS(vpCID);
    console.log("读取成功！内容:");
    console.log(data);

    return JSON.parse(data);
}

module.exports = {
    issuerVC,
    verifyVC,
    getVC,
    showVCID,
    showIssuedVCID,
    revokeVC,
    submitApplication,
    approveApplication,
    getApplicationIds,
    getIssuerApplications,
    getApplication,
    setVP,
    getVPShow
}
