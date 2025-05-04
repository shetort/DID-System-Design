

import { ec as EC } from 'elliptic';
// import { getPublicKey, utils as edUtils } from '@noble/ed25519';
import { Buffer } from 'buffer';
import * as ed from '@noble/ed25519';

import { x25519 } from '@noble/curves/ed25519';
import { secp256k1 } from '@noble/curves/secp256k1';

// 初始化椭圆曲线实例
const ec = new EC('secp256k1');

type KeyPair = {
    privateKey: string;
    publicKey: string;
};


function toHex(buffer: Uint8Array): string {
    return Buffer.from(buffer).toString('hex');
}

export async function generateX25519KeyPair(): Promise<KeyPair> {
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);

    return {
        privateKey: toHex(privateKey),
        publicKey: toHex(publicKey)
    };
}

// 生成 ECDH secp256k1 密钥对
export async function generateEcdhSecp256k1KeyPair(): Promise<KeyPair> {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey, true); // true 表示压缩格式

    return {
        privateKey: toHex(privateKey),
        publicKey: toHex(publicKey)
    };
}


/**
 * 生成 Ed25519 密钥对 (符合 Ed25519VerificationKey2020 标准)
 * https://w3c-ccg.github.io/lds-ed25519-2020/
 */
export async function generateEd25519KeyPair(): Promise<KeyPair> {
    // 生成私钥（32字节）
    const privateKey = ed.utils.randomPrivateKey();
    // 派生公钥
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    return {
        privateKey: toHex(privateKey),
        publicKey: toHex(publicKey)
    };
}

/**
 * 生成 ECDSA secp256k1 密钥对 (符合 EcdsaSecp256k1RecoveryMethod2020 标准)
 * https://w3id.org/security#EcdsaSecp256k1RecoveryMethod2020
 */
export const generateEcdsaSecp256k1KeyPair = async (): Promise<KeyPair> => {
    // 生成密钥对   
    const keyPair = ec.genKeyPair();

    // 获取压缩公钥 (含恢复ID)
    // const publicKey = keyPair.getPublic(true, 'hex');
    // const recoveryId = keyPair.getPublic().y.isEven() ? 0 : 1; // 计算恢复ID
    const publicKey = keyPair.getPublic('hex');
    const privateKey = keyPair.getPrivate('hex');

    return { publicKey: publicKey, privateKey: privateKey };
}