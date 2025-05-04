
const {
    getIdentityRegistryContract
} = require('./web3Service');

const contractConfig = require('../config/contractConfig');

const {
    generateDID,
    createDIDDocument,
    createPlatDIDDocument
} = require('../utils/didUtils');
const { uploadDataToIPFS, readDataFromIPFS } = require('../ipfs/ipfsService');

const { ec: EC } = require('elliptic');
const crypto = require('crypto');
const asn1 = require('asn1.js');
const ec = new EC('secp256k1');

const logger = require('../utils/Logger');
const { error, timeStamp } = require('console');

const mockUploadToIPFS = async (data) => {
    // 模拟一个伪 CID，例如将字符串 JSON 数据做 hash（简单模拟）
    const fakeCID = 'Qm' + Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 44);
    return fakeCID;
};



const registerDID = async ({ senderAddress, userAddress, controller, verificationMethods, authenticationID, service, keyAgreements, capabilityDelegationID, capabilityInvocationID, verifyPrivateKey, keyAgrPrivateKey }) => {

    try {
        // console.log("senderAddress:", senderAddress);
        // console.log("userAddress:", userAddress);
        // console.log("controller:", controller);
        // console.log("verificationMethods:", verificationMethods);
        // console.log("authenticationID:", authenticationID);
        // console.log("service:", service);
        // console.log("keyAgreements:", keyAgreements);
        // console.log("capabilityDelegationID:", capabilityDelegationID);
        // console.log("capabilityInvocationID:", capabilityInvocationID);
        // console.log("verifyPrivateKey:", verifyPrivateKey);
        // console.log("keyAgrPrivateKey:", keyAgrPrivateKey);

        // console.log("IN REGISTERDID_SERVICE");

        const id = generateDID(userAddress, 'eth');
        const contexts = [
            "https://www.w3.org/2018/credentials/v1",
            "https://schema.org"
        ];
        const createdTime = Date.now();
        const createdTimeISO = new Date().toISOString();
        console.log("IN REGISTERDID_SERVICE_DOC");

        const docOb = createDIDDocument({
            contexts: contexts,
            id: id,
            controller: controller,
            verificationMethods: verificationMethods,
            authentication: authenticationID,
            services: service,
            keyAgreements: keyAgreements,
            createdTime: createdTimeISO,
            updatedTime: createdTimeISO,
            capabilityDelegation: capabilityDelegationID,
            capabilityInvocation: capabilityInvocationID
        });

        console.log("FINISH REGISTERDID_SERVICE_DIDDOC");


        const doc = JSON.stringify(docOb)
        console.log("DIDDoc:", doc)

        let verifyID = [];
        for (let i = 0; i < verificationMethods.length; i++) {
            verifyID.push(verificationMethods[i].id);
        }

        console.log("verifyID:", verifyID)

        // 注册到IPFS中返回cid
        const filename = `${id}.txt`;
        const cid = await uploadDataToIPFS(doc, filename);
        if (!cid) return;
        console.log("cidcidcidcid:", cid);

        const totalCount = verificationMethods.length;
        console.log("总数据量:", totalCount);
        const methods = verificationMethods.map(item => item.type);
        console.log("提取后的数组:", methods);
        const publicKeys = verificationMethods.map(item => item.publicKey);
        console.log("提取后的数组:", publicKeys);

        console.log("id:", id);
        const idenManage = await getIdentityRegistryContract(senderAddress);
        console.log("Available functions on contract:", Object.keys(idenManage));
        const tx = await idenManage.registerRootDID(id, cid, authenticationID, methods, publicKeys, verifyID, verifyPrivateKey, keyAgrPrivateKey, userAddress);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: userAddress,
            method: "registerRootDID",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });

        console.log("ASDSDASDSDAD:", tx);
        return {
            txHash: tx.hash
        };
    } catch (error) {
        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: userAddress,
            method: "registerRootDID",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }
};


const updateDID = async ({ senderAddress, userAddress, controller, verificationMethods, authenticationID, service, keyAgreements, capabilityDelegationID, capabilityInvocationID, verifyPrivateKey, keyAgrPrivateKey }) => {

    try {
        const id = generateDID(userAddress, 'eth'); // 生成did:eth:0x...

        const contexts = [
            "https://www.w3.org/2018/credentials/v1",
            "https://schema.org"
        ];
        const updatedTime = Date.now();
        const updatedTimeISO = new Date().toISOString();
        const docOb = createDIDDocument({
            contexts: contexts,
            id: id,
            controller: controller,
            verificationMethods: verificationMethods,
            authentication: authenticationID,
            services: service,
            keyAgreements: keyAgreements,
            createdTime: updatedTimeISO,
            updatedTime: updatedTimeISO,
            capabilityDelegation: capabilityDelegationID,
            capabilityInvocation: capabilityInvocationID
        });

        const doc = JSON.stringify(docOb)
        console.log("DIDDoc:", doc)


        const filename = `${id}.txt`;
        const cid = await uploadDataToIPFS(doc, filename);
        if (!cid) return;
        console.log("cidcidcidcid:", cid);
        const data = await readDataFromIPFS(cid);
        if (data) {
            console.log("读取成功！内容:");
            console.log(data);
            try {
                const parsed = JSON.parse(data);
                console.log("解析后的 JSON:", parsed);
            } catch (e) {
                console.log("非 JSON 格式");
            }
        }

        // 注册到IPFS中返回cid
        // const cid = await mockUploadToIPFS(doc);
        const totalCount = verificationMethods.length;
        console.log("总数据量:", totalCount);
        const methods = verificationMethods.map(item => item.type);
        console.log("提取后的数组:", methods);
        const publicKeys = verificationMethods.map(item => item.publicKey);
        console.log("提取后的数组:", publicKeys);
        console.log("id:", id);

        let verifyID = [];
        for (let i = 0; i < verificationMethods.length; i++) {
            verifyID.push(verificationMethods[i].id);
        }

        console.log("verifyID:", verifyID)

        const idenManage = await getIdentityRegistryContract(senderAddress);
        console.log("Available functions on contract:", Object.keys(idenManage));
        const tx = await idenManage.updateDID(id, cid, authenticationID, methods, publicKeys, verifyID, verifyPrivateKey, keyAgrPrivateKey, userAddress);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "updateDID",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });


        return {
            txHash: tx.hash
        };
    } catch (error) {
        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "updateDID",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

};

const ECDSASignature = asn1.define('ECDSASignature', function () {
    return this.seq().obj(
        this.key('r').int(),  // r 值（大整数）
        this.key('s').int()   // s 值（大整数）
    );
});

function verifyECDSASignature(publicKeyHex, derSignatureHex, msgHash) {
    try {

        const publicKey = ec.keyFromPublic(publicKeyHex, 'hex');

        const derSignature = Buffer.from(derSignatureHex, 'hex');
        const { r, s } = ECDSASignature.decode(derSignature, 'der');

        return publicKey.verify(
            msgHash,
            { r, s },  // 签名对象
            'hex'      // 输入数据是HEX格式
        );

    } catch (e) {
        console.error(`[验证错误] ${e.message}`);
        return false;
    }
}

const loginSystem = async ({ senderAddress, id, derSignatureHex, msgHash, userVeriPublic }) => {

    const SigRes = verifyECDSASignature(userVeriPublic, derSignatureHex, msgHash)
    console.log("SigRes:", SigRes);

    // console.log("did:", id);
    const idenManage = await getIdentityRegistryContract(senderAddress);
    // console.log("getContract");
    const isValid = await idenManage.loginSystem(id);
    // console.log("isValid,", isValid);

    console.log("login Status:", isValid);
    return isValid && SigRes;
};

const loginIssuerPlatform = async ({ senderAddress, id, issuerAddress }) => {
    console.log("did:", id);
    const idenManage = await getIdentityRegistryContract(senderAddress);
    console.log("getContract");
    const isValid = await idenManage.loginIssuerPlatform(id, issuerAddress);
    console.log("finish");

    console.log("login Status:", isValid);
    return isValid;
};


const getUserDIDs = async ({ senderAddress, userAddress }) => {
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const userDIDs = await idenManage.getUserDIDs(userAddress);
    return userDIDs;
};

const getUserDIDDocument = async ({ senderAddress, did }) => {
    console.log("198:senderAddress:::::::", senderAddress);
    console.log("199:did:::::::", did);

    const idenManage = await getIdentityRegistryContract(senderAddress);
    const didDocument = await idenManage.getUserDIDDocument(did);
    // console.log("didDocument:", didDocument);

    // const id = didDocument[0];
    const cid = didDocument[1];
    // const authenticationMethod = didDocument[2];
    // const methods = didDocument[3];
    // const publicKeys = didDocument[4];
    // const verifyID = didDocument[5];
    // const verifyPrivateKey = didDocument[6];
    // const keyAgrPrivateKey = didDocument[7];
    // const exists = didDocument[8];


    const data = await readDataFromIPFS(cid);

    // if (data) {
    //     console.log("读取成功！内容:");
    //     // console.log(data);
    //     try {
    //         const parsed = JSON.parse(data);
    //         console.log("解析后的 JSON:", parsed);
    //     } catch (e) {
    //         console.log("非 JSON 格式");
    //     }
    // }

    return JSON.parse(data);
}

const getVerifyPrivateKey = async ({ senderAddress, did }) => {
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const didDocument = await idenManage.getUserDIDDocument(did);
    const verifyPrivateKey = didDocument[6];
    const keyAgrPrivateKey = didDocument[7];
    return { verifyPrivateKey, keyAgrPrivateKey };
}

const addIssuer = async ({ senderAddress, issuerAddress }) => {
    try {
        const idenManage = await getIdentityRegistryContract(senderAddress);
        const tx = await idenManage.addIssuer(issuerAddress);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "addIssuer",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });
        console.log("SUCCESSFUL:", tx);
        return tx;
    } catch (error) {

        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "addIssuer",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

}

const removeIssuer = async ({ senderAddress, issuerAddress }) => {

    try {
        console.log("Service in removeIssuer  and address:", issuerAddress);
        const idenManage = await getIdentityRegistryContract(senderAddress);
        const tx = await idenManage.removeIssuer(issuerAddress);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "removeIssuer",
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
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "removeIssuer",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

}

const showAllUsers = async (senderAddress) => {
    console.log("Service in showAllUsers and address:", senderAddress);
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const allUsersList = await idenManage.showAllUsers();
    return allUsersList;
}

const showAllUsersIden = async (senderAddress) => {
    console.log("Service in showAllUsers and address:", senderAddress);
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const allUsersList = await idenManage.showAllUsersIden();
    return allUsersList;
}

const isAdminUser = async (senderAddress) => {
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const isAdmin = await idenManage.isAdminUser(senderAddress);
    return isAdmin;
}

const isIssuerUser = async (senderAddress) => {
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const isIssuer = await idenManage.isIssuerUser(senderAddress);
    return isIssuer;
}


const registerIssuerPlatDID = async ({ senderAddress, userAddress, issuerAddress, newDIDid, parentDIDid, verfyMethod, controller, issuerDIDid }) => {
    try {
        // console.log("IN SERVICE");
        // console.log("senderAddress:", senderAddress);
        // console.log("userAddress:", userAddress);
        // console.log("issuerAddress:", issuerAddress);
        // console.log("newDIDid:", newDIDid);
        // console.log("parentDIDid:", parentDIDid);
        // console.log("verfyMethod:", verfyMethod);
        // console.log("controller:", controller);
        // console.log("issuerDIDid:", issuerDIDid);

        // const createdTime = Date.now();
        const createdTimeISO = new Date().toISOString();
        const docOb = createPlatDIDDocument({
            id: newDIDid,
            parentId: parentDIDid,
            verifyMethod: verfyMethod,
            controller: controller,
            issuer: issuerDIDid,
            createdTime: createdTimeISO,
        });

        const doc = JSON.stringify(docOb)
        console.log("DIDDoc:", doc)

        const filename = `${newDIDid}_${Date.now()}.txt`;
        const cid = await uploadDataToIPFS(doc, filename);
        if (!cid) return;
        console.log("cidcidcidcid:", cid);

        const verifyID = verfyMethod.id;
        console.log("verifyID:", verifyID)
        const verifyPublickey = verfyMethod.publicKey;

        const idenManage = await getIdentityRegistryContract(senderAddress);
        const tx = await idenManage.registerIssuerPlatDID(newDIDid, parentDIDid, cid, verifyID, verifyPublickey, userAddress, issuerAddress);

        const receipt = await tx.wait();
        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "registerIssuerPlatDID",
            txHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            status: 'success',
            timeStamp: new Date().toISOString(),
            gasUsed: receipt.gasUsed.toString()
        });

        return {
            txHash: tx.hash
        };
    } catch (error) {


        await logger.addLog({
            contractAddress: contractConfig.contracts.identityRegistry.address,
            from: senderAddress,
            method: "registerIssuerPlatDID",
            status: 'failed',
            error: error.message,
            timeStamp: new Date().toISOString(),
        });
    }

};

const getUserPlatDIDs = async ({ senderAddress, userAddress }) => {
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const userPlatDIDs = await idenManage.getUserPlatDIDs(userAddress);
    return userPlatDIDs;
}

const getUserPlatDIDDocument = async ({ senderAddress, did }) => {
    const idenManage = await getIdentityRegistryContract(senderAddress);
    const didDocument = await idenManage.getUserPlatDIDDocument(did);

    const cid = didDocument[2];
    console.log("GET CID PPPPPPPPOPOPO:", cid);

    const data = await readDataFromIPFS(cid);
    return JSON.parse(data);
}

const getIssuerPlatAllUserDIDDoc = async (senderAddress) => {
    console.log("THE SENDERADDRESS___________:", senderAddress);

    const idenManage = await getIdentityRegistryContract(senderAddress);
    const userPlatDIDs = await idenManage.getIssuerPlatAllUserDIDDoc();
    return userPlatDIDs;
}


module.exports = {
    registerDID,
    updateDID,
    loginSystem,
    loginIssuerPlatform,
    getUserDIDs,
    getUserDIDDocument,
    getVerifyPrivateKey,
    addIssuer,
    removeIssuer,
    showAllUsers,
    showAllUsersIden,
    isAdminUser,
    isIssuerUser,
    registerIssuerPlatDID,
    getUserPlatDIDs,
    getUserPlatDIDDocument,
    getIssuerPlatAllUserDIDDoc
};