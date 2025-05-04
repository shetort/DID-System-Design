const { extendContextLoader } = require('jsonld-signatures');
const { EcdsaKeyPair } = require('crypto-ld');
const vc = require('vc-js');

// 生成密钥对（可扩展算法选项）
async function generateKeyPair(options = { type: 'Ed25519VerificationKey2018' }) {
    return EcdsaKeyPair.generate(options);
}

/**
 * 创建可验证凭证
 * @param {Object} params - 参数对象
 * @param {string} params.issuer - 发行者DID
 * @param {Object} params.credentialSubject - 凭证主体信息
 * @param {Array<string>} [params.types=[]] - 凭证类型（自动包含VerifiableCredential）
 * @param {Array<string>} [params.contexts] - JSON-LD上下文
 * @returns {Promise<Object>} 签名后的可验证凭证
 */
async function createVC({
    issuer,
    credentialSubject,
    types = [],
    contexts = [
        "https://www.w3.org/2018/credentials/v1",
        "https://schema.org"
    ]
}) {
    // 参数校验
    if (!issuer) throw new Error("Issuer DID is required");
    if (!credentialSubject?.id) throw new Error("Credential subject must have id");

    const keyPair = await generateKeyPair();

    // 构建动态凭证结构
    const credential = {
        "@context": contexts,
        type: ["VerifiableCredential", ...types],
        issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject
    };

    // 签名凭证
    const signedVC = await vc.issue({
        credential,
        suite: new vc.Suite({
            verificationMethod: keyPair.id,
            keyPair
        }),
        documentLoader: extendContextLoader
    });

    return signedVC;
}

module.exports = {
    createVC
}