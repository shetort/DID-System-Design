import './IssuerVC.css';
import { approveApplication, getApplication, getIssuerApplications, getVC, issuerVC, revokeVC, showIssuedVCID } from '../../../services/vcManagerService'
import { getUserDIDDocument, getUserDIDs, getVerifyPrivateKey } from '../../../services/identityService';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CredentialSubject, Issuer, IssueVCParams } from '../../../type/type'

interface VCViewData {
    senderAddress: string;
    issuerAddress: string;
}
type SubjectField = {
    mainKey: string;
    nestedFields: NestedField[];
};
type NestedField = {
    nestedKey: string;
    value: string;
};

type ProofAlgorithm = 'EcdsaSecp256k1VerificationKey2019';

interface VCProofState {
    type: ProofAlgorithm;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}

type PurposeType =
    'authentication' |
    'capabilityDelegation' |
    'capabilityInvocation' |
    'keyAgreement';


export type VCApplyShowData = {
    issuerID: string;
    vcType: string;
    data: Record<string, any>;
    timestamp: string;
}

const VCApplyShowDataInit = {
    issuerID: '',
    vcType: '',
    data: {},
    timestamp: '',
}

interface ApplicationFormState extends Omit<IssueVCParams, 'credentialSubject' | 'VCProof'> {
    showApplicationModal: boolean;
}

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string }) => Promise<string[]>;
            on: (event: string, callback: (accounts: string[]) => void) => void;
            removeListener: (event: string, callback: (accounts: string[]) => void) => void;
            isMetaMask?: boolean;
        };
    }
}



export default function IssuerVC({ senderAddress, issuerAddress }: VCViewData) {

    const generateProofValue = (): string => {
        const randomHex = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)).join('');

        return `urn:ecdsa:secp256k1:${randomHex}`; // 统一格式
    };

    const [VCProof, setVCProof] = useState<VCProofState>({
        type: 'EcdsaSecp256k1VerificationKey2019',
        created: '',
        verificationMethod: '',
        proofPurpose: '',
        proofValue: generateProofValue()
    });
    const [VCHashs, setVCHashs] = useState<string[]>([]);
    const [selectedVCHash, setSelectedVCHash] = useState<string | null>(null);
    const [jsonData, setJsonData] = useState<any>();

    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [formData, setFormData] = useState<Omit<IssueVCParams, 'credentialSubject' | 'VCProof'>>({
        senderAddress: '',
        issuerAddress: '',
        VCtype: ['VerifiableCredential', ''], // 第一个元素固定，第二个由用户输入
        issuerDID: '',
        proofPublicKey: '',
        expirationDate: '',
        subjectAddress: '',
        issuer: {
            id: '',
            name: ''
        }
    });
    const [credentialSubjectFields, setCredentialSubjectFields] = useState<SubjectField[]>([]);

    // let issuerVerificationPublicKeys: string[] = [];
    const [issuerVerificationMethodsIDs, setIssuerVerificationMethodsIDs] = useState<string[]>([]);

    const [issuerVerificationPrivateKeys, setIssuerVerificationPrivateKeys] = useState<string[]>([]);

    const [auVeriIDs, setAuVeriIDs] = useState<string[]>([]);
    const [cadVeriIDs, setCadVeriIDs] = useState<string[]>([]);
    const [caiVeriIDs, setCaiVeriIDs] = useState<string[]>([]);
    const [keyVeriIDs, setKeyVeriIDs] = useState<string[]>([]);


    const [issuerDIDid, setIssuerDIDid] = useState('');

    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [selectedVCToRevoke, setSelectedVCToRevoke] = useState<string | null>(null);

    const [sidebarItem, setSidebarItem] = useState<Array<[string, string]>>([]);
    const [vcApplyShowDatas, setVCApplyShowDatas] = useState<VCApplyShowData[]>([]);

    const [selectedApplication, setSelectedApplication] = useState<VCApplyShowData | null>(null);

    const [selectedAppID, setSelectedAppID] = useState('');


    const [applicationForm, setApplicationForm] = useState<ApplicationFormState>({
        showApplicationModal: false,
        senderAddress: '',
        issuerAddress: '',
        VCtype: ['VerifiableCredential', ''],
        issuerDID: '',
        proofPublicKey: '',
        expirationDate: '',
        subjectAddress: '',
        issuer: {
            id: '',
            name: ''
        }
    });

    const [choUserAddress, setChoUserAddress] = useState<string[]>([]);

    const [currentAddress, setCurrentAddress] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = async () => {
        try {
            setIsConnecting(true);
            if (!window.ethereum) {
                alert('请安装MetaMask钱包');
                return;
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts?.length > 0) {
                setCurrentAddress(accounts[0]);
                setFormData(prev => ({
                    ...prev,
                    subjectAddress: accounts[0]
                }));
            }
        } catch (error) {
            console.error('钱包连接失败:', error);
            alert('必须授权钱包访问才能继续操作');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleRevokeVC = async () => {
        if (!selectedVCToRevoke) return;

        try {
            // 调用撤销API（假设存在revokeVC方法）
            await revokeVC(senderAddress, selectedVCToRevoke);

            // 更新本地状态
            setVCHashs(prev => prev.filter(hash => hash !== selectedVCToRevoke));
            setShowRevokeModal(false);
            alert("撤销成功");
        } catch (error) {
            console.error('撤销失败:', error);
            alert('撤销失败，请重试');
        }
    };

    const addMainField = () => {
        setCredentialSubjectFields([...credentialSubjectFields, {
            mainKey: '',
            nestedFields: []
        }]);
    };

    const addNestedField = (mainIndex: number) => {
        const updated = [...credentialSubjectFields];
        updated[mainIndex].nestedFields.push({
            nestedKey: '',
            value: ''
        });
        setCredentialSubjectFields(updated);
    };

    const updateMainKey = (mainIndex: number, value: string) => {
        const updated = [...credentialSubjectFields];
        updated[mainIndex].mainKey = value;
        setCredentialSubjectFields(updated);
    };

    const updateNestedField = (
        mainIndex: number,
        nestedIndex: number,
        field: keyof NestedField,
        value: string
    ) => {
        const updated = [...credentialSubjectFields];
        updated[mainIndex].nestedFields[nestedIndex][field] = value;
        setCredentialSubjectFields(updated);
    };

    const removeMainField = (mainIndex: number) => {
        setCredentialSubjectFields(
            credentialSubjectFields.filter((_, index) => index !== mainIndex)
        );
    };

    const removeNestedField = (mainIndex: number, nestedIndex: number) => {
        console.log("INININININININININI");
        const updated = [...credentialSubjectFields];
        updated[mainIndex].nestedFields = updated[mainIndex].nestedFields
            .filter((_, index) => index !== nestedIndex);
        setCredentialSubjectFields(updated);
        console.log("999999999999999999999");
    };

    const generateCredentialSubject = (): CredentialSubject => {
        // 使用类型断言初始化基础对象
        const base = { id: `subject-${uuidv4()}` } as unknown as CredentialSubject;

        credentialSubjectFields.forEach(({ mainKey, nestedFields }) => {
            if (!mainKey) return;

            const nestedObject: { [key: string]: string } = {};
            nestedFields.forEach(({ nestedKey, value }) => {
                if (!nestedKey) return;
                nestedObject[nestedKey] = value; // 直接使用字符串值
            });

            if (Object.keys(nestedObject).length > 0) {
                // 使用类型断言绕过检查
                (base as any)[mainKey] = nestedObject;
            }
        });

        return base;
    };

    const handleCheckButtonClick = async (vcHash: string) => {
        // alert(`You clicked the button for: ${did}`);
        try {
            setSelectedVCHash(vcHash);

            const VCDoc = await getVC(senderAddress, vcHash);
            console.log("VCDOC:", VCDoc);

            if (VCDoc.VCContext == null) {
                alert("数据读取失败，请重试");
                setSelectedVCHash(null);
                return;
            }
            console.log("VCDOCTEXT:", VCDoc.VCContext);
            setJsonData(VCDoc.VCContext);
        } catch (error) {
            console.error('Get User VCs failed:', error);
            alert('Get User Vcs failed,Please try again.');
        }
    };

    const closeModal = () => {
        setSelectedVCHash(null);
    };

    const handleIssuerNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            issuer: {
                ...prev.issuer,
                name
            }
        }));
    };

    useEffect(() => {
        // 请求数据
        showIssuedVCIDs();
        setFormData(prev => ({
            ...prev,
            senderAddress,
            issuerAddress
        }));
        setVCProof(prev => ({
            ...prev,
            proofValue: generateProofValue()
        }));
        showIssuerApplyVC();
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                setCurrentAddress(accounts[0]);
                setFormData(prev => ({
                    ...prev,
                    subjectAddress: accounts[0]
                }));
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        return () => {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        };
    }, [senderAddress, issuerAddress]);

    const showIssuerApplyVC = async () => {
        setVCApplyShowDatas([]);

        console.log("ISSUERADDRESS:", issuerAddress);
        const VCApplyDataIDTemp = await getIssuerApplications(issuerAddress);
        const VCApplyDataIDList = VCApplyDataIDTemp.issuerAppIDLists;

        if (VCApplyDataIDTemp.issuerAppIDLists == null) {
            alert("数据读取失败，请重试");
            return;
        }


        const tempData: VCApplyShowData[] = [];
        const tempSibarData: Array<[string, string]> = [];
        const AddressList: string[] = [];
        for (let i = 0; i < VCApplyDataIDList.length; i++) {

            const VCApplyDataDoc = await getApplication(issuerAddress, VCApplyDataIDList[i]);
            if (VCApplyDataDoc.appList == null) {
                alert("数据读取失败，请重试");
                return;
            }
            console.log("ppppppppppppppp:", VCApplyDataDoc);
            const issuerDIDs = await getUserDIDs(issuerAddress, VCApplyDataDoc.appList.issuerAddress);
            const userDIDs = await getUserDIDs(issuerAddress, VCApplyDataDoc.appList.senderAddress);
            console.log("userDIDS:", userDIDs);
            AddressList.push(VCApplyDataDoc.appList.senderAddress);

            tempSibarData.push([VCApplyDataDoc.appList.vcType, userDIDs.dids[0]])

            tempData.push({
                issuerID: issuerDIDs.dids[0],
                vcType: VCApplyDataDoc.appList.vcType,
                data: VCApplyDataDoc.appList.data,
                timestamp: '2025.08.12' // 建议使用实际时间戳
            });
            console.log("tempData:", tempData);
        }

        setVCApplyShowDatas(tempData);
        setSidebarItem(tempSibarData);
        setChoUserAddress(AddressList);

        console.log("vcApplyShowDatas:", vcApplyShowDatas);
        console.log("vcApplyShowDatasLength:", vcApplyShowDatas.length);

    }

    const handleVCTypeChange = (value: string) => {
        const newVCType = [...formData.VCtype];
        newVCType[1] = value; // 始终修改第二个元素
        setFormData({ ...formData, VCtype: newVCType });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("issuerDIDDoc_verificationMethod:", issuerVerificationMethodsIDs);

        try {
            if (!currentAddress) {
                alert("请先连接钱包获取地址");
                return;
            }
            const credentialSubject = generateCredentialSubject();
            console.log("Hand issuerDIDid:", issuerDIDid);

            formData.issuerDID = issuerDIDid;

            const proofSig = generateProofValue();

            const finalIssuer: Issuer = {
                ...formData.issuer,
                id: issuerDIDid
            };
            const finalVCProof = {
                ...VCProof,
                created: new Date().toISOString(), // 自动生成时间
                proofValue: proofSig// 重新生成确保最新
            };
            formData.proofPublicKey = proofSig;
            formData.senderAddress = issuerAddress;
            formData.issuerAddress = issuerAddress;

            const submitData: IssueVCParams = {
                ...formData,
                credentialSubject,
                issuer: finalIssuer,
                VCProof: finalVCProof
            };

            console.log('Submit data:', submitData);
            await issuerVC(submitData);
            setShowRegistrationModal(false);
            showIssuedVCIDs();
        } catch (error) {
            console.error('颁发失败:', error);
            alert('颁发失败，请重试。');
        }
    };

    const showIssuedVCIDs = async () => {
        try {
            console.log("sendAddress:", senderAddress);
            console.log("issuerAddress:", issuerAddress);

            const vcHashs = await showIssuedVCID(senderAddress, issuerAddress);
            setVCHashs(vcHashs.vcHashsList);
            console.log("vcHashs:", vcHashs);
        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('Get User DIDs failed,Please try again.');
        }
    };

    const getDIDs = async () => {
        try {
            const userDIDs = await getUserDIDs(senderAddress, issuerAddress);
            console.log("DIDS:", userDIDs);
            console.log("DIDS.did:", userDIDs.dids);

            return userDIDs.dids;

        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('Get User DIDs failed,Please try again.');
        }
    };

    const handleRegisterVCButton = async () => {
        try {
            setShowRegistrationModal(true)
            const issuerDID = await getDIDs();
            const issuerPPKey = await getVerifyPrivateKey(senderAddress, issuerDID[0]);
            if (issuerPPKey.doc == null) {
                alert("数据读取失败，请重试");
                return;
            }

            setIssuerVerificationPrivateKeys(issuerPPKey.doc.verifyPrivateKey)

            const issuerDIDDoc = await getUserDIDDocument(senderAddress, issuerDID[0]);
            if (issuerDIDDoc.doc == null) {
                alert("数据读取失败，请重试");
                return;
            }
            console.log("issuerDIDDoc:", issuerDIDDoc.doc);

            if (issuerDIDDoc.doc.authentication == '') {
                setAuVeriIDs([]);
            } else {
                auVeriIDs.push(issuerDIDDoc.doc.authentication);
            }
            if (issuerDIDDoc.doc.capabilityDelegation == '') {
                setCadVeriIDs([]);
            } else {
                cadVeriIDs.push(issuerDIDDoc.doc.capabilityDelegation)
            }
            if (issuerDIDDoc.doc.capabilityInvocation == '') {
                setCaiVeriIDs([]);
            } else {
                caiVeriIDs.push(issuerDIDDoc.doc.capabilityInvocation)
            }
            if (issuerDIDDoc.doc.keyAgreement.length == 0) {
                setKeyVeriIDs([]);
            } else {
                for (let i = 0; i < issuerDIDDoc.doc.keyAgreement.length; i++) {
                    keyVeriIDs.push(issuerDIDDoc.doc.keyAgreement[i].id)
                }
            }

            setIssuerDIDid(issuerDIDDoc.doc.id)
            console.log("issuerDIDid:", issuerDIDid);

            const issuerVerificationMethods = issuerDIDDoc.doc.verificationMethod;
            const temp = [];
            for (let i = 0; i < issuerVerificationMethods.length; i++) {
                temp.push(issuerVerificationMethods[i].id);
            }
            setIssuerVerificationMethodsIDs(temp);
            console.log("issuerDIDDoc_verificationMethod:", issuerVerificationMethodsIDs);

        } catch (error) {
            console.error('Get User VCs failed:', error);
            alert('Get User Vcs failed,Please try again.');
        }
    };

    const convertAppDataToFields = (data: Record<string, any>): SubjectField[] => {
        return Object.entries(data).map(([key, value]) => {
            // 处理嵌套对象
            if (typeof value === 'object' && !Array.isArray(value)) {
                return {
                    mainKey: key,
                    nestedFields: Object.entries(value).map(([nestedKey, nestedValue]) => ({
                        nestedKey,
                        value: String(nestedValue)
                    }))
                };
            }
            // 处理原始值
            return {
                mainKey: key,
                nestedFields: [{
                    nestedKey: '',
                    value: String(value)
                }]
            };
        });
    };

    const handleApplicationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const credentialSubject = generateCredentialSubject();
            const finalIssuer: Issuer = {
                ...applicationForm.issuer,
                id: issuerDIDid
            };

            applicationForm.issuerDID = issuerDIDid;

            const proofSig = generateProofValue();


            const finalVCProof = {
                ...VCProof,
                created: new Date().toISOString(),
                proofValue: proofSig
            };
            applicationForm.proofPublicKey = proofSig;

            const submitData: IssueVCParams = {
                ...applicationForm,
                credentialSubject,
                issuer: finalIssuer,
                VCProof: finalVCProof,
                senderAddress: senderAddress,
                issuerAddress: issuerAddress
            };

            console.log("SUBMITDATA:", submitData);

            await issuerVC(submitData);
            await handleRejAppSubmit();
            // setApplicationForm(prev => ({ ...prev, showApplicationModal: false }));
            showIssuedVCIDs();
        } catch (error) {
            console.error('颁发失败:', error);
            alert('颁发失败，请重试。');
        }
    };

    const handleRejAppSubmit = async () => {
        console.log("Approve:", selectedAppID);
        await approveApplication(issuerAddress, selectedAppID);
        setApplicationForm(prev => ({ ...prev, showApplicationModal: false }));
        showIssuerApplyVC();
    }

    return (
        <div className="issuer-container">
            <div className="main-content">
                <h2 className="header-section">可验证凭证列表</h2>

                <button className="issue-button" onClick={handleRegisterVCButton}>
                    <span className="icon">＋</span> 颁发新凭证
                </button>

                <div className="vc-grid">
                    {VCHashs.map((vchash, index) => (
                        <div key={index} className="vc-card">
                            <div className="card-header">
                                <span className="vc-id">VC-{index + 1}</span>
                                <span className="vc-date">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="card-body">
                                <div className="vc-hash">{vchash.substring(0, 24)}...</div>
                                <div className="button-group">
                                    <button onClick={() => handleCheckButtonClick(vchash)} className="action-btn detail">
                                        详细信息
                                    </button>
                                    <button onClick={() => {
                                        setSelectedVCToRevoke(vchash);
                                        setShowRevokeModal(true);
                                    }} className="action-btn revoke">
                                        撤销凭证
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="right-sidebar">
                <h3 className="sidebar-title">申请列表</h3>
                <div className="sidebar-content">
                    {sidebarItem.map((item, index) => (
                        <div key={index} className="sidebar-card">
                            <div className="card-info">
                                <div className="card-title">{item[0]}</div>
                                <div className="card-subtitle">{item[1]}</div>
                            </div>
                            <button
                                className="card-action"
                                onClick={async () => {
                                    const VCApplyDataIDTemp = await getIssuerApplications(issuerAddress);
                                    const VCApplyDataIDList = VCApplyDataIDTemp.issuerAppIDLists;
                                    setSelectedAppID(VCApplyDataIDList[index]);

                                    const selectedApp = vcApplyShowDatas[index];
                                    const subAddress = choUserAddress[index];
                                    const issuerDID = await getDIDs();
                                    const issuerPPKey = await getVerifyPrivateKey(senderAddress, issuerDID[0]);
                                    setIssuerVerificationPrivateKeys(issuerPPKey.doc.verifyPrivateKey)

                                    const issuerDIDDoc = await getUserDIDDocument(senderAddress, issuerDID[0]);

                                    console.log("issuerDIDDoc:", issuerDIDDoc.doc);

                                    if (issuerDIDDoc.doc.authentication == '') {
                                        setAuVeriIDs([]);
                                    } else {
                                        auVeriIDs.push(issuerDIDDoc.doc.authentication);
                                    }
                                    if (issuerDIDDoc.doc.capabilityDelegation == '') {
                                        setCadVeriIDs([]);
                                    } else {
                                        cadVeriIDs.push(issuerDIDDoc.doc.capabilityDelegation)
                                    }
                                    if (issuerDIDDoc.doc.capabilityInvocation == '') {
                                        setCaiVeriIDs([]);
                                    } else {
                                        caiVeriIDs.push(issuerDIDDoc.doc.capabilityInvocation)
                                    }
                                    if (issuerDIDDoc.doc.keyAgreement.length == 0) {
                                        setKeyVeriIDs([]);
                                    } else {
                                        for (let i = 0; i < issuerDIDDoc.doc.keyAgreement.length; i++) {
                                            keyVeriIDs.push(issuerDIDDoc.doc.keyAgreement[i].id)
                                        }
                                    }

                                    setIssuerDIDid(issuerDIDDoc.doc.id)
                                    // 初始化表单数据
                                    setApplicationForm(prev => ({
                                        ...prev,
                                        showApplicationModal: true,
                                        VCtype: ['VerifiableCredential', selectedApp.vcType],
                                        subjectAddress: subAddress, // 假设数据中包含地址
                                        issuer: {
                                            ...prev.issuer,
                                            name: '' // 清空机构名称输入
                                        }
                                    }));
                                    // 自动生成凭证主题
                                    const generatedFields = convertAppDataToFields(selectedApp.data);
                                    setCredentialSubjectFields(generatedFields);
                                }}>
                                处理
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {showRegistrationModal && (
                <div className="modal-overlay" onClick={() => setShowRegistrationModal(false)}>
                    <div className="vc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="title-icon">📜</span>
                                颁发新凭证
                            </h3>
                            <button className="close-button" onClick={() => setShowRegistrationModal(false)}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>

                                <div className="form-group">
                                    <label className="form-label">颁发机构名称</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.issuer.name}
                                        onChange={(e) => handleIssuerNameChange(e.target.value)}
                                        placeholder="输入颁发机构名称"
                                        required
                                    />
                                </div>

                                {/* VC类型输入 */}
                                <div className="form-group">
                                    <label className="form-label">凭证类型</label>
                                    <div className="type-prefix">
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.VCtype[1] || ''}
                                            onChange={(e) => handleVCTypeChange(e.target.value)}
                                            placeholder="输入自定义类型"
                                        />
                                    </div>
                                </div>
                                <div className="section-divider">
                                    <span>凭证主体信息</span>
                                </div>

                                <div className="form-group">
                                    <button type="button" className="add-button" onClick={addMainField}>
                                        + 添加主字段
                                    </button>

                                    {credentialSubjectFields.map((mainField, mainIndex) => (
                                        <div key={mainIndex} className="field-group">
                                            <div className="field-header">
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="主字段名称（如 education）"
                                                    value={mainField.mainKey}
                                                    onChange={(e) => updateMainKey(mainIndex, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="remove-button"
                                                    onClick={() => removeMainField(mainIndex)}
                                                >
                                                    删除主字段
                                                </button>
                                            </div>

                                            <div className="nested-fields">
                                                <button
                                                    type="button"
                                                    className="add-nested-button"
                                                    onClick={() => addNestedField(mainIndex)}
                                                >
                                                    + 添加子字段
                                                </button>

                                                {mainField.nestedFields.map((nestedField, nestedIndex) => (
                                                    <div key={nestedIndex} className="nested-field">
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="子字段键名"
                                                            value={nestedField.nestedKey}
                                                            onChange={(e) => updateNestedField(
                                                                mainIndex,
                                                                nestedIndex,
                                                                'nestedKey',
                                                                e.target.value
                                                            )}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="输入字符串值"
                                                            value={nestedField.value}
                                                            onChange={(e) => updateNestedField(
                                                                mainIndex,
                                                                nestedIndex,
                                                                'value',
                                                                e.target.value
                                                            )}
                                                        />
                                                        <button
                                                            type="button" // 添加此属性
                                                            className="remove-nested-button"
                                                            onClick={() => { removeNestedField(mainIndex, nestedIndex); }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 在表单中添加VCProof区块 */}
                                <div className="proof-section">
                                    <div className="proof-header">
                                        <h4 className="proof-title">数字签名证明</h4>
                                    </div>

                                    <div className="proof-content">
                                        <div className="form-group">
                                            <label className="form-label">签名算法类型</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value="EcdsaSecp256k1VerificationKey2019"
                                                readOnly
                                            />
                                        </div>


                                        <div className="form-group">
                                            <label className="form-label">证明用途</label>
                                            <select
                                                className="form-input"
                                                value={VCProof.proofPurpose}
                                                onChange={(e) => {
                                                    const selectedPurpose = e.target.value as PurposeType;
                                                    let verificationMethods: string[] = [];

                                                    // 根据用途获取对应的验证方法列表
                                                    switch (selectedPurpose) {
                                                        case 'authentication':
                                                            verificationMethods = auVeriIDs;
                                                            break;
                                                        case 'capabilityDelegation':
                                                            verificationMethods = cadVeriIDs;
                                                            break;
                                                        case 'capabilityInvocation':
                                                            verificationMethods = caiVeriIDs;
                                                            break;
                                                        case 'keyAgreement':
                                                            verificationMethods = keyVeriIDs;
                                                            break;
                                                        default:
                                                            verificationMethods = [];
                                                    }

                                                    // 自动选择第一个验证方法
                                                    const firstMethod = verificationMethods[0] || '';

                                                    setVCProof(prev => ({
                                                        ...prev,
                                                        proofPurpose: selectedPurpose,
                                                        verificationMethod: firstMethod
                                                    }));

                                                    // 如果没有可用方法显示警告
                                                    if (verificationMethods.length === 0) {
                                                        alert(`当前DID文档没有配置${selectedPurpose}的验证方法`);
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="">请选择证明用途</option>
                                                <option value="authentication">Authentication</option>
                                                <option value="capabilityDelegation">Capability Delegation</option>
                                                <option value="capabilityInvocation">Capability Invocation</option>
                                                <option value="keyAgreement">Key Agreement</option>
                                            </select>
                                        </div>


                                        {/* 验证方法选择 */}
                                        <div className="form-group">
                                            <label className="form-label">验证方法</label>
                                            <select
                                                className="form-input"
                                                value={VCProof.verificationMethod}
                                                onChange={(e) => setVCProof(prev => ({
                                                    ...prev,
                                                    verificationMethod: e.target.value
                                                }))}
                                                required
                                                disabled={!VCProof.proofPurpose} // 未选择用途时禁用
                                            >
                                                <option value="">自动选择的验证方法</option>
                                                {(() => {
                                                    switch (VCProof.proofPurpose) {
                                                        case 'authentication':
                                                            return auVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        case 'capabilityDelegation':
                                                            return cadVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        case 'capabilityInvocation':
                                                            return caiVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        case 'keyAgreement':
                                                            return keyVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        default:
                                                            return null;
                                                    }
                                                })()}
                                            </select>

                                            {!VCProof.verificationMethod && VCProof.proofPurpose && (
                                                <div className="form-error">
                                                    该用途下没有可用的验证方法，请检查DID文档配置
                                                </div>
                                            )}
                                        </div>

                                        {/* 自动生成的证明值（只读）
                                        <div className="form-group">
                                            <label className="form-label">数字签名</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={VCProof.proofValue || '正在生成签名...'}
                                                readOnly
                                                placeholder="自动生成签名值"
                                            />
                                        </div> */}
                                    </div>
                                </div>

                                {/* 过期日期 */}
                                <div className="form-group">
                                    <label className="form-label">过期日期</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.expirationDate}
                                        onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                                    />
                                </div>

                                {/* 持有者地址 */}
                                <div className="form-group">
                                    <label className="form-label">持有者地址</label>
                                    <div className="address-input-wrapper">
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.subjectAddress}
                                            readOnly
                                            placeholder="点击连接钱包获取地址"
                                            style={{ cursor: 'not-allowed' }}
                                        />
                                        <button
                                            type="button"
                                            className="connect-button"
                                            onClick={connectWallet}
                                            disabled={isConnecting}
                                        >
                                            {isConnecting ? '连接中...' : '连接钱包'}
                                        </button>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="submit" className="gradient-button">
                                        立即颁发
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div >
                </div >
            )}

            {selectedVCHash && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="vc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="title-icon">📄</span>
                                凭证详细信息
                            </h3>
                            <button className="close-button" onClick={closeModal}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            {jsonData ? (
                                <div className="info-container">
                                    {/* 基础信息 */}
                                    <div className="info-row">
                                        <span className="info-label">凭证ID</span>
                                        <span className="info-value code">{jsonData.id}</span>
                                    </div>

                                    {/* 凭证类型 */}
                                    <div className="info-row">
                                        <span className="info-label">凭证类型</span>
                                        <div className="type-tags">
                                            {jsonData?.type?.map((t: string, i: number) => (
                                                <span key={i} className="type-tag">{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 颁发者信息 */}
                                    <div className="info-section">
                                        <h4 className="section-subtitle">颁发者信息</h4>
                                        <div className="info-row">
                                            <span className="info-label">DID标识符</span>
                                            <span className="info-value highlight">{jsonData.issuer.id}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">机构名称</span>
                                            <span className="info-value">{jsonData.issuer.name}</span>
                                        </div>
                                    </div>

                                    {/* 有效期 */}
                                    <div className="info-section">
                                        <h4 className="section-subtitle">有效期</h4>
                                        <div className="info-row">
                                            <span className="info-label">颁发时间</span>
                                            <span className="info-value">
                                                {new Date(jsonData.issuanceDate).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">过期时间</span>
                                            <span className="info-value">
                                                {new Date(jsonData.expirationDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 凭证主体 */}
                                    <div className="info-section">
                                        <h4 className="section-subtitle">凭证内容</h4>
                                        {Object.entries(jsonData.credentialSubject).map(([key, value]) => {
                                            if (key === 'id') return null;
                                            return (
                                                <div className="nested-info" key={key}>
                                                    <div className="info-row main-field">
                                                        <span className="info-label">{key}</span>
                                                    </div>
                                                    {Object.entries(value as object).map(([subKey, subValue]) => (
                                                        <div className="info-row nested-field" key={subKey}>
                                                            <span className="info-label sub">{subKey}</span>
                                                            <span className="info-value">{subValue}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 数字签名 */}
                                    <div className="info-section">
                                        <h4 className="section-subtitle">数字签名</h4>
                                        <div className="info-row">
                                            <span className="info-label">算法类型</span>
                                            <span className="info-value tag">{jsonData.proof.type}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">验证方法</span>
                                            <span className="info-value code">{jsonData.proof.verificationMethod}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">签名值</span>
                                            <span className="info-value code">{jsonData.proof.proofValue}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">创建时间</span>
                                            <span className="info-value">
                                                {new Date(jsonData.proof.created).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="loading-state">
                                    <div className="loader"></div>
                                    正在加载凭证数据...
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="gradient-button" onClick={closeModal}>
                                关闭窗口
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {showRevokeModal && (
                <div className="modal-overlay" onClick={() => setShowRevokeModal(false)}>
                    <div className="vc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="title-icon">⚠️</span>
                                确认撤销凭证
                            </h3>
                            <button className="close-button" onClick={() => setShowRevokeModal(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>确定要撤销该凭证吗？此操作不可逆！</p>
                            <div className="modal-footer">
                                <button
                                    className="gradient-button danger"
                                    onClick={handleRevokeVC}
                                >
                                    确认撤销
                                </button>
                                <button
                                    className="gradient-button"
                                    onClick={() => setShowRevokeModal(false)}
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {applicationForm.showApplicationModal && (
                <div className="modal-overlay" onClick={() => setApplicationForm(prev => ({ ...prev, showApplicationModal: false }))}>
                    <div className="vc-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="title-icon">📜</span>
                                申请处理 - {applicationForm.VCtype[1]}
                            </h3>
                            <button className="close-button" onClick={() => setApplicationForm(prev => ({ ...prev, showApplicationModal: false }))}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleApplicationSubmit}>
                                {/* 颁发机构名称（保持可编辑） */}
                                <div className="form-group">
                                    <label className="form-label">颁发机构名称</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={applicationForm.issuer.name}
                                        onChange={(e) => setApplicationForm(prev => ({
                                            ...prev,
                                            issuer: { ...prev.issuer, name: e.target.value }
                                        }))}
                                        placeholder="输入颁发机构名称"
                                        required
                                    />
                                </div>

                                {/* 凭证类型（只读） */}
                                <div className="form-group">
                                    <label className="form-label">凭证类型</label>
                                    <div className="type-tag-display">
                                        {/* <span className="base-type">VerifiableCredential</span>
                                        <span className="base-type">{"        "}</span> */}
                                        <span className="base-type">{applicationForm.VCtype[0]}</span>

                                        <span className="custom-type">{applicationForm.VCtype[1]}</span>
                                    </div>
                                </div>

                                {/* 凭证主体信息（只读） */}
                                <div className="section-divider">
                                    <span>申请主体信息</span>
                                </div>
                                <div className="readonly-fields">
                                    {credentialSubjectFields.map((mainField, mainIndex) => (
                                        <div key={mainIndex} className="field-group">
                                            <div className="main-field-header">
                                                <span className="main-key">{mainField.mainKey}</span>
                                            </div>
                                            <div className="nested-fields-grid">
                                                {mainField.nestedFields.map((nestedField, nestedIndex) => (
                                                    <div key={nestedIndex} className="nested-field-item">
                                                        <div className="nested-key">{nestedField.nestedKey}</div>
                                                        <div className="nested-value">{nestedField.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="proof-section">
                                    <div className="proof-header">
                                        <h4 className="proof-title">数字签名证明</h4>
                                    </div>

                                    <div className="proof-content">
                                        <div className="form-group">
                                            <label className="form-label">签名算法类型</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value="EcdsaSecp256k1VerificationKey2019"
                                                readOnly
                                            />
                                            {/* <div className="form-hint">当前固定使用 ECDSA secp256k1 算法</div> */}
                                        </div>


                                        <div className="form-group">
                                            <label className="form-label">证明用途</label>
                                            <select
                                                className="form-input"
                                                value={VCProof.proofPurpose}
                                                onChange={(e) => {
                                                    const selectedPurpose = e.target.value as PurposeType;
                                                    let verificationMethods: string[] = [];

                                                    // 根据用途获取对应的验证方法列表
                                                    switch (selectedPurpose) {
                                                        case 'authentication':
                                                            verificationMethods = auVeriIDs;
                                                            break;
                                                        case 'capabilityDelegation':
                                                            verificationMethods = cadVeriIDs;
                                                            break;
                                                        case 'capabilityInvocation':
                                                            verificationMethods = caiVeriIDs;
                                                            break;
                                                        case 'keyAgreement':
                                                            verificationMethods = keyVeriIDs;
                                                            break;
                                                        default:
                                                            verificationMethods = [];
                                                    }

                                                    // 自动选择第一个验证方法
                                                    const firstMethod = verificationMethods[0] || '';

                                                    setVCProof(prev => ({
                                                        ...prev,
                                                        proofPurpose: selectedPurpose,
                                                        verificationMethod: firstMethod
                                                    }));

                                                    // 如果没有可用方法显示警告
                                                    if (verificationMethods.length === 0) {
                                                        alert(`当前DID文档没有配置${selectedPurpose}的验证方法`);
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="">请选择证明用途</option>
                                                <option value="authentication">Authentication</option>
                                                <option value="capabilityDelegation">Capability Delegation</option>
                                                <option value="capabilityInvocation">Capability Invocation</option>
                                                <option value="keyAgreement">Key Agreement</option>
                                            </select>
                                        </div>


                                        {/* 验证方法选择 */}
                                        <div className="form-group">
                                            <label className="form-label">验证方法</label>
                                            <select
                                                className="form-input"
                                                value={VCProof.verificationMethod}
                                                onChange={(e) => setVCProof(prev => ({
                                                    ...prev,
                                                    verificationMethod: e.target.value
                                                }))}
                                                required
                                                disabled={!VCProof.proofPurpose} // 未选择用途时禁用
                                            >
                                                <option value="">自动选择的验证方法</option>
                                                {(() => {
                                                    switch (VCProof.proofPurpose) {
                                                        case 'authentication':
                                                            return auVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        case 'capabilityDelegation':
                                                            return cadVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        case 'capabilityInvocation':
                                                            return caiVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        case 'keyAgreement':
                                                            return keyVeriIDs.map(id =>
                                                                <option key={id} value={id}>{id}</option>);
                                                        default:
                                                            return null;
                                                    }
                                                })()}
                                            </select>

                                            {!VCProof.verificationMethod && VCProof.proofPurpose && (
                                                <div className="form-error">
                                                    该用途下没有可用的验证方法，请检查DID文档配置
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 过期日期（保持可编辑） */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">过期日期</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={applicationForm.expirationDate}
                                            onChange={(e) => setApplicationForm(prev => ({
                                                ...prev,
                                                expirationDate: e.target.value
                                            }))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">持有者地址</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={applicationForm.subjectAddress}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="gradient-button danger"
                                        onClick={handleRejAppSubmit}>
                                        驳 回
                                    </button>
                                    <button type="submit" className="gradient-button">
                                        立即签发
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
