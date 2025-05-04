// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 去中心化身份认证与登录统一合约
/// @author You
/// @notice 集成DID注册、子身份注册与登录判断功能
import {console} from "hardhat/console.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract IdenManage {
    using EnumerableSet for EnumerableSet.UintSet;
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

    mapping(string => mapping(string => string)) idToPurposeToMethod;

    address[] public allusers;
    mapping(address => uint256) public userIden;

    // 存储用户所有的DID
    mapping(address => DIDDocument[]) public addrToDIDDoc;
    mapping(string => DIDDocument) public idToDIDDoc;
    // 用户DID之间的关系
    mapping(string => DIDDocument[]) public didMapping;

    mapping(string => DIDInfo) public dids;
    mapping(address => string[]) public userDIDs;

    mapping(string => bool) idExist;

    //处理申请需要的映射--》
    // 每个用户要有一个（address对应）
    // 每个颁发者要有一个（address对应）

    // --- 角色管理 ---
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isIssuer;

    // --- 事件定义 ---
    event RootDIDRegistered(address user, string did);
    event SubDIDRegistered(address issuer, string did, string parentDID);
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
        idExist[_id] = true;

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

    // --- 更新功能 ---

    /// @notice 更新根DID或子DID
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

    /// @notice 递归更新所有子DID的父DID
    function updateSubDIDs(
        string calldata parentDID,
        string calldata newParentDID
    ) internal {
        // 遍历所有DID，查找父DID匹配的子DID
        string[] storage userDIDList = userDIDs[msg.sender];
        for (uint256 i = 0; i < userDIDList.length; i++) {
            if (
                keccak256(abi.encodePacked(dids[userDIDList[i]].parentDID)) ==
                keccak256(abi.encodePacked(parentDID))
            ) {
                dids[userDIDList[i]].parentDID = newParentDID;
                break;
            }
        }
    }

    // --- 登录验证 ---

    /// @notice 登录本系统：只需判断DID是否存在
    function loginSystem(string calldata id) external view returns (bool) {
        bool success = idExist[id];
        return success;
    }

    /// @notice 登录颁发者平台：判断 DID 是否存在且前缀匹配平台
    function loginIssuerPlatform(
        string calldata id
    ) external view returns (bool) {
        bool success = idExist[id];
        return success;
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

    // function getVerifyIDs(string issuer) external {
    //     return
    // }

    struct VCDocOnChain {
        string id;
        string cid;
        string issuerDIDId;
        string publicKey;
        uint256 issuanceDate;
        uint256 expirationDate;
    }

    struct keyPair {
        string key;
        string value;
    }

    struct Application {
        address userAddress;
        address issuerAddress;
        string vcType;
        keyPair[] data;
        bool approved;
    }

    mapping(address => EnumerableSet.UintSet) private userApplications;
    mapping(uint256 => Application) private applications;
    mapping(address => uint256) public issuerApplications;

    uint256 private nextApplicationId = 1;

    function submitApplication(Application calldata applyData) external {
        uint256 applicationId = nextApplicationId++;

        applications[nextApplicationId] = applyData;
        // applications[applicationId] = Application(msg.sender, data, false);
        userApplications[msg.sender].add(applicationId);
    }

    // 审批申请
    function approveApplication(uint256 applicationId) external {
        // require(
        //     // applications[applicationId].user != address(0),
        //     "Application does not exist"
        // );
        // // require(!applications[applicationId].approved, "Already approved");

        // applications[applicationId].approved = true;
        // address user = applications[applicationId].user;

        // userApplications[user].remove(applicationId);
        delete applications[applicationId];
        // applications[applicationId];
    }

    // 获取用户的所有申请ID
    function getApplicationIds(
        address user
    ) external view returns (uint256[] memory) {
        return userApplications[user].values();
    }

    // 获取申请详情
    function getApplication(
        uint256 applicationId
    ) external view returns (Application memory) {
        return applications[applicationId];
    }

    mapping(address => string[]) private _issuedVCsID;
    mapping(address => string[]) private _addressTovcID;
    mapping(string => VCDocOnChain) public idToVCDoc;
    mapping(string => bool) public VCDocExist;

    event VCIssued(address senderAddress, bool success);
    function issuerVC(
        address subjectAddress,
        string calldata _id,
        string calldata _cid,
        string calldata _issuerDIDId,
        string memory _publicKey,
        uint256 _issuanceDate,
        uint256 _expirationDate
    ) external {
        require(!VCDocExist[_id], "vc has exist");
        require(_expirationDate > block.timestamp, "Invalid expiration");
        idToVCDoc[_id] = VCDocOnChain({
            id: _id,
            cid: _cid,
            issuerDIDId: _issuerDIDId,
            publicKey: _publicKey,
            issuanceDate: _issuanceDate,
            expirationDate: _expirationDate
        });
        VCDocExist[_id] = true;
        _issuedVCsID[msg.sender].push(_id);
        _addressTovcID[subjectAddress].push(_id);
        emit VCIssued(msg.sender, true);
    }

    function verifyVC(
        string calldata vcId,
        string calldata didId
    )
        external
        view
        returns (bool, string memory, string memory, string memory)
    {
        VCDocOnChain memory vc = idToVCDoc[vcId];
        bool VCStatus = true;
        if (!VCDocExist[vcId]) {
            VCStatus = false;
        }
        if (!idExist[didId]) {
            VCStatus = false;
        }
        if (vc.expirationDate < block.timestamp) {
            VCStatus = false;
        }
        return (VCStatus, vc.cid, vc.issuerDIDId, vc.publicKey);
    }

    function showVCID(
        address subjectAddress
    ) external view returns (string[] memory) {
        string[] storage vcIDs = _addressTovcID[subjectAddress];

        uint256 validCount = 0;
        for (uint256 i = 0; i < vcIDs.length; i++) {
            console.log("VCIDs:", vcIDs[i]);

            if (VCDocExist[vcIDs[i]]) {
                validCount++;
            }
        }

        console.log("VCEXIst NUM:", validCount);

        string[] memory vcIdTemp = new string[](validCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < vcIDs.length; i++) {
            if (VCDocExist[vcIDs[i]]) {
                vcIdTemp[currentIndex] = vcIDs[i];
                currentIndex++;
            }
        }
        return vcIdTemp;
    }

    function showIssuedVCID(
        address issuerAddress
    ) external view returns (string[] memory) {
        string[] storage vcIDs = _issuedVCsID[issuerAddress];

        uint256 validCount = 0;
        for (uint256 i = 0; i < vcIDs.length; i++) {
            console.log("VCIDs:", vcIDs[i]);

            if (VCDocExist[vcIDs[i]]) {
                console.log("inExist:", VCDocExist[vcIDs[i]]);
                validCount++;
            }
        }

        console.log("VCEXIst NUM:", validCount);

        string[] memory vcIdTemp = new string[](validCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < vcIDs.length; i++) {
            if (VCDocExist[vcIDs[i]]) {
                vcIdTemp[currentIndex] = vcIDs[i];
                currentIndex++;
            }
        }
        return vcIdTemp;
    }

    function getVC(string calldata vcId) external view returns (string memory) {
        console.log("in getVC");
        VCDocOnChain memory vc = idToVCDoc[vcId];
        console.log("in GOOD");
        return (vc.cid);
    }

    function revokeVC(string calldata vcId) external {
        console.log("in getVC");
        console.log("VCID:", vcId);
        VCDocExist[vcId] = false;
        console.log("in GOOD");
    }

    function applyVC(address) external {}
}

// VC数据：VC的CID，吊销状态，颁发者的DID和publicKey，时间戳
