// utils/didUtils.js
const { ethers } = require('ethers');

// 示例：根据 address 和类型生成 DID
const generateDID = (address, prefix = 'example') => {
    if (!ethers.isAddress(address)) throw new Error('Invalid Ethereum address');
    return `did:${prefix}:${address}`;
};

// 校验 DID 格式（简单校验）
const validateDIDFormat = (did) => {
    const regex = /^did:[a-zA-Z0-9]+:[a-zA-Z0-9]+$/;
    return regex.test(did);
};

const createDIDDocument = ({ contexts, id, controller, verificationMethods, authentication, services, keyAgreements, createdTime, updatedTime, capabilityDelegation, capabilityInvocation }) => {
    // if (!validateDIDFormat(did)) throw new Error('Invalid DID format');

    return {
        "context": contexts,
        "id": id,
        "controller": controller,
        "verificationMethod": verificationMethods,
        "authentication": authentication,
        "service": services,
        "keyAgreement": keyAgreements,
        "createdTime": createdTime,
        "updatedTime": updatedTime,
        "capabilityDelegation": capabilityDelegation,
        "capabilityInvocation": capabilityInvocation
    };
};

const createPlatDIDDocument = ({ id, controller, parentId, verifyMethod, issuer, createdTime }) => {
    return {
        "id": id,
        "parentId": parentId,
        "verificationMethod": verifyMethod,
        "controller": controller,
        "issuer": issuer,
        "createdTime": createdTime,
    };
};


// 解析DID文档（从对象中提取关键信息）
const parseDIDDocument = (doc) => {
    if (!doc || typeof doc !== 'object') throw new Error('Invalid DID Document');

    const { id, verificationMethod, authentication, service } = doc;
    return {
        did: id,
        publicKey: verificationMethod?.[0]?.publicKeyHex || '',
        authMethod: authentication?.[0] || '',
        services: service || []
    };
};

module.exports = {
    generateDID,
    validateDIDFormat,
    createDIDDocument,
    parseDIDDocument,
    createPlatDIDDocument
};
