
import { useEffect, useState } from 'react';
import './Login.css';

import { loginSystem, isAdminUser, isIssuerUser, getUserDIDDocument, getVerifyPrivateKey } from '../../services/identityService'
import { Link } from 'react-router-dom'; // 新增导入
import { useNavigate } from 'react-router-dom';
import crypto from 'crypto';
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';



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


const senderAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
// const userAddress = '0x63D064cBc6e52951de537352278F2bD556A1235C';

export default function LoginForm() {

    const navigate = useNavigate();

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

    const checkAdmin = async (address: string) => {
        console.log("startShowUsers:")
        try {
            const isAdmin = await isAdminUser(address);
            console.log("isAdmin:", isAdmin);
            return isAdmin;
        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('Get User DIDs failed,Please try again.');
        }
    }

    const checkIssuer = async (address: string) => {
        console.log("startShowUsers:")
        try {
            const isIssuer = await isIssuerUser(address);
            console.log("isIssuer:", isIssuer);
            return isIssuer;

        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('Get User DIDs failed,Please try again.');
        }
    }

    const [formData, setFormData] = useState({
        id: '',
        userAddress: ''
    });
    const userAddress = formData.userAddress;

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const generateNonce = () => {
        const buffer = new Uint8Array(16);
        window.crypto.getRandomValues(buffer);
        return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const userDocData = await getUserDIDDocument(formData.userAddress, formData.id);
            console.log("userDocData:", userDocData);
            const userVerMethods = userDocData.doc.verificationMethod;
            const userAutMethod = userDocData.doc.authentication;
            console.log("userVerMethods:", userVerMethods);
            console.log("userAutMethod:", userAutMethod);

            const vcIssuerPPKey = await getVerifyPrivateKey(formData.userAddress, formData.id);
            console.log("vcIssuerPPKey:", vcIssuerPPKey);

            let userVeriPrivate;
            let userVeriPublic;
            for (let i = 0; i < userVerMethods.length; i++) {
                if (userAutMethod == userVerMethods[i].id) {
                    userVeriPrivate = vcIssuerPPKey.doc.verifyPrivateKey[i];
                    userVeriPublic = userVerMethods[i].publicKey;
                    break;
                }
            }
            // console.log("userVeriPrivate", userVeriPrivate);


            // const nonce = crypto.randomBytes(16).toString('hex'); // 随机数

            const nonce = generateNonce();
            const timestamp = new Date().toISOString();           // 时间戳

            const rawData = `${nonce}:${timestamp}`;

            // const msgHash = crypto.createHash('sha256').update(rawData).digest('hex');

            const hashBytes = sha256(rawData);
            const msgHash = bytesToHex(hashBytes);

            const keyPair = ec.keyFromPrivate(userVeriPrivate, 'hex');

            const signature = keyPair.sign(msgHash, { canonical: true });
            const derSignatureHex = signature.toDER('hex');

            // 登录过程
            // 用户有一个进行身份认证的验证方法
            // 从链上找到对应的私钥，生成签名
            // 传入到后面进行验证

            // 需要传入，签名、msgHash和公钥

            const LoginRes = await loginSystem(formData.userAddress, formData.id, derSignatureHex, msgHash, userVeriPublic)

            console.log("LoginRes", LoginRes);
            if (LoginRes.isValid) {
                const infoMessage = "登录成功，即将跳转";

                console.log('Registration Data:', formData);
                alert(infoMessage);
                console.log("userAddress:", formData.userAddress);
                const isAdmin = await checkAdmin(formData.userAddress);
                const isIssuer = await checkIssuer(formData.userAddress);
                console.log("isAdmin:", isAdmin);
                console.log("isIssuer:", isIssuer);

                if (isAdmin.isAdmin) {
                    console.log("1");
                    navigate('/AdminHome', { state: { senderAddress: senderAddress } });
                } else if (isIssuer.isIssuer) {
                    console.log("2");
                    navigate('/IssuerHome', { state: { "senderAddress": senderAddress, "userAddress": userAddress } });
                } else {
                    console.log("3");
                    navigate('/UserHome', { state: { "senderAddress": senderAddress, "userAddress": userAddress } });
                }
            } else {
                const infoMessage = "登录失败";
                alert(infoMessage);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            alert('登录失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="Login-container">
            <form onSubmit={handleSubmit} className="Login-form">
                <h2>登录账户</h2>

                <div className="form-group">
                    <label htmlFor="userAddress">请输入DID的唯一标识符</label>
                    <input
                        type="text"
                        id="id"
                        name="id"
                        value={formData.id}
                        onChange={handleInputChange}
                        placeholder="did:eth:0x..."
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="userAddress">请输入用户地址</label>
                    {/* <input
                        type="text"
                        id="userAddress"
                        name="userAddress"
                        value={formData.userAddress}
                        onChange={handleInputChange}
                        placeholder="0x..."
                    /> */}

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

                <button
                    type="submit"
                    className="submit-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '登录中...' : '立即登录'}
                </button>

                <div className="register-link">
                    还没有账户？<Link to="/Register">立即注册</Link>
                </div>
            </form>
        </div>
    );
}