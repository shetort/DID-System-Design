// src/components/RegistrationForm.tsx
import { useEffect, useState } from 'react';
import './Register.css';
import { registerDID } from '../../services/identityService'

import { Buffer } from 'buffer';

import { RegisterDIDParams, VerificationMethod, ServiceEndpoint, KeyAgreement, VerificationMethodInput, KeyAgreementInput, KeyAgreementType } from '../../type/type';
import { generateEd25519KeyPair, generateEcdsaSecp256k1KeyPair, generateX25519KeyPair, generateEcdhSecp256k1KeyPair } from '../../services/KeyGeneration';
import { Link } from 'react-router-dom';

const senderAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

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

export default function RegistrationForm() {


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


    // 主表单状态
    const [formData, setFormData] = useState<Omit<RegisterDIDParams, 'verificationMethods' | 'service' | 'keyAgreements' | 'verifyPrivateKey' | 'keyAgrPrivateKey'>>({
        senderAddress: '',
        userAddress: '',
        controller: [''],
        authenticationID: '',
        capabilityDelegationID: '',
        capabilityInvocationID: '',
    });

    formData.senderAddress = senderAddress;

    // 动态数组状态
    const [verificationMethods, setVerificationMethods] = useState<VerificationMethod[]>([]);
    const [keyAgreements, setKeyAgreements] = useState<KeyAgreement[]>([]);

    const [services, setServices] = useState<ServiceEndpoint[]>([
        { id: '', type: '', serviceEndpoint: '' }
    ]);

    // const [id,setId] = use


    const [verificationMethodsInput, setVerificationMethodsInput] = useState<VerificationMethodInput[]>([
        { type: 'EcdsaSecp256k1VerificationKey2019', controller: '' }
    ]);
    const [keyAgreementsInput, setKeyAgreementsInput] = useState<KeyAgreementInput[]>([
        { type: 'EcdsaSecp256k1VerificationKey2019', controller: '' }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    userAddress: accounts[0]
                }));
            } else {
                setFormData(prev => ({ ...prev, userAddress: '' }));
            }
            setIsConnecting(false);
        };

        const connectWallet = async () => {
            try {
                if (!window.ethereum) {
                    alert('请安装MetaMask钱包');
                    setIsConnecting(false);
                    return;
                }

                // 添加账户变化监听
                window.ethereum.on('accountsChanged', handleAccountsChanged);

                // 强制重新连接钱包
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (accounts.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        userAddress: accounts[0]
                    }));
                }
                setIsConnecting(false);

            } catch (error) {
                console.error('连接钱包失败:', error);
                alert('必须授权钱包访问才能继续操作');
                setIsConnecting(false);
            }
        };

        setIsConnecting(true);
        connectWallet();

        // 清理函数
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);


    // 处理基础字段变化
    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleControllerChange = (index: number, value: string) => {
        const newControllers = [...formData.controller];
        newControllers[index] = value;
        setFormData(prev => ({ ...prev, controller: newControllers }));
    };

    const addArrayItem = (type: 'controller' | 'vm' | 'service' | 'key') => {
        switch (type) {
            case 'controller':
                setFormData(prev => ({ ...prev, controller: [...prev.controller, ''] }));
                break;
            case 'vm':
                setVerificationMethodsInput(prev => [...prev, { type: '', controller: '' }]);
                break;
            case 'service':
                setServices(prev => [...prev, { id: '', type: '', serviceEndpoint: '' }]);
                break;
            case 'key':
                setKeyAgreementsInput(prev => [...prev, { id: '', type: '', controller: '', publicKeyMultibase: '' }]);
                break;
        }
    };

    const removeArrayItem = (type: 'controller' | 'vm' | 'service' | 'key', index: number) => {
        switch (type) {
            case 'controller':
                setFormData(prev => ({
                    ...prev,
                    controller: prev.controller.filter((_, i) => i !== index)
                }));
                break;
            case 'vm':
                setVerificationMethodsInput(prev => prev.filter((_, i) => i !== index));
                break;
            case 'service':
                setServices(prev => prev.filter((_, i) => i !== index));
                break;
            case 'key':
                setKeyAgreementsInput(prev => prev.filter((_, i) => i !== index));
                break;
        }
    };



    // 提交处理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const id = `did:eth:${formData.userAddress}`;

        let veriId: string[] = [];
        let veriPublicKey: string[] = [];
        let veriPrivateKey: string[] = [];

        let keyAgrId: string[] = [];
        let keyAgrPublicKey: string[] = [];
        let keyAgrPrivateKey: string[] = [];

        let allController: string[] = [];
        let keyMessage: string[] = [];

        for (let i = 0; i < verificationMethodsInput.length; i++) {
            const keyPair = generateEcdsaSecp256k1KeyPair();
            keyMessage.push(`第${i + 1}个验证算法生成的公钥是${(await keyPair).publicKey}，生成的私钥是${(await keyPair).privateKey}`);
            veriPublicKey.push((await keyPair).publicKey);
            veriPrivateKey.push((await keyPair).privateKey);

            const publicKeyBytes = hexToBytes((await keyPair).publicKey);
            const hashPrefix = Buffer.from(publicKeyBytes.slice(0, 8)).toString('hex');
            const verificationMethodId = `${id}#${hashPrefix}`;
            console.log("22222", verificationMethodId)
            veriId.push(verificationMethodId);
        }

        console.log("1111111111111111111111111:", verificationMethodsInput.length)
        keyMessage.push('\n');
        for (let i = 0; i < keyAgreementsInput.length; i++) {
            if (keyAgreementsInput[i].type == "X25519KeyAgreementKey2020") {
                const keyPair = generateX25519KeyPair();
                keyMessage.push(`第${i + 1}个密钥协议使用的是X25519KeyAgreementKey2020加密算法，公钥：${(await keyPair).publicKey}，私钥：${(await keyPair).privateKey}`);
                keyAgrPublicKey.push((await keyPair).publicKey);
                keyAgrPrivateKey.push((await keyPair).privateKey);

                const publicKeyBytes = hexToBytes((await keyPair).publicKey);
                const hashPrefix = Buffer.from(publicKeyBytes.slice(0, 8)).toString('hex');
                const keyAgreementId = `${id}#${hashPrefix}`;
                console.log("3333333", keyAgreementId)
                keyAgrId.push(keyAgreementId);
            } else if (keyAgreementsInput[i].type == "EcdhSecp256k1Recipient2020") {
                const keyPair = generateEcdhSecp256k1KeyPair();
                keyMessage.push(`第${i + 1}个密钥协议使用的是EcdhSecp256k1Recipient2020加密算法，公钥：${(await keyPair).publicKey}，私钥：${(await keyPair).privateKey}`);
                keyAgrPublicKey.push((await keyPair).publicKey);
                keyAgrPrivateKey.push((await keyPair).privateKey);

                const publicKeyBytes = hexToBytes((await keyPair).publicKey);
                const hashPrefix = Buffer.from(publicKeyBytes.slice(0, 8)).toString('hex');
                const keyAgreementId = `${id}#${hashPrefix}`;
                console.log("4444444", keyAgreementId)
                keyAgrId.push(keyAgreementId);
            }
        }
        keyMessage.push('\n');
        keyMessage.push(`你的did标识符为：${id}，请妥善保存。`)


        allController.push(id);
        for (let i = 0; i < formData.controller.length; i++) {
            allController.push(formData.controller[i]);
        }
        formData.controller = allController;


        for (let i = 0; i < verificationMethodsInput.length; i++) {
            verificationMethods.push({
                id: veriId[i],
                type: "EcdsaSecp256k1VerificationKey2019",
                controller: verificationMethodsInput[i].controller || id,
                publicKey: veriPublicKey[i]
            })
        }
        for (let i = 0; i < keyAgreementsInput.length; i++) {
            keyAgreements.push({
                id: keyAgrId[i],
                type: keyAgreementsInput[i].type,
                controller: keyAgreementsInput[i].controller || id,
                publicKeyMultibase: keyAgrPublicKey[i]
            })
        }

        console.log("verification:", verificationMethods);
        const authIndex = parseInt(formData.authenticationID)
        if (authIndex <= verificationMethodsInput.length) {
            formData.authenticationID = verificationMethods[authIndex].id;
        }
        const caInIndex = parseInt(formData.capabilityInvocationID)
        if (caInIndex <= verificationMethodsInput.length) {
            formData.capabilityInvocationID = verificationMethods[caInIndex].id;
        }
        const caDeIndex = parseInt(formData.capabilityDelegationID)
        if (caDeIndex <= verificationMethodsInput.length) {
            formData.capabilityDelegationID = verificationMethods[caDeIndex].id;
        }
        const fullData: RegisterDIDParams = {
            ...formData,
            verificationMethods: verificationMethods,
            service: services,
            keyAgreements: keyAgreements,
            verifyPrivateKey: veriPrivateKey,
            keyAgrPrivateKey: keyAgrPrivateKey
        };

        veriId = [];
        veriPublicKey = [];
        keyAgrId = [];
        keyAgrPublicKey = [];
        allController = [];

        setFormData({
            senderAddress: '',
            userAddress: '',
            controller: [''],
            authenticationID: '',
            capabilityDelegationID: '',
            capabilityInvocationID: '',
        });

        setVerificationMethods([]);
        setVerificationMethodsInput([]);
        setServices([]);
        setKeyAgreements([]);
        setKeyAgreementsInput([]);

        console.log('表单已重置');

        console.log('提交数据:', fullData);
        try {
            console.log("asdasdasdad");
            alert(keyMessage);
            keyMessage = [];
            console.log("fullDATA:", fullData);
            const result = await registerDID(fullData)
            // const infoMessage = `用户did: ${result.result.did}`;
            console.log("result:", result)
            alert("注册成功");

        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-container">
            <h1>注册DID</h1>

            <form onSubmit={handleSubmit} className="form-wrapper">
                <div className="form-section">
                    <div className="input-group">
                        <label>用户地址:</label>

                        <label>用户地址:</label>
                        {isConnecting ? (
                            <div className="wallet-connecting">
                                <div className="loading-spinner"></div>
                                <span>正在连接钱包...</span>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={formData.userAddress}
                                    readOnly
                                    placeholder="已连接钱包地址"
                                    style={{ cursor: 'not-allowed' }}
                                />
                                <div className="wallet-notice">
                                    {formData.userAddress ? (
                                        <small>当前连接地址: {formData.userAddress}</small>
                                    ) : (
                                        <small className="error">未检测到有效地址，请刷新页面重试</small>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <h2>额外持有者</h2>
                    {formData.controller.map((controller, index) => (
                        <div key={index} className="array-item">
                            <input
                                type="text"
                                placeholder='用户did标识符'
                                value={controller}
                                onChange={(e) => handleControllerChange(index, e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeArrayItem('controller', index)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="add-btn"
                        onClick={() => addArrayItem('controller')}
                    >
                        添加额外持有者
                    </button>
                </div>

                <div className="form-section">
                    <h2>验证方法</h2>
                    {verificationMethodsInput.map((method, index) => (
                        <div key={index} className="array-item">
                            <div className="fixed-method">
                                <input
                                    type="text"
                                    value="EcdsaSecp256k1VerificationKey2019"
                                    readOnly
                                    placeholder="加密算法"
                                />
                            </div>


                            <input
                                type="text"
                                placeholder="操作者（默认是自己）"
                                value={method.controller}
                                onChange={e => setVerificationMethodsInput(prev => {
                                    const newArr = [...prev];
                                    newArr[index].controller = e.target.value;
                                    return newArr;
                                })}
                            />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeArrayItem('vm', index)}>
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="add-btn"
                        onClick={() => addArrayItem('vm')}
                    >
                        添加验证方法
                    </button>
                </div>
                <div className="form-section">
                    <h2>服务信息</h2>
                    {services.map((service, index) => (
                        <div key={index} className="array-item">
                            <input
                                type="text"
                                placeholder="服务ID"
                                value={service.id}
                                onChange={e => setServices(prev => {
                                    const newArr = [...prev];
                                    newArr[index].id = e.target.value;
                                    return newArr;
                                })}
                            />
                            <input
                                type="text"
                                placeholder="服务类型"
                                value={service.type}
                                onChange={e => setServices(prev => {
                                    const newArr = [...prev];
                                    newArr[index].type = e.target.value;
                                    return newArr;
                                })}
                            />
                            <input
                                type="text"
                                // type="url"
                                placeholder="服务端点"
                                value={service.serviceEndpoint}
                                onChange={e => setServices(prev => {
                                    const newArr = [...prev];
                                    newArr[index].serviceEndpoint = e.target.value;
                                    return newArr;
                                })}
                            />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeArrayItem('service', index)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="add-btn"
                        onClick={() => addArrayItem('service')}
                    >
                        添加服务
                    </button>
                </div>

                <div className="form-section">
                    <h2>密钥协议</h2>
                    {keyAgreementsInput.map((agreement, index) => (
                        <div key={index} className="array-item">
                            <div className="select-wrapper">
                                <select
                                    value={agreement.type}
                                    onChange={e => setKeyAgreementsInput(prev => {
                                        const newArr = [...prev];
                                        newArr[index].type = e.target.value as KeyAgreementType;
                                        return newArr;
                                    })}
                                    required
                                >
                                    <option value="">加密算法</option>
                                    {Object.values(KeyAgreementType).map(type => (
                                        <option key={type} value={type}>
                                            {type.split(/(?=[A-Z])/).join(' ')}
                                        </option>
                                    ))}
                                </select>
                                <div className="select-arrow">▼</div>
                            </div>

                            <input
                                type="text"
                                placeholder="控制器"
                                value={agreement.controller}
                                onChange={e => setKeyAgreementsInput(prev => {
                                    const newArr = [...prev];
                                    newArr[index].controller = e.target.value;
                                    return newArr;
                                })}
                            />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeArrayItem('key', index)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="add-btn"
                        onClick={() => addArrayItem('key')}
                    >
                        添加密钥协议
                    </button>
                </div>

                <div className="form-section">
                    <h2>标识符配置</h2>
                    <div className="input-group">
                        <label>身份认证算法ID</label>
                        <select
                            value={formData.authenticationID}
                            onChange={(e) => handleInputChange('authenticationID', e.target.value)}
                            required
                        >
                            <option value="">请选择身份认证算法ID</option>
                            {verificationMethodsInput.map((method, index) => (
                                <option key={index} value={index}>
                                    第{index + 1}个验证算法
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>权限委托ID:</label>
                        <select
                            value={formData.capabilityDelegationID}
                            onChange={(e) => handleInputChange('capabilityDelegationID', e.target.value)}
                            required
                        >
                            <option value="">请选择权限委托ID</option>
                            {verificationMethodsInput.map((method, index) => (
                                <option key={index} value={index}>
                                    第{index + 1}个验证算法
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>权限调用ID:</label>
                        <select
                            value={formData.capabilityInvocationID}
                            onChange={(e) => handleInputChange('capabilityInvocationID', e.target.value)}
                            required
                        >
                            <option value="">请选择权限调用ID</option>
                            {verificationMethodsInput.map((method, index) => (
                                <option key={index} value={index}>
                                    第{index + 1}个验证算法
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* 提交按钮 */}
                <button type="submit" className="submit-btn" disabled={isSubmitting}>

                    {isSubmitting ? '注册中' : '注册账号'}
                </button>
                <div className="login-link">
                    已有账号？<Link to="/">立即登录</Link>
                </div>
            </form >
        </div >
    );
}


