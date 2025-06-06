require('dotenv').config();

// // 导入合约ABI
const identityRegistryABI = require('../../contracts/artifacts/contracts/IdentityRegistry.sol/IdentityRegistry.json').abi;
const vcManagerABI = require('../../contracts/artifacts/contracts/VCManager.sol/VCManager.json').abi;

// 配置文件内容
module.exports = {
    hardhatNetwork: {
        rpcUrl: "http://127.0.0.1:8545",
        accounts: [
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        ]
    },

    // 合约地址和 ABI
    contracts: {
        identityRegistry: {
            address: process.env.IDENTITY_REGISTRY_ADDRESS, // 本地部署的 IdentityRegistry 合约地址
            abi: identityRegistryABI, // 合约 ABI
        },
        vcManager: {
            address: process.env.VC_MANAGER_ADDRESS, // 本地部署的 AuthorizationManager 合约地址
            abi: vcManagerABI, // 合约 ABI
        }
    }
};
