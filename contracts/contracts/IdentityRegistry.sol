// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 去中心化身份认证与登录统一合约
/// @author You
/// @notice 集成DID注册、子身份注册与登录判断功能
import {console} from "hardhat/console.sol";

contract IdentityRegistry {
    // --- 结构体定义 ---
    struct DIDInfo {
        string parentDID;
        string cid;
        address controller;
        bool exists;
    }

    struct DIDDocument {
        string id; // DID，格式例如: did:eth:0x123456
        string cid;
        string authenticationMethod;
        string[] methods;
        string[] publicKey;
        string[] verifyID;
        string[] verifyPrivateKey;
        string[] keyAgrPrivateKey;
        bool exists; // 确保文档存在
    }

    struct IssuerDIDDoc {
        string id;
        string parentId;
        string cid;
        bool exists;
        string verifyID;
        string verifyPublickey;
    }

    mapping(string => mapping(string => string)) idToPurposeToMethod;

    address[] public allusers;
    mapping(address => uint256) public userIden;
    mapping(address => bool) userRegis;

    // 存储用户所有的DID
    mapping(address => DIDDocument[]) public addrToDIDDoc;
    mapping(string => DIDDocument) public idToDIDDoc;
    // 用户DID之间的关系
    // mapping(string => DIDDocument[]) public didMapping;

    mapping(string => DIDInfo) public dids;
    mapping(address => string[]) public userDIDs;

    mapping(string => bool) public idExist;

    mapping(address => IssuerDIDDoc[]) public issuerAddrToDIDDoc;
    mapping(address => IssuerDIDDoc[]) public userIssuerPlatDIDDoc;
    mapping(string => IssuerDIDDoc) public issuerIdToDIDDoc;

    mapping(address => string[]) public isserIdToDIDId;

    mapping(string => string[]) didMapping;
    mapping(address => string[]) public userPlatDIDs;

    //处理申请需要的映射--》
    // 每个用户要有一个（address对应）
    // 每个颁发者要有一个（address对应）

    // --- 角色管理 ---
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isIssuer;

    // --- 事件定义 ---
    event RootDIDRegistered(address user, string did);
    event SubDIDRegistered(address user, string did);
    event UserLoginChecked(
        address user,
        string did,
        string loginType,
        bool success
    );

    constructor() {
        isAdmin[msg.sender] = true; // 部署者为管理员
        userIden[msg.sender] = 3;
    }

    // --- 注册功能 ---

    function checkIdExist(string memory didId) public view returns (bool) {
        return idExist[didId];
    }

    function registerRootDID(
        string memory _id,
        string calldata _cid,
        string memory _authenticationMethod,
        string[] memory _methods,
        string[] memory _publicKey,
        string[] memory verifyID,
        string[] memory verifyPrivateKey,
        string[] memory keyAgrPrivateKey,
        address userAddress
    ) public {
        require(!idExist[_id], "id has exist");
        require(!dids[_id].exists, "DID already registered");
        require(!userRegis[userAddress], "user have regisered");

        idExist[_id] = true;
        userRegis[userAddress] = true;

        console.log("id:", _id);
        console.log("cid", _cid);
        console.log("_authenticationMethod:", _authenticationMethod);
        // console.log("_methods:", _methods);

        // console.log("_methods:", _methods);
        // console.log("_publicKey:", _publicKey);
        // console.log("verifyID:", verifyID);
        // console.log("verifyPrivateKey:", verifyPrivateKey);
        // console.log("keyAgrPrivateKey:", keyAgrPrivateKey);

        allusers.push(userAddress);
        if (userIden[userAddress] != 3) {
            userIden[userAddress] = 1;
        }
        addrToDIDDoc[userAddress].push(
            DIDDocument({
                id: _id,
                cid: _cid,
                authenticationMethod: _authenticationMethod,
                methods: _methods,
                publicKey: _publicKey,
                verifyID: verifyID,
                verifyPrivateKey: verifyPrivateKey,
                keyAgrPrivateKey: keyAgrPrivateKey,
                exists: true
            })
        );

        idToDIDDoc[_id] = DIDDocument({
            id: _id,
            cid: _cid,
            authenticationMethod: _authenticationMethod,
            methods: _methods,
            publicKey: _publicKey,
            verifyID: verifyID,
            verifyPrivateKey: verifyPrivateKey,
            keyAgrPrivateKey: keyAgrPrivateKey,
            exists: true
        });

        dids[_id] = DIDInfo({
            parentDID: "",
            cid: _id,
            controller: userAddress,
            exists: true
        });

        userDIDs[userAddress].push(_id);
        emit RootDIDRegistered(msg.sender, _id);
    }

    function registerIssuerPlatDID(
        string memory newDIDid,
        string memory parentDIDid,
        string memory cid,
        string memory verifyID,
        string memory verifyPublickey,
        address userAddress,
        address issuerAddress
    ) public {
        require(!idExist[newDIDid], "id has exist");
        require(!dids[newDIDid].exists, "DID already registered");
        require(userRegis[userAddress], "user have not regisered");
        idExist[newDIDid] = true;

        issuerAddrToDIDDoc[issuerAddress].push(
            IssuerDIDDoc({
                id: newDIDid,
                parentId: parentDIDid,
                cid: cid,
                exists: true,
                verifyID: verifyID,
                verifyPublickey: verifyPublickey
            })
        );

        userIssuerPlatDIDDoc[userAddress].push(
            IssuerDIDDoc({
                id: newDIDid,
                parentId: parentDIDid,
                cid: cid,
                exists: true,
                verifyID: verifyID,
                verifyPublickey: verifyPublickey
            })
        );

        issuerIdToDIDDoc[newDIDid] = IssuerDIDDoc({
            id: newDIDid,
            parentId: parentDIDid,
            cid: cid,
            exists: true,
            verifyID: verifyID,
            verifyPublickey: verifyPublickey
        });
        isserIdToDIDId[issuerAddress].push(newDIDid);

        dids[newDIDid] = DIDInfo({
            parentDID: parentDIDid,
            cid: cid,
            controller: userAddress,
            exists: true
        });

        didMapping[parentDIDid].push(newDIDid);
        userPlatDIDs[userAddress].push(newDIDid);
        emit SubDIDRegistered(msg.sender, newDIDid);
    }

    // --- 更新功能 ---

    /// @notice 更新根DID
    event DIDUpdated(address user, bool success);
    function updateDID(
        string memory _id,
        string calldata _cid,
        string memory _authenticationMethod,
        string[] memory _methods,
        string[] memory _publicKey,
        string[] memory verifyID,
        string[] memory verifyPrivateKey,
        string[] memory keyAgrPrivateKey,
        address userAddress
    ) external {
        require(idExist[_id], "id has exist");

        idToDIDDoc[_id] = DIDDocument({
            id: _id,
            cid: _cid,
            authenticationMethod: _authenticationMethod,
            methods: _methods,
            publicKey: _publicKey,
            verifyID: verifyID,
            verifyPrivateKey: verifyPrivateKey,
            keyAgrPrivateKey: keyAgrPrivateKey,
            exists: true
        });

        string memory idTemp = _id;
        for (uint256 i = 0; i < addrToDIDDoc[userAddress].length; i++) {
            if (
                keccak256(abi.encodePacked(addrToDIDDoc[userAddress][i].id)) ==
                keccak256(abi.encodePacked(idTemp))
            ) {
                addrToDIDDoc[userAddress].push(
                    DIDDocument({
                        id: _id,
                        cid: _cid,
                        authenticationMethod: _authenticationMethod,
                        methods: _methods,
                        publicKey: _publicKey,
                        verifyID: verifyID,
                        verifyPrivateKey: verifyPrivateKey,
                        keyAgrPrivateKey: keyAgrPrivateKey,
                        exists: true
                    })
                );
                break;
            }
        }

        emit DIDUpdated(msg.sender, true);
    }

    // --- 登录验证 ---

    /// @notice 登录本系统：只需判断DID是否存在
    function loginSystem(string calldata id) external view returns (bool) {
        bool success = idExist[id];
        return success;
    }

    /// @notice 登录颁发者平台：判断 DID 是否存在且前缀匹配平台
    function loginIssuerPlatform(
        string memory id,
        address issuerAddress
    ) external view returns (bool) {
        for (uint i = 0; i < isserIdToDIDId[issuerAddress].length; i++) {
            if (
                keccak256(bytes(id)) ==
                keccak256(bytes(isserIdToDIDId[issuerAddress][i]))
            ) {
                return true;
            }
        }
        return false;
    }

    // --- 工具函数 ---
    function startsWith(
        string memory full,
        string memory prefix
    ) internal pure returns (bool) {
        bytes memory fullBytes = bytes(full);
        bytes memory prefixBytes = bytes(prefix);

        if (prefixBytes.length > fullBytes.length) return false;

        for (uint i = 0; i < prefixBytes.length; i++) {
            if (fullBytes[i] != prefixBytes[i]) return false;
        }

        return true;
    }

    // --- 查询函数 ---

    function getUserPlatDIDs(
        address userAddress
    ) external view returns (string[] memory) {
        return userPlatDIDs[userAddress];
    }

    function getUserPlatDIDDocument(
        string calldata id
    ) external view returns (IssuerDIDDoc memory) {
        return issuerIdToDIDDoc[id];
    }

    function getIssuerPlatAllUserDIDDoc()
        external
        view
        returns (string[] memory)
    {
        return isserIdToDIDId[msg.sender];
    }

    /// @notice 获取用户所有DID
    function getUserDIDs(address user) external view returns (string[] memory) {
        return userDIDs[user];
    }

    function getUserDIDDocument(
        string calldata id
    ) external view returns (DIDDocument memory) {
        return idToDIDDoc[id];
    }

    /// @notice 判断一个地址是否是管理员
    function isAdminUser(address user) external view returns (bool) {
        return isAdmin[user];
    }

    /// @notice 判断一个地址是否是颁发者
    function isIssuerUser(address user) external view returns (bool) {
        return isIssuer[user];
    }

    // 管理员操作

    // --- 管理功能 ---
    function addIssuer(address issuer) external {
        require(isAdmin[msg.sender], "Only admin");

        for (uint256 i = 0; i < allusers.length; i++) {
            if (allusers[i] == issuer) {
                isIssuer[issuer] = true;
                userIden[issuer] = 2;
                return;
            }
        }
        require(false, "issuer not exist");
    }
    function showAllUsers() external view returns (address[] memory) {
        require(isAdmin[msg.sender], "Only admin");
        return allusers;
    }
    function showAllUsersIden()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        require(isAdmin[msg.sender], "Only admin");
        address[] memory UserAddr = new address[](allusers.length);
        uint256[] memory UserIden = new uint256[](allusers.length);

        for (uint256 i = 0; i < allusers.length; i++) {
            UserAddr[i] = allusers[i];
            UserIden[i] = userIden[UserAddr[i]];
        }
        return (UserAddr, UserIden);
    }

    function removeIssuer(address issuer) external {
        require(isAdmin[msg.sender], "Only admin");
        isIssuer[issuer] = false;
        userIden[issuer] = 1;
    }
}
