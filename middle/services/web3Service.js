// services/web3Service.js
const { ethers } = require('ethers');
const contractConfig = require('../config/contractConfig');

// 初始化Web3提供者
const provider = new ethers.JsonRpcProvider(contractConfig.hardhatNetwork.rpcUrl);

// 根据调用者的地址动态生成 signer
const getSigner = (address) => {
    return provider.getSigner(address);
};

// 获取合约实例
const getContractInstance = async (address, contractABI, contractAddress) => {
    const signer = await getSigner(address);  // 使用调用者的地址获取 signer
    return new ethers.Contract(contractAddress, contractABI, signer);
};


// 获取合约实例，封装了所有交互方法
// const getVCManagerContract = async (address) => {
//     const vcManagerABI = contractConfig.contracts.vcManager.abi;
//     const vcManagerAddress = contractConfig.contracts.vcManager.address;
//     return getContractInstance(address, vcManagerABI, vcManagerAddress);
// };

// const getIdentityRegistryContract = async (address) => {
//     const identityRegistryABI = contractConfig.contracts.identityRegistry.abi;
//     const identityRegistryAddress = contractConfig.contracts.identityRegistry.address;
//     return getContractInstance(address, identityRegistryABI, identityRegistryAddress);
// };

// const getIdenManageContract = async (address) => {
//     const idenManageABI = contractConfig.contracts.idenManage.abi;
//     const idenManageAddress = contractConfig.contracts.idenManage.address;
//     return getContractInstance(address, idenManageABI, idenManageAddress);
// };

const getVCManagerContract = async (address) => {
    const vcManagerABI = contractConfig.contracts.vcManager.abi;
    const vcManagerAddress = contractConfig.contracts.vcManager.address;
    return getContractInstance(address, vcManagerABI, vcManagerAddress);
};

const getIdentityRegistryContract = async (address) => {
    const identityRegistryABI = contractConfig.contracts.identityRegistry.abi;
    const identityRegistryAddress = contractConfig.contracts.identityRegistry.address;
    return getContractInstance(address, identityRegistryABI, identityRegistryAddress);
};

module.exports = {
    getSigner,
    getContractInstance,
    getVCManagerContract,
    getIdentityRegistryContract,
}
