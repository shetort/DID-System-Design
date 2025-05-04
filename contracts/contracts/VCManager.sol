// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {console} from "hardhat/console.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./IdentityRegistry.sol";

contract VCManager {
    using EnumerableSet for EnumerableSet.UintSet;

    IdentityRegistry public iden; // 实例变量

    constructor(address _aAddress) {
        iden = IdentityRegistry(_aAddress); // 通过地址实例化
    }

    // 数据结构定义
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
        string dataCid;
        bool approved;
    }

    struct VP {
        bool context;
        bool vcId;
        bool vcType;
        bool issuer;
        bool issuanceDate;
        bool expirationDate;
        bool credentialSubject;
    }

    mapping(address => EnumerableSet.UintSet) private userApplications;
    mapping(uint256 => Application) private applications;
    mapping(address => EnumerableSet.UintSet) private issuerApplications;

    mapping(string => bool) public idExistCheck;
    mapping(string => string) public vpCID;

    uint256 private nextApplicationId = 1;

    function submitApplication(Application calldata applyData) external {
        uint256 applicationId = nextApplicationId++;

        applications[applicationId] = applyData;

        userApplications[msg.sender].add(applicationId);

        issuerApplications[applyData.issuerAddress].add(applicationId);
    }

    // 审批申请
    function approveApplication(uint256 applicationId) external {
        require(!applications[applicationId].approved, "Already approved");

        applications[applicationId].approved = true;
        address user = applications[applicationId].userAddress;
        address issuer = applications[applicationId].issuerAddress;

        userApplications[user].remove(applicationId);
        issuerApplications[issuer].remove(applicationId);

        delete applications[applicationId];
    }

    // 获取用户的所有申请ID
    function getApplicationIds(
        address user
    ) external view returns (uint256[] memory) {
        return userApplications[user].values();
    }

    function getIssuerApplications() external view returns (uint256[] memory) {
        return issuerApplications[msg.sender].values();
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
    mapping(string => VP) public vpShow;
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
        // vpShow[_id] = VP({
        //     context: true,
        //     vcId: true,
        //     vcType: true,
        //     issuer: true,
        //     issuanceDate: true,
        //     expirationDate: true,
        //     credentialSubject: true
        // });

        VCDocExist[_id] = true;
        _issuedVCsID[msg.sender].push(_id);
        _addressTovcID[subjectAddress].push(_id);
        emit VCIssued(msg.sender, true);
    }

    function verifyVC(
        string calldata vcId,
        string memory didId
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
        if (!iden.checkIdExist(didId)) {
            VCStatus = false;
        }
        if (vc.expirationDate < block.timestamp) {
            VCStatus = false;
        }
        return (VCStatus, vc.cid, vc.issuerDIDId, vc.publicKey);
    }

    function setVP(string calldata id, string calldata cid) external {
        vpCID[id] = cid;
    }

    function getVPShow(
        string calldata vcId
    ) external view returns (string memory) {
        return vpCID[vcId];
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
}
