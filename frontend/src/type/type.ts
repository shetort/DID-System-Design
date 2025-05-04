// types.ts（建议放在全局类型声明文件中）
export type VerificationMethod = {
    id: string;
    type: string; // 根据实际类型扩展
    controller: string;
    publicKey: string;
};

export type ServiceEndpoint = {
    id: string;
    type: string;
    serviceEndpoint: string;
};

export type KeyAgreement = {
    id: string;
    type: string; // 根据实际类型扩展
    controller: string;
    publicKeyMultibase: string;
};

export type applyData = {
    key: string;
    value: string;
}

export interface RegisterIssuerPlatParams {
    senderAddress: string;
    userAddress: string;
    issuerAddress: string;

    newDIDid: string;
    parentDIDid: string;
    verfyMethod: VerificationMethod;
    controller: string;
    issuerDIDid: string;
};


export interface PlatInfoShow {
    id: string;
    parentId: string;
    veryMethod: VerificationMethod;
    controller: string;
    issuer: string;
    createdTime: string;
}


export interface RegisterDIDParams {
    senderAddress: string;         // 0x开头地址
    userAddress: string;           // 0x开头地址
    controller: string[];          // 至少包含一个DID
    verificationMethods: VerificationMethod[];
    authenticationID: string;
    service: ServiceEndpoint[];
    keyAgreements: KeyAgreement[];
    capabilityDelegationID: string;
    capabilityInvocationID: string;
    verifyPrivateKey: string[];
    keyAgrPrivateKey: string[];
};




export interface RegisterDIDInputParams {
    senderAddress: string;
    userAddress: string;
    controller: string[];
    verificationMethodsInput: VerificationMethodInput[];
    authenticationID: string;
    service: ServiceEndpoint[];
    keyAgreementsInput: KeyAgreementInput[];
    capabilityDelegationID: string;
    capabilityInvocationID: string;
}

export type VerificationMethodInput = {
    type: string; // 根据实际类型扩展
    controller: string;
};

// export enum VerificationMethodType {
//     Ed25519 = "Ed25519VerificationKey2020",
//     Ecdsa = "EcdsaSecp256k1VerificationKey2019"
// }

export type KeyAgreementInput = {
    type: string; // 根据实际类型扩展
    controller: string;
}
export enum KeyAgreementType {
    X25519 = "X25519KeyAgreementKey2020",
    ECDH = "EcdhSecp256k1Recipient2020"
}


// VC类型枚举
export enum VCType {
    VerifiableCredential = "VerifiableCredential",
    UniversityDegree = "UniversityDegreeCredential"
}

// 颁发者类型
export interface Issuer {
    id: string;
    name: string;
}

// 证书主体类型
// export type CredentialSubject = {
//     id: string;
//     [key: string]: {
//         [nestedKey: string]: string | number | boolean | object
//     };
// };

export type CredentialSubject = {
    id: string;
} & {
    [key: string]: {
        [nestedKey: string]: string
    };
};

// type DynamicData = {
//     id: string; // 明确声明固定字段
// } & {
//     [key: string]: { [nestedKey: string]: string }; // 动态字段签名
// };

// 证明类型
export interface VCProof {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}

// export enum VCType {
//     VerifiableCredential = "VerifiableCredential",
//     UniversityDegree = "UniversityDegreeCredential"
// }


export interface IssueVCParams {
    senderAddress: string;
    issuerAddress: string;
    VCtype: string[];
    issuerDID: string;
    issuer: Issuer;
    credentialSubject: CredentialSubject;
    VCProof: VCProof;
    proofPublicKey: string; // 根据加密算法类型细化
    expirationDate: string; // ISO8601 格式
    subjectAddress: string;
}


export interface FormData {
    vcType: string;
    data: Record<string, any>;
}



export interface ViewedStatus {
    [key: string]: boolean;
}

