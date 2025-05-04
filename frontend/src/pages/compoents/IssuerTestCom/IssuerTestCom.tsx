import { getIssuerPlatAllUserDIDDoc, getUserDIDDocument, getUserDIDs, getUserPlatDIDDocument, loginIssuerPlatform, loginSystem, registerIssuerPlatDID, showAllUsers, showAllUsersIden } from '../../../services/identityService'
import { useEffect, useState } from 'react';
import './IssuerTestCom.css'
import { RegisterIssuerPlatParams, VerificationMethod, PlatInfoShow } from '../../../type/type'
import { getVC, getVPShow, verifyVC } from '../../../services/vcManagerService';
import React from 'react';

interface UserManageData {
    senderAddress: string;
    issuerAddress: string;
}

const VeryMethodInit: VerificationMethod = {
    id: '',
    type: '',
    controller: '',
    publicKey: ''
}

const platInfoShowInit: PlatInfoShow = {
    id: '',
    parentId: '',
    veryMethod: VeryMethodInit,
    controller: '',
    issuer: '',
    createdTime: ''
}

interface VPVisibleStatus {
    [key: string]: boolean;
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

export default function IssuerTestCom({ senderAddress, issuerAddress }: UserManageData) {

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [did, setDid] = useState("");
    const [address, setAddress] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [platShowInfo, setPlatShowInfo] = useState<PlatInfoShow>(platInfoShowInit);
    const [isConnecting, setIsConnecting] = useState(false);

    // 新增状态
    const [showInputModal, setShowInputModal] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [vcId, setVCId] = useState('');
    const [showFullKey, setShowFullKey] = useState(false);
    // const [privateKey, setPrivateKey] = useState('');

    const [selectedVC, setSelectedVC] = useState<any>(null);
    const [vcModalVisible, setVcModalVisible] = useState(false);
    const [vcShow, setVCShow] = useState<any>();

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

            if (accounts && accounts.length > 0) {
                setAddress(accounts[0]);
            }
        } catch (error) {
            console.error('钱包连接失败:', error);
            alert('必须授权钱包访问才能继续操作');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleShowVCDetail = async () => {
        try {
            console.log("VCID:", vcId);
            const vcDoc = await getVC(senderAddress, vcId);
            const vpShow = await getVPShow(senderAddress, vcId);
            setVCShow(vpShow.VPShow);

            console.log("VPSHOW:", vpShow);
            console.log("VCCONTEXT:", vcDoc.VCContext);
            setSelectedVC(vcDoc.VCContext);
            setVcModalVisible(true);
        } catch (error) {
            console.error('获取VC详情失败:', error);
            alert('获取凭证详情失败');
        }
    };



    // const renderVCContent = (vcData: any, vpShow: VPVisibleStatus) => {
    //     // 递归渲染字段的函数
    //     const renderField = (key: string, value: any, path: string = ''): React.ReactNode => {
    //         const currentPath = path ? `${path}.${key}` : key;
    //         const isHidden = vpShow[currentPath] === true;

    //         // 处理嵌套对象
    //         if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    //             const children = Object.entries(value)
    //                 .map(([childKey, childValue]) => renderField(childKey, childValue, currentPath))
    //                 .filter(Boolean);

    //             // 检查所有子字段是否都被隐藏
    //             const allChildrenHidden = children.every(child =>
    //                 React.isValidElement<{ 'data-hidden'?: boolean }>(child) &&
    //                 child.props['data-hidden'] === true
    //             );

    //             if (allChildrenHidden) {
    //                 return (
    //                     <div key={currentPath} className="info-row" data-hidden={true}>
    //                         <span className="info-label">{key}</span>
    //                         <span className="info-value">（已被隐藏）</span>
    //                     </div>
    //                 );
    //             }

    //             return (
    //                 <div key={currentPath} className="nested-info">
    //                     <div className="info-row main-field">
    //                         <span className="info-label">{key}</span>
    //                     </div>
    //                     {children}
    //                 </div>
    //             );
    //         }

    //         // 处理数组类型（如type字段）
    //         if (Array.isArray(value)) {
    //             return (
    //                 <div key={currentPath} className="info-row">
    //                     <span className="info-label">{key}</span>
    //                     <div className="array-values">
    //                         {value.map((item, index) => {
    //                             const itemPath = `${currentPath}.${index}`;
    //                             return (
    //                                 <span key={itemPath} className="array-item">
    //                                     {vpShow[itemPath] ? "（已被隐藏）" : item}
    //                                 </span>
    //                             );
    //                         })}
    //                     </div>
    //                 </div>
    //             );
    //         }

    //         // 处理原始值
    //         return (
    //             <div key={currentPath} className="info-row" data-hidden={isHidden}>
    //                 <span className="info-label">{key}</span>
    //                 <span className="info-value">
    //                     {isHidden ? "（已被隐藏）" : value}
    //                 </span>
    //             </div>
    //         );
    //     };

    //     // 固定显示的字段配置
    //     const fixedFields = {
    //         '@context': vcData['@context'],
    //         proof: vcData.proof,
    //         expirationDate: vcData.expirationDate,
    //         issuanceDate: vcData.issuanceDate
    //     };

    //     return (
    //         <div className="info-container">
    //             {/* 固定显示字段 */}
    //             <div className="info-section">
    //                 <h4 className="section-subtitle">基础信息</h4>
    //                 {Object.entries(fixedFields).map(([key, value]) => (
    //                     <div key={key} className="info-row">
    //                         <span className="info-label">{key}</span>
    //                         <span className="info-value code">
    //                             {key === 'issuanceDate' || key === 'expirationDate'
    //                                 ? new Date(value as string).toLocaleString()
    //                                 : JSON.stringify(value, null, 2)}
    //                         </span>
    //                     </div>
    //                 ))}
    //             </div>

    //             {/* 动态渲染其他字段 */}
    //             {Object.entries(vcData)
    //                 .filter(([key]) => !(key in fixedFields))
    //                 .map(([key, value]) => renderField(key, value))}
    //         </div>
    //     );
    // };


    // 提交处理函数
    const handleInfoSubmit = async () => {

        console.log("VCID:::", vcId);
        const vcIdTest = 'vc:did:eth:0x70997970c51812dc3a010c7d01b50e0d17dc79c8:1746239060394'
        setVCId(vcIdTest);
        const issuerDIDidT = await getUserDIDs(issuerAddress, issuerAddress);
        const issuerDIDid = issuerDIDidT.dids[0]
        console.log("issuerDIDidT:", issuerDIDid)

        const veryResult = await verifyVC(issuerAddress, vcId, issuerDIDid);
        console.log("veryResult:", veryResult);

        if (veryResult.isValid) {
            setInfoVisible(true);
        } else {
            setInfoVisible(false);
        }

        // 这里可以添加实际提交逻辑
        setShowInputModal(false);
        // setVCId(''); // 清空输入
    };



    const handleLogin = async () => {
        try {
            if (!address) {
                alert("请先连接钱包获取地址");
                return;
            }

            // 这里可以添加实际的登录验证逻辑
            console.log("Login attempt with:", { did, address, privateKey });

            const TestDID = 'did:0x70997970c51812dc3a010c7d01b50e0d17dc79c8:0x90f79bf6eb2c4f870365e785982e1f101e93b906'
            const TestAddress = '0x90f79bf6eb2c4f870365e785982e1f101e93b906'
            const loginResult = await loginIssuerPlatform(TestAddress, TestDID, issuerAddress);
            const UserPlatDIDDoc = await getUserPlatDIDDocument(TestAddress, TestDID);

            const userPlatDIDDocTemp = UserPlatDIDDoc.doc;

            console.log("USERPLATDIDDOC:", UserPlatDIDDoc);
            console.log("LOGINRESULT:", loginResult);

            if (loginResult.isValid) {
                alert("登录成功！");
                // 展示用户信息
                setPlatShowInfo({
                    id: userPlatDIDDocTemp.id,
                    parentId: userPlatDIDDocTemp.parentId,
                    veryMethod: userPlatDIDDocTemp.verificationMethod,
                    controller: userPlatDIDDocTemp.controller,
                    issuer: userPlatDIDDocTemp.issuer,
                    createdTime: userPlatDIDDocTemp.createdTime,
                });

            } else {
                alert("登录失败");
            }
        } catch (error) {
            console.error('登录出错:', error);
            alert("登录过程中发生错误");
        } finally {
            setShowLoginModal(false);
        }

        setShowLoginModal(false);
        // 清空输入框
        setDid("");
        setAddress("");
        setPrivateKey("");
    };


    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                setAddress(accounts[0]);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        return () => {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        };
    }, []);

    return (
        <div className="user-management-container">
            <div className="auth-buttons">
                <button
                    className="auth-button login-button"
                    onClick={() => setShowLoginModal(true)}
                >
                    🔑 登录
                </button>
            </div>

            {/* 登录模态框 */}
            {showLoginModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>🔐 平台登录</h3>
                            <button
                                className="close-button"
                                onClick={() => setShowLoginModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <span className="label-icon">🆔</span>
                                DID标识符
                            </label>
                            <input
                                type="text"
                                value={did}
                                onChange={(e) => setDid(e.target.value)}
                                placeholder="did:eth:0x..."
                                className="did-input"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <span className="label-icon">📍</span>
                                区块链地址
                            </label>
                            <div className="wallet-input-wrapper">
                                <input
                                    type="text"
                                    value={address}
                                    readOnly
                                    placeholder="点击右侧按钮连接钱包"
                                    className="wallet-address-input"
                                />
                                <button
                                    className={`connect-button ${isConnecting ? 'loading' : ''}`}
                                    onClick={connectWallet}
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? (
                                        <span className="spinner"></span>
                                    ) : (
                                        <>
                                            <span className="button-icon">🦊</span>
                                            {address ? '已连接' : '连接钱包'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-button" onClick={() => setShowLoginModal(false)}>
                                取消
                            </button>
                            <button className="auth-button confirm-button" onClick={handleLogin}>
                                🚀 立即登录
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 用户信息展示 */}
            {platShowInfo.id && (
                <div className="info-card">
                    <div className="card-header">
                        <h3>📄 用户凭证信息</h3>
                    </div>

                    <div className="info-grid">
                        <div className="info-item">
                            <label>🆔 DID标识符</label>
                            <code>{platShowInfo.id}</code>
                        </div>

                        <div className="info-item">
                            <label>👥 父级DID</label>
                            <code>{platShowInfo.parentId}</code>
                        </div>

                        <div className="info-item full-width">
                            <label>🔒 验证方法</label>
                            <div className="method-grid">
                                <div className="method-item">
                                    <span className="method-label">类型</span>
                                    <span>{platShowInfo.veryMethod.type}</span>
                                </div>
                                <div className="method-item">
                                    <span className="method-label">控制器</span>
                                    <code>{platShowInfo.veryMethod.controller}</code>
                                </div>
                                <div className="method-item">
                                    <span className="method-label">公钥指纹</span>
                                    <div className="public-key-container">
                                        <span
                                            className="public-key"
                                            onClick={() => setShowFullKey(!showFullKey)}
                                        >
                                            {showFullKey ?
                                                platShowInfo.veryMethod.publicKey :
                                                `${platShowInfo.veryMethod.publicKey.slice(0, 16)}...`
                                            }
                                        </span>
                                        <button
                                            className="copy-button"
                                            onClick={() => navigator.clipboard.writeText(platShowInfo.veryMethod.publicKey)}
                                        >
                                            ⎘
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="info-item">
                            <label>⏱️ 创建时间</label>
                            <span>{new Date(platShowInfo.createdTime).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="visibility-control">
                        <button
                            className="toggle-button"
                            onClick={() => setShowInputModal(true)}
                        >
                            切换可见状态
                        </button>
                        <button
                            className="toggle-button"
                            onClick={handleShowVCDetail}
                        >
                            展示可见的VC凭证
                        </button>
                        <div className={`visibility-status ${infoVisible ? 'visible' : 'hidden'}`}>
                            {infoVisible ? '可见' : '隐藏'}
                        </div>
                    </div>
                </div>
            )}

            {/* 验证信息模态框 */}
            {showInputModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>🔍 验证凭证信息</h3>
                            <button
                                className="close-button"
                                onClick={() => setShowInputModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <span className="label-icon">🔑</span>
                                验证密钥
                            </label>
                            <input
                                type="text"
                                value={vcId}
                                onChange={(e) => setVCId(e.target.value)}
                                placeholder="请输入VC标识符"
                                className="vc-input"
                            />
                            <div className="hint-text">
                                示例：vc:did:eth:0x... (完整凭证ID)
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-button" onClick={() => setShowInputModal(false)}>
                                取消
                            </button>
                            <button className="auth-button confirm-button" onClick={handleInfoSubmit}>
                                ✅ 立即验证
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {vcModalVisible && (
                <div className="modal-overlay" onClick={() => setVcModalVisible(false)}>
                    <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="title-icon">📄</span>
                                凭证详细信息
                                {selectedVC?.id && (
                                    <span className="vc-id-badge">ID: {selectedVC.id.substring(0, 8)}...</span>
                                )}
                            </h3>
                            <button
                                className="close-button"
                                onClick={() => setVcModalVisible(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body-wrapper">
                            <div className="modal-body">
                                {selectedVC ? (
                                    <div className="info-container">
                                        {/* 基础信息 */}
                                        <div className="info-section">
                                            <h4 className="section-subtitle">基础信息</h4>
                                            <div className="info-row">
                                                <span className="info-label">凭证ID</span>
                                                <span className="info-value code">{selectedVC.id}</span>
                                            </div>
                                            {/* <div className="info-row">
                                                <span className="info-label">上下文</span>
                                                <div className="type-tags">
                                                    {selectedVC['@context']?.map((ctx: string, i: number) => (
                                                        <span key={i} className="type-tag">{ctx}</span>
                                                    ))}
                                                </div>
                                            </div> */}

                                            <div className="info-row">
                                                <span className="info-label">凭证类型</span>
                                                <div className="type-tags">
                                                    {selectedVC?.type?.map((t: string, i: number) => (
                                                        <span key={i} className="type-tag">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 有效期 */}
                                        <div className="info-section">
                                            <h4 className="section-subtitle">有效期</h4>
                                            <div className="info-row">
                                                <span className="info-label">颁发时间</span>
                                                <span className="info-value">
                                                    {new Date(selectedVC.issuanceDate).toLocaleString()}
                                                </span>
                                            </div>
                                            {selectedVC.expirationDate && (
                                                <div className="info-row">
                                                    <span className="info-label">过期时间</span>
                                                    <span className="info-value">
                                                        {new Date(selectedVC.expirationDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 凭证主体 */}
                                        <div className="info-section">
                                            <h4 className="section-subtitle">凭证内容</h4>
                                            {selectedVC.credentialSubject &&
                                                Object.entries(selectedVC.credentialSubject as Record<string, unknown>)
                                                    .filter(([key]) => key !== 'id')
                                                    .map(([key, value]) => (
                                                        <div className="nested-info" key={key}>
                                                            <div className="info-row main-field">
                                                                <span className="info-label">{key}</span>
                                                            </div>
                                                            {typeof value === 'object' && value !== null ? (
                                                                Object.entries(value).map(([subKey, subValue]) => (
                                                                    <div className="info-row nested-field" key={subKey}>
                                                                        <span className="info-label sub">{subKey}</span>
                                                                        <span className="info-value">
                                                                            {vcShow?.[`credentialSubject.${key}.${subKey}`]
                                                                                ? "（已被隐藏）"
                                                                                : typeof subValue === 'object'
                                                                                    ? JSON.stringify(subValue)
                                                                                    : String(subValue)}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="info-row nested-field">
                                                                    <span className="info-value">
                                                                        {vcShow?.[`credentialSubject.${key}`]
                                                                            ? "（已被隐藏）"
                                                                            : typeof value === 'object'
                                                                                ? JSON.stringify(value)
                                                                                : String(value)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                        </div>

                                        {/* 数字签名 */}
                                        {selectedVC.proof && (
                                            <div className="info-section">
                                                <h4 className="section-subtitle">数字签名</h4>
                                                <div className="info-row">
                                                    <span className="info-label">算法类型</span>
                                                    <span className="info-value tag">{selectedVC.proof.type}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">验证方法</span>
                                                    <span className="info-value code">
                                                        {selectedVC.proof.verificationMethod}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">签名值</span>
                                                    <span className="info-value code">
                                                        {vcShow?.proof ? "（已被隐藏）" : selectedVC.proof.proofValue}
                                                    </span>
                                                </div>
                                                {selectedVC.proof.created && (
                                                    <div className="info-row">
                                                        <span className="info-label">签名时间</span>
                                                        <span className="info-value">
                                                            {new Date(selectedVC.proof.created).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="loading-state">
                                        <div className="loader"></div>
                                        正在加载凭证数据...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="gradient-button"
                                onClick={() => setVcModalVisible(false)}
                            >
                                关闭窗口
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

