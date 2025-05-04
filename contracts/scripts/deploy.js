const hre = require("hardhat");

async function main() {
    // // 部署DID管理合约
    // const AuthorizationManager = await hre.ethers.getContractFactory("AuthorizationManager");
    // const authorizationManager = await AuthorizationManager.deploy();
    // console.log("AuthorizationManager deployed to:", await authorizationManager.getAddress());

    // const IdenManage = await hre.ethers.getContractFactory("IdenManage");
    // const idenManage = await IdenManage.deploy();
    // console.log("IdentityRegistry deployed to:", await idenManage.getAddress());

    const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
    const identityRegistry = await IdentityRegistry.deploy();
    console.log("IdentityRegistry deployed to:", await identityRegistry.getAddress());

    const VCManager = await hre.ethers.getContractFactory("VCManager");
    const vcManager = await VCManager.deploy(await identityRegistry.getAddress());
    console.log("vcManager deployed to:", await vcManager.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});