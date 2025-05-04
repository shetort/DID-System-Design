import { getIssuerPlatAllUserDIDDoc, getUserDIDDocument, getUserDIDs, loginSystem, registerIssuerPlatDID, showAllUsers, showAllUsersIden } from '../../../services/identityService'
import { useEffect, useState } from 'react';
import './IssuerUserManage.css'
import { RegisterIssuerPlatParams, VerificationMethod } from '../../../type/type'

interface UserManageData {
    senderAddress: string;
    issuerAddress: string;
}

interface UserListProps {
    users: string[];
    showActions?: boolean;
}

type registerMethod = {
    type: string;
    id: string;
    controller: string;
    publicKey: string;
}

const registerMethodInit: registerMethod = {
    type: '',
    id: '',
    controller: '',
    publicKey: '',

}

const verifyMethodInit: VerificationMethod = {
    id: '',
    type: '',
    controller: '',
    publicKey: ''
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


export default function IssuerUserManage({ senderAddress, issuerAddress }: UserManageData) {
    const [isConnecting, setIsConnecting] = useState(false);


    const [commonUserInPlat, setCommonUserInPlat] = useState<string[]>([]);
    const [vipUSerInPlat, setVIPUserInPlat] = useState<string[]>([]);


    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerAddress, setRegisterAddress] = useState("");
    const [registerDIDid, setRegisterDIDid] = useState("");

    const [registerVerfyMethod, setRegisterVerfyMethod] = useState<VerificationMethod>(verifyMethodInit);


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
                setRegisterAddress(accounts[0]);
            }
        } catch (error) {
            console.error('钱包连接失败:', error);
            alert('必须授权钱包访问才能继续操作');
        } finally {
            setIsConnecting(false);
        }
    };
    const refreshData = async () => {
        try {

            const coUserInPlat = await getIssuerPlatAllUserDIDDoc(issuerAddress);
            console.log("SHOW ALL PLATUSER:", coUserInPlat.result);
            setCommonUserInPlat(coUserInPlat.result);

        } catch (error) {
            console.error('数据刷新失败:', error);
            alert('数据加载失败，请稍后重试');
        }
    };

    const handleRegister = async () => {
        try {
            if (!registerAddress) {
                alert("请输入有效地址");
                return;
            }

            let registerMethodTemp: VerificationMethod = registerMethodInit;
            // 在调用前检查变量是否已存在
            const userDIDDocS = await getUserDIDDocument(registerAddress, registerDIDid);
            console.log("userDIDDocS:", userDIDDocS);

            if (userDIDDocS.doc.authentication == "") {
                alert("您的DID文档缺少注册的必要字段");
                return;
            }
            for (let i = 0; i < userDIDDocS.doc.verificationMethod.length; i++) {
                console.log("inFOR:", i);

                if (userDIDDocS.doc.verificationMethod[i].id == userDIDDocS.doc.authentication) {
                    console.log("IFINININI:", i);
                    registerMethodTemp.id = userDIDDocS.doc.verificationMethod[i].id;
                    registerMethodTemp.controller = userDIDDocS.doc.verificationMethod[i].controller;
                    registerMethodTemp.type = userDIDDocS.doc.verificationMethod[i].type;
                    registerMethodTemp.publicKey = userDIDDocS.doc.verificationMethod[i].publicKey;
                }
            }

            const newDIDid = `did:${issuerAddress}:${registerAddress}`;
            const issuerDIDs = await getUserDIDs(issuerAddress, issuerAddress);
            const issuerDID = issuerDIDs.dids[0];
            const issuerDIDDoc = await getUserDIDDocument(issuerAddress, issuerDID);
            console.log("issuerDIDDoc:", issuerDIDDoc);

            setRegisterVerfyMethod({
                id: registerMethodTemp.id,
                type: registerMethodTemp.type,
                controller: registerMethodTemp.controller,
                publicKey: registerMethodTemp.publicKey
            })

            const fullData: RegisterIssuerPlatParams = {
                senderAddress: issuerAddress,
                userAddress: registerAddress,
                issuerAddress: issuerAddress,
                newDIDid: newDIDid,
                parentDIDid: userDIDDocS.doc.id,
                verfyMethod: {
                    id: registerMethodTemp.id,
                    type: registerMethodTemp.type,
                    controller: registerMethodTemp.controller,
                    publicKey: registerMethodTemp.publicKey
                },
                controller: userDIDDocS.doc.id,
                issuerDIDid: issuerDID
            }

            console.log("FULLDATA:", fullData);

            await registerIssuerPlatDID(fullData);

            await refreshData();
            alert("注册成功！");
            setShowRegisterModal(false);
            setRegisterAddress("");


        } catch (error) {
            console.error('注册失败:', error);
            alert('注册失败，请检查地址格式');
        }
    };

    useEffect(() => {
        refreshData();

        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                setRegisterAddress(accounts[0]);
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
                    className="register-button"
                    onClick={() => setShowRegisterModal(true)}
                >
                    注册
                </button>
            </div>

            {showRegisterModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>🔗 用户注册</h3>
                            <button
                                className="close-button"
                                onClick={() => setShowRegisterModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <span className="label-icon">🆔</span>
                                区块链地址
                            </label>
                            <div className="wallet-input-wrapper">
                                <input
                                    type="text"
                                    value={registerAddress}
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
                                            {registerAddress ? '已连接' : '连接钱包'}
                                        </>
                                    )}
                                </button>
                            </div>
                            {!window.ethereum && (
                                <div className="warning-message">
                                    ⚠️ 请安装MetaMask浏览器扩展
                                </div>
                            )}
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <span className="label-icon">🔑</span>
                                DID标识符
                            </label>
                            <input
                                type="text"
                                value={registerDIDid}
                                onChange={(e) => setRegisterDIDid(e.target.value)}
                                placeholder="例如：did:eth:0x90f79bf6eb2c4f8"
                                className="did-input"
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-button" onClick={() => setShowRegisterModal(false)}>
                                取消
                            </button>
                            <button className="register-submit-button" onClick={handleRegister}>
                                <span className="button-icon">🚀</span>
                                立即注册
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="section-title">用户身份管理</h2>
            <div className="user-category common-users">
                <h3 className="category-title">
                    <span className="icon">👤</span>
                    平台用户 ({commonUserInPlat.length}人)
                </h3>
                <UserList
                    users={commonUserInPlat}
                    showActions={false}
                />
            </div>
        </div >
    );
}

// const UserList: React.FC<UserListProps> = ({
//     users,
//     showActions = false
// }) => {
//     return (
//         <div className="user-grid">
//             {users.map((user, index) => (
//                 <div key={user} className="user-card">
//                     <div className="user-content-wrapper">
//                         <div className="user-info">
//                             <span className="user-address">{user}</span>
//                             <span className="user-index">#{index + 1}</span>
//                         </div>
//                     </div>
//                 </div>
//             ))}
//             {users.length === 0 && (
//                 <div className="empty-state">暂无相关用户</div>
//             )}
//         </div>
//     );
// };

const UserList: React.FC<UserListProps> = ({ users, showActions = false }) => {
    return (
        <div className="user-grid">
            {users.map((user, index) => (
                <div key={user} className="user-card">
                    <div className="user-content-wrapper">
                        <div className="user-info">
                            <span className="user-address">{user}</span>
                            <span className="user-index">#{index + 1}</span>
                        </div>
                    </div>
                </div>
            ))}
            {users.length === 0 && (
                <div className="empty-state">🎉 当前没有注册用户</div>
            )}
        </div>
    );
};