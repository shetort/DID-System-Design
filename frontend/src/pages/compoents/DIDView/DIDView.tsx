// import { useState } from 'react';
import './DIDView.css';
import { getUserDIDs, getUserDIDDocument, updateDID, getVerifyPrivateKey, getUserPlatDIDs, getUserPlatDIDDocument } from '../../../services/identityService'
import { JSX, useEffect, useState } from 'react';


import { generateEd25519KeyPair, generateEcdsaSecp256k1KeyPair, generateX25519KeyPair, generateEcdhSecp256k1KeyPair } from '../../../services/KeyGeneration';

import { RegisterDIDParams } from '../../../type/type';
import { Buffer } from 'buffer';

interface DIDViewData {
    senderAddress: string;
    userAddress: string;
}


interface DIDDocument {
    context: string[];
    id: string;
    controller: string[];
    verificationMethod: Array<{
        id: string;
        type: string;
        controller: string;
        publicKey?: string;
    }>;
    authentication: string;
    keyAgreement: Array<{
        id: string;
        type: string;
        controller: string;
        publicKeyMultibase: string;
    }>;
    service: Array<{
        id: string;
        type: string;
        serviceEndpoint: string;
    }>;
    createdTime: string;
    updatedTime: string;
    capabilityDelegation: string;
    capabilityInvocation: string;
    verifyPrivateKey: string[];
    keyAgrPrivateKey: string[];
}

interface PlatDIDDoc {
    id: string;
    parentId: string;
    verificationMethod: {
        id: string;
        type: string;
        controller: string;
        publicKey?: string;
    };
    controller: string;
    issuer: string;
    createdTime: string;
}



export default function DIDView({ senderAddress, userAddress }: DIDViewData) {

    console.log("DIDView senderAddress:", senderAddress);
    console.log("DIDView userAddress:", userAddress);

    const [DIDs, setDIDs] = useState<string[]>([]);
    const [selectedDID, setSelectedDID] = useState('');
    const [selectedJsonDID, setSelectedJsonDID] = useState('');
    const [jsonData, setJsonData] = useState<DIDDocument | null>(null);
    const [platJsonData, setPlatJsonData] = useState<PlatDIDDoc | null>(null);

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const [editData, setEditData] = useState<DIDDocument | null>(null);

    const [newVerificationMethod, setNewVerificationMethod] = useState({
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: ''
    });
    const [newKeyAgreement, setNewKeyAgreement] = useState({
        type: 'X25519KeyAgreementKey2020',
        controller: ''
    });

    const [platDIDs, setPlatDIDs] = useState<string[]>([]);

    function hexToBytes(hexString: string): Uint8Array {
        if (!/^[0-9a-fA-F]+$/.test(hexString)) {
            throw new Error('Invalid hex string');
        }
        if (hexString.length % 2 !== 0) {
            throw new Error('Hex string must have even length');
        }
        const bytes = new Uint8Array(hexString.match(/../g)!.map(byte => parseInt(byte, 16)));
        return bytes;
    }

    const handleUpdateClick = async (did: string) => {
        try {
            setSelectedDID(did);
            const userDIDsDoc = await getUserDIDDocument(senderAddress, did);
            console.log("issuerDIDDOc))))))):", userDIDsDoc.doc);

            if (userDIDsDoc.doc == null) {
                alert("数据读取失败，请重试。");
                return;
            }
            // setEditData(userDIDsDoc.doc);
            const ppKey = await getVerifyPrivateKey(senderAddress, did);
            if (ppKey.doc == null) {
                alert("数据读取失败，请重试。");
                return;
            }

            setEditData(prev => ({
                ...(prev || {}), // 处理初始 null 的情况
                ...userDIDsDoc.doc,
                // 显式声明所有字段确保类型安全
                context: userDIDsDoc.doc.context,
                id: userDIDsDoc.doc.id,
                controller: userDIDsDoc.doc.controller,
                verificationMethod: userDIDsDoc.doc.verificationMethod,
                authentication: userDIDsDoc.doc.authentication,
                keyAgreement: userDIDsDoc.doc.keyAgreement,
                service: userDIDsDoc.doc.service,
                createdTime: userDIDsDoc.doc.createdTime,
                updatedTime: userDIDsDoc.doc.updatedTime,
                capabilityDelegation: userDIDsDoc.doc.capabilityDelegation,
                capabilityInvocation: userDIDsDoc.doc.capabilityInvocation,
                // 初始化密钥字段
                verifyPrivateKey: ppKey.doc.verifyPrivateKey,
                keyAgrPrivateKey: ppKey.doc.keyAgrPrivateKey
            }));

            console.log("editData::::", editData);

            // console.log("editData::::", editData.verifyPrivateKey);


            setIsUpdateModalOpen(true);
        } catch (error) {
            console.error('Get DID Document failed:', error);
            alert('无法获取DID文档');
        }
    };

    const handleControllerChange = (index: number, value: string) => {
        const newControllers = [...editData!.controller];
        newControllers[index] = value;
        setEditData({ ...editData!, controller: newControllers });
    };
    const handleDeleteController = (index: number) => {
        const newControllers = editData!.controller.filter((_, i) => i !== index);
        setEditData({ ...editData!, controller: newControllers });
    };
    const handleAddController = () => {
        setEditData({
            ...editData!,
            controller: [...editData!.controller, '']
        });
    };

    const handleVerificationMethodChange = (index: number, field: 'controller', value: string) => {
        // const updatedVeriMethod = 
        const updated = [...editData!.verificationMethod];
        updated[index] = { ...updated[index], [field]: value };
        setEditData({ ...editData!, verificationMethod: updated });
    };
    const handleAddVerificationMethod = async () => {

        const keyPair = generateEcdsaSecp256k1KeyPair();
        const publicKey = (await keyPair).publicKey;
        const privateKey = (await keyPair).privateKey;

        const publicKeyBytes = hexToBytes((await keyPair).publicKey);
        alert(`新添加的验证算法使用的是EcdsaSecp256k1RecoveryMethod2020加密算法，生成的公钥是${(await keyPair).publicKey}，生成的私钥是${(await keyPair).privateKey}，请拓妥善保存。`);
        const hashPrefix = Buffer.from(publicKeyBytes.slice(0, 8)).toString('hex');
        const id = `${selectedDID}#${hashPrefix}`;
        // console.log("qqqq", id)

        console.log("editDAta:", editData);

        setEditData({
            ...editData!,
            verificationMethod: [
                ...editData!.verificationMethod,
                {
                    id: id,
                    type: "EcdsaSecp256k1VerificationKey2019",
                    controller: newVerificationMethod.controller || selectedDID,
                    publicKey: publicKey
                }
            ],
            verifyPrivateKey: [...editData!.verifyPrivateKey, privateKey]
        });

        // setEditData({
        //     ...editData!,
        //     verifyPrivateKey: [...editData!.verifyPrivateKey, privateKey]
        // });
        setNewVerificationMethod({ type: 'Ed25519VerificationKey2020', controller: '' });
    };
    const handleDeleteVerificationMethod = (index: number) => {
        const updatedMethods = editData!.verificationMethod.filter((_, i) => i !== index);
        const updatePrivateKey = editData!.verifyPrivateKey.filter((_, i) => i !== index);
        setEditData({ ...editData!, verificationMethod: updatedMethods, verifyPrivateKey: updatePrivateKey });

        console.log("editData::::", editData);

        // setEditData({ ...editData!, verifyPrivateKey: updatePrivateKey });

    };

    const handleKeyAgreementChange = (index: number, field: 'controller', value: string) => {
        // const updatedVeriMethod = 
        const updated = [...editData!.keyAgreement];
        updated[index] = { ...updated[index], [field]: value };
        setEditData({ ...editData!, keyAgreement: updated });
    };
    const handleAddKeyAgreement = async () => {

        let publicKey;
        let id;
        let privateKey: string = '';

        if (newKeyAgreement.type == "X25519KeyAgreementKey2020") {
            const keyPair = generateX25519KeyPair();
            publicKey = (await keyPair).publicKey;
            privateKey = (await keyPair).privateKey;

            const publicKeyBytes = hexToBytes((await keyPair).publicKey);
            alert(`新添加的密钥管理使用的是X25519KeyAgreementKey2020加密算法，生成的公钥是${(await keyPair).publicKey}，生成的私钥是${(await keyPair).privateKey}，请拓妥善保存。`);
            const hashPrefix = Buffer.from(publicKeyBytes.slice(0, 8)).toString('hex');
            id = `${selectedDID}#${hashPrefix}`;
            // console.log("qqqq", id)
        } else if (newKeyAgreement.type == "EcdhSecp256k1Recipient2020") {
            const keyPair = generateEcdhSecp256k1KeyPair();
            publicKey = (await keyPair).publicKey;
            privateKey = (await keyPair).privateKey;

            const publicKeyBytes = hexToBytes((await keyPair).publicKey);
            alert(`新添加的密钥管理使用的是EcdhSecp256k1Recipient2020加密算法，生成的公钥是${(await keyPair).publicKey}，生成的私钥是${(await keyPair).privateKey}，请拓妥善保存。`);
            const hashPrefix = Buffer.from(publicKeyBytes.slice(0, 8)).toString('hex');
            id = `${selectedDID}#${hashPrefix}`;
            // console.log("qqqq", id)
        } else {
            publicKey = '';
            id = '';
            privateKey = '';
        }

        setEditData({
            ...editData!,
            keyAgreement: [
                ...editData!.keyAgreement,
                {
                    id: id,
                    type: newKeyAgreement.type,
                    controller: newKeyAgreement.controller,
                    publicKeyMultibase: publicKey
                }
            ]
        });

        setEditData({
            ...editData!,
            keyAgrPrivateKey: [...editData!.keyAgrPrivateKey, privateKey]
        });
        setNewKeyAgreement({ type: 'X25519KeyAgreementKey2020', controller: '' });
    };

    const handleDeleteKeyAgreement = (index: number) => {
        const updatedAgreements = editData!.keyAgreement.filter((_, i) => i !== index);
        const updatePrivateKey = editData!.keyAgrPrivateKey.filter((_, i) => i !== index);
        setEditData({ ...editData!, keyAgreement: updatedAgreements });
        setEditData({ ...editData!, keyAgrPrivateKey: updatePrivateKey });
    };

    const handleServiceChange = (index: number, field: 'type' | 'serviceEndpoint' | 'id', value: string) => {
        const updatedServices = [...editData!.service];
        updatedServices[index] = {
            ...updatedServices[index],
            [field]: value
        };
        setEditData({ ...editData!, service: updatedServices });
    };

    const handleDeleteService = (index: number) => {
        const updatedServices = editData!.service.filter((_, i) => i !== index);
        setEditData({ ...editData!, service: updatedServices });
    };

    const handleAddService = () => {
        setEditData({
            ...editData!,
            service: [
                ...editData!.service,
                { id: '', type: '', serviceEndpoint: '' }
            ]
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editData) return;
            const updateParams: RegisterDIDParams = {
                senderAddress: senderAddress,
                userAddress: userAddress,
                controller: editData.controller,
                verificationMethods: editData.verificationMethod.map(vm => ({
                    id: vm.id,
                    type: vm.type,
                    controller: vm.controller,
                    publicKey: vm.publicKey || '' // 处理undefined情况
                })),
                authenticationID: editData.authentication,
                service: editData.service.map(s => ({
                    id: s.id,
                    type: s.type,
                    serviceEndpoint: s.serviceEndpoint
                })),
                keyAgreements: editData.keyAgreement.map(ka => ({
                    id: ka.id,
                    type: ka.type,
                    controller: ka.controller,
                    publicKeyMultibase: ka.publicKeyMultibase || '' // 处理undefined情况
                })),
                capabilityDelegationID: editData.capabilityDelegation,
                capabilityInvocationID: editData.capabilityInvocation,
                verifyPrivateKey: editData.verifyPrivateKey,
                keyAgrPrivateKey: editData.keyAgrPrivateKey
            };

            console.log("updaasdasdas:", editData);
            console.log("updateParams:", updateParams);
            await updateDID(updateParams);

            setIsUpdateModalOpen(false);
            // 刷新数据
            const updatedDoc = await getUserDIDDocument(senderAddress, editData!.id);
            setJsonData(updatedDoc.doc);
            setSelectedDID('')
            alert('更新成功');
        } catch (error) {
            console.error('Update failed:', error);
            alert('更新失败');
        }
    };

    const handleButtonClick = async (did: string) => {
        // alert(`You clicked the button for: ${did}`);

        try {
            setSelectedDID(did);
            const userDIDsDoc = await getUserDIDDocument(senderAddress, did);

            if (userDIDsDoc.doc == null) {
                alert("数据读取失败，请重试");
                return;
            }
            setJsonData(userDIDsDoc.doc); // 将文档数据存入状态
        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('获取DID文档失败，请重试');
        }
    };

    const handleButtonClickPlat = async (did: string) => {
        try {

            console.log("IN HANDLEBUTTONCLICKPLAT");
            setSelectedJsonDID(did);
            const userPlatDIDsDoc = await getUserPlatDIDDocument(senderAddress, did);

            if (userPlatDIDsDoc.doc == null) {
                alert("数据读取失败，请重试");
                return;
            }

            console.log("userPlatDIDsDoc.doc:", userPlatDIDsDoc.doc);
            setPlatJsonData(userPlatDIDsDoc.doc); // 将文档数据存入状态

            console.log("platJsonData:", platJsonData);

        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('获取DID文档失败，请重试');
        }
    }

    const closeTest = () => {
        setSelectedDID('');
        setSelectedJsonDID('');
        setIsUpdateModalOpen(false);
    };

    const closeModal = () => {
        setSelectedDID('');
        setSelectedJsonDID('');
    };

    const closeUpdateModal = () => {
        closeModal();
        setIsUpdateModalOpen(false);
    }

    useEffect(() => {
        // 请求数据
        getDIDs();
        getPlatDIDs();
    }, []);

    const getDIDs = async () => {
        try {

            const userDIDs = await getUserDIDs(senderAddress, userAddress);
            if (userDIDs.dids == null) {
                alert("数据读取失败，请重试");
                return;
            }
            setDIDs(userDIDs.dids);
            console.log("DIDS:", userDIDs.dids);

        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('Get User DIDs failed,Please try again.');
        }
    };

    const getPlatDIDs = async () => {
        try {
            console.log("IN GETPLATDIDS");
            const userPlatDIDs = await getUserPlatDIDs(senderAddress, userAddress);
            console.log("userPlatDIDs:", userPlatDIDs);

            if (userPlatDIDs.dids == null) {
                alert("数据读取失败，请重试");
                return;
            }
            setPlatDIDs(userPlatDIDs.dids);
            console.log("PLAT_DIDS:", userPlatDIDs.dids);

        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('Get User DIDs failed,Please try again.');
        }
    };

    return (
        <div className="did-container">
            <div className="data-list">
                {DIDs.map((did, index) => (
                    <div key={index} className="data-item">
                        <span className="data-text">{did}</span>
                        <button
                            onClick={() => handleButtonClick(did)}
                            className="action-button"
                        >
                            查看
                        </button>
                        <button onClick={() => handleUpdateClick(did)} className="action-button">更新</button>

                    </div>
                ))}

                {platDIDs.map((did, index) => (
                    <div key={index} className="data-item">
                        <span className="data-text">{did}</span>
                        <button
                            onClick={() => handleButtonClickPlat(did)}
                            className="action-button"
                        >
                            查看
                        </button>
                    </div>
                ))}
            </div>

            {selectedDID != '' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>DID 详细信息</h3>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            {jsonData && (
                                <div className="document-details">
                                    {/* 基本字段 */}
                                    <div className="detail-row">
                                        <span className="detail-label">DID标识符:</span>
                                        <span className="detail-value">{jsonData.id}</span>
                                    </div>

                                    {/* 数组字段 */}
                                    <div className="detail-row">
                                        <span className="detail-label">上下文:</span>
                                        <div className="detail-value">
                                            {jsonData.context.join(', ')}
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">控制器:</span>
                                        <div className="detail-value">
                                            {jsonData.controller.join(', ')}
                                        </div>
                                    </div>

                                    {/* 对象数组字段 */}
                                    <div className="detail-row">
                                        <span className="detail-label">验证方法:</span>
                                        <div className="verification-methods-grid">
                                            {jsonData.verificationMethod.map((method, index) => (
                                                <div key={index} className="method-card">
                                                    <h4 className="method-index">验证方法 #{index + 1}</h4>
                                                    {/* 2x2 网格布局 */}
                                                    <div className="grid-2x2">
                                                        <div className="grid-item">
                                                            <label>ID:</label>
                                                            <span>{method.id}</span>
                                                        </div>
                                                        <div className="grid-item">
                                                            <label>类型:</label>
                                                            <span>{method.type}</span>
                                                        </div>
                                                        <div className="grid-item">
                                                            <label>控制器:</label>
                                                            <span>{method.controller}</span>
                                                        </div>
                                                        <div className="grid-item">
                                                            <label>{method.publicKey ? "公钥" : "多基公钥"}:</label>
                                                            <span className="break-all">
                                                                {method.publicKey}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">认证方式:</span>
                                        <span className="detail-value">{jsonData.authentication}</span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">密钥协议:</span>
                                        <div className="verification-methods-grid">
                                            {jsonData.keyAgreement.map((agreement, index) => (
                                                <div key={index} className="method-card">
                                                    <h4 className="method-index">密钥协议 #{index + 1}</h4>
                                                    <div className="grid-2x2">
                                                        <div className="grid-item">
                                                            <label>协议ID:</label>
                                                            <span className="break-all">{agreement.id}</span>
                                                        </div>
                                                        <div className="grid-item">
                                                            <label>密钥类型:</label>
                                                            <span>{agreement.type}</span>
                                                        </div>
                                                        <div className="grid-item">
                                                            <label>控制器:</label>
                                                            <span className="break-all">{agreement.controller}</span>
                                                        </div>
                                                        <div className="grid-item">
                                                            <label>多基公钥:</label>
                                                            <span className="break-all">{agreement.publicKeyMultibase}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">服务端点:</span>
                                        <div className="detail-value">
                                            {jsonData.service.map((s, index) => (
                                                <div key={index}>
                                                    <div>类型: {s.type}</div>
                                                    <div>端点: {s.serviceEndpoint}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 其他字段 */}
                                    <div className="detail-row">
                                        <span className="detail-label">创建时间:</span>
                                        <span className="detail-value">{jsonData.createdTime}</span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">更新时间:</span>
                                        <span className="detail-value">{jsonData.updatedTime}</span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">委托权限ID:</span>
                                        <span className="detail-value">{jsonData.capabilityDelegation}</span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">调用权限ID:</span>
                                        <span className="detail-value">{jsonData.capabilityInvocation}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="action-button" onClick={closeModal}>
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedJsonDID !== '' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>平台DID 详细信息</h3>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            {platJsonData && (
                                <div className="document-details">
                                    {/* 基础字段 */}
                                    <div className="detail-row">
                                        <span className="detail-label">DID标识符:</span>
                                        <span className="detail-value">{platJsonData.id}</span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">父DID:</span>
                                        <span className="detail-value">{platJsonData.parentId}</span>
                                    </div>

                                    {/* 验证方法 */}
                                    <div className="detail-row">
                                        <span className="detail-label">验证方法:</span>
                                        <div className="method-card">
                                            <div className="grid-2x2">
                                                <div className="grid-item">
                                                    <label>方法ID:</label>
                                                    <span>{platJsonData.verificationMethod.id}</span>
                                                </div>
                                                <div className="grid-item">
                                                    <label>密钥类型:</label>
                                                    <span>{platJsonData.verificationMethod.type}</span>
                                                </div>
                                                <div className="grid-item">
                                                    <label>控制器:</label>
                                                    <span>{platJsonData.verificationMethod.controller}</span>
                                                </div>
                                                <div className="grid-item">
                                                    <label>公钥:</label>
                                                    <span className="break-all">
                                                        {platJsonData.verificationMethod.publicKey}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 控制者信息 */}
                                    <div className="detail-row">
                                        <span className="detail-label">控制器:</span>
                                        <span className="detail-value">{platJsonData.controller}</span>
                                    </div>

                                    {/* 发行方信息 */}
                                    <div className="detail-row">
                                        <span className="detail-label">发行方:</span>
                                        <span className="detail-value">{platJsonData.issuer}</span>
                                    </div>

                                    {/* 时间信息 */}
                                    <div className="detail-row">
                                        <span className="detail-label">创建时间:</span>
                                        <span className="detail-value">{platJsonData.createdTime}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="action-button" onClick={closeModal}>
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isUpdateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsUpdateModalOpen(false)}>
                    <div className="modal-content update-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>更新DID文档</h3>
                            <button className="close-button" onClick={closeUpdateModal}>×</button>
                        </div>

                        <div className="modal-scroll-container">
                            <div className="modal-body">
                                <form >
                                    <div className="form-section">
                                        <label>Controllers:</label>
                                        {editData?.controller.map((c, index) => (
                                            <div key={index} className="array-item">
                                                <input
                                                    value={c}
                                                    onChange={(e) => handleControllerChange(index, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteController(index)}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddController}>
                                            添加Controller
                                        </button>
                                    </div>

                                    <div className="form-section">
                                        <label>验证方法:</label>
                                        {editData?.verificationMethod.map((method, index) => (
                                            <div key={method.id} className="array-item">
                                                <input value={method.type} disabled />
                                                <input
                                                    value={method.controller}
                                                    onChange={(e) =>
                                                        handleVerificationMethodChange(index, 'controller', e.target.value)
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteVerificationMethod(index)}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        ))}
                                        <div className="add-section">
                                            <div className="fixed-algorithm">
                                                <input
                                                    type="text"
                                                    value="EcdsaSecp256k1VerificationKey2019" // 固定值
                                                    readOnly // 禁止编辑
                                                    placeholder="加密算法"
                                                    className="fixed-input"
                                                />
                                            </div>
                                            <input
                                                placeholder="Controller"
                                                value={newVerificationMethod.controller}
                                                onChange={(e) => setNewVerificationMethod(prev => ({
                                                    ...prev,
                                                    controller: e.target.value
                                                }))}
                                            />
                                            <button type="button" onClick={handleAddVerificationMethod}>
                                                添加验证方法
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <label>密钥协议:</label>
                                        {editData?.keyAgreement.map((agreement, index) => (
                                            <div key={agreement.id} className="array-item">
                                                <input value={agreement.type} disabled />
                                                <input
                                                    value={agreement.controller}
                                                    onChange={(e) =>
                                                        handleKeyAgreementChange(index, 'controller', e.target.value)
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteKeyAgreement(index)}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        ))}
                                        <div className="add-section">
                                            <select
                                                value={newKeyAgreement.type}
                                                onChange={(e) => setNewKeyAgreement(prev => ({
                                                    ...prev,
                                                    type: e.target.value
                                                }))}
                                            >
                                                <option value="X25519KeyAgreementKey2020">X25519</option>
                                                <option value="EcdhSecp256k1Recipient2020">Secp256k1</option>
                                            </select>
                                            <input
                                                placeholder="Controller"
                                                value={newKeyAgreement.controller}
                                                onChange={(e) => setNewKeyAgreement(prev => ({
                                                    ...prev,
                                                    controller: e.target.value
                                                }))}
                                            />
                                            <button type="button" onClick={handleAddKeyAgreement}>
                                                添加密钥协议
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <label>Authentication ID:</label>
                                        <input
                                            value={editData?.authentication || ''}
                                            onChange={(e) => setEditData(prev => ({
                                                ...prev!,
                                                authentication: e.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="form-section">
                                        <label>Capability Delegation ID:</label>
                                        <input
                                            value={editData?.capabilityDelegation || ''}
                                            onChange={(e) => setEditData(prev => ({
                                                ...prev!,
                                                capabilityDelegation: e.target.value
                                            }))}
                                        />
                                    </div>
                                    <div className="form-section">
                                        <label>Capability Invocation ID:</label>
                                        <input
                                            value={editData?.capabilityInvocation || ''}
                                            onChange={(e) => setEditData(prev => ({
                                                ...prev!,
                                                capabilityInvocation: e.target.value
                                            }))}
                                        />
                                    </div>

                                    <div className="form-section">
                                        <label>服务端点:</label>
                                        {editData?.service.map((s, index) => (
                                            <div key={index} className="array-item">
                                                <input
                                                    placeholder="服务ID"
                                                    value={s.id}
                                                    onChange={(e) => handleServiceChange(index, 'id', e.target.value)}
                                                />
                                                <input
                                                    placeholder="服务类型"
                                                    value={s.type}
                                                    onChange={(e) => handleServiceChange(index, 'type', e.target.value)}
                                                />
                                                <input
                                                    placeholder="端点地址"
                                                    value={s.serviceEndpoint}
                                                    onChange={(e) => handleServiceChange(index, 'serviceEndpoint', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteService(index)}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddService}>
                                            添加服务端点
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="submit" onClick={handleSubmit}>提交更新</button>
                            <button type="button" onClick={() => closeTest()}>
                                取消更新
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
