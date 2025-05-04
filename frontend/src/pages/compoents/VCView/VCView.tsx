import './VCView.css';
import { showVCID, getVC, setVP } from '../../../services/vcManagerService'
import { useEffect, useState } from 'react';

interface VCViewData {
    senderAddress: string;
    subjectAddress: string;
}


import { ViewedStatus } from '../../../type/type';

export default function VCView({ senderAddress, subjectAddress }: VCViewData) {

    console.log("VCVIew senderAddress:", senderAddress);
    console.log("VCVIew subjectAddress:", subjectAddress);

    const [VCHashs, setVCHashs] = useState<string[]>([]);
    const [selectedVCHash, setSelectedVCHash] = useState<string | null>(null);
    const [jsonData, setJsonData] = useState<any>();
    const [viewedStatus, setViewedStatus] = useState<ViewedStatus>({});
    const [selectedVCForCheckbox, setSelectedVCForCheckbox] = useState<string>('');

    const handleCheckboxChange = (fieldPath: string, isChecked: boolean) => {
        setViewedStatus(prev => ({
            ...prev,
            [fieldPath]: isChecked
        }));
    };
    const closeSetViewedModal = () => {
        setSelectedVCForCheckbox('');
        setViewedStatus({});
    };

    const saveViewedStatus = async () => {

        const completeStatus = {
            ...Object.keys(viewedStatus).reduce((acc, key) => ({
                ...acc,
                [key]: viewedStatus[key] || false // 显式设置默认值
            }), {}),
        };
        // 这里可以添加实际保存逻辑
        console.log('Saved viewed status:', completeStatus);
        await setVP(subjectAddress, selectedVCForCheckbox, completeStatus);

        alert('查看状态已保存');
        closeSetViewedModal();
    };

    const handleSetViewedClick = async (vcHash: string) => {
        try {
            setSelectedVCForCheckbox(vcHash);
            const VCDoc = await getVC(senderAddress, vcHash);
            if (VCDoc.VCContext == null) {
                alert("数据读取失败，请重试");
                return;
            }
            const vcData = VCDoc.VCContext;
            const initialStatus: ViewedStatus = {};

            const traverseObject = (obj: any, path: string = '') => {
                Object.entries(obj).forEach(([key, value]) => {
                    const currentPath = path ? `${path}.${key}` : key;

                    // 排除不需要的字段
                    if (key === 'proof' || key === '@context') return;

                    if (typeof value === 'object' && value !== null) {
                        traverseObject(value, currentPath);
                    } else {
                        initialStatus[currentPath] = false;
                    }
                });
            };

            traverseObject({
                id: vcData.id,
                type: vcData.type,
                issuer: vcData.issuer,
                credentialSubject: vcData.credentialSubject
            });

            setJsonData(vcData);
            setViewedStatus(initialStatus); // 初始化所有字段状态
        } catch (error) {
            console.error('Get VC failed:', error);
            alert('获取凭证失败');
        }
    };

    const handleButtonClick = async (vcHash: string) => {
        // alert(`You clicked the button for: ${did}`);
        try {
            setSelectedVCHash(vcHash);

            const VCDoc = await getVC(senderAddress, vcHash);
            if (VCDoc.VCContext == null) {
                alert("数据读取失败，请重试");
                return;
            }

            console.log("VCDOC:", VCDoc);
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

    useEffect(() => {
        // 请求数据
        showVCHashs();
    }, []);

    const showVCHashs = async () => {
        try {

            // console.log("VCVIew senderAddress_________:", senderAddress);
            // console.log("VCVIew userAddress_________:", subjectAddress);
            const vcHashs = await showVCID(senderAddress, subjectAddress);
            setVCHashs(vcHashs.vcHashList);
            console.log("vcHashs:", vcHashs.vcHashList);

        } catch (error) {
            console.error('Get User DIDs failed:', error);
            alert('Get User DIDs failed,Please try again.');
        }
    };


    return (
        <div className="did-container">
            <h2 className="section-title">可验证凭证列表</h2>

            <div className="vc-grid">
                {VCHashs.map((vchash, index) => (
                    <div key={index} className="vc-card">
                        <div className="vc-card-content">
                            <span className="vc-hash">{vchash}</span>
                            <button
                                onClick={() => handleButtonClick(vchash)}
                                className="view-button"
                            >
                                <span className="button-icon">👁️</span>
                                查看详情
                            </button>
                            <button
                                onClick={() => handleSetViewedClick(vchash)}
                                className="view-button secondary"
                            >
                                <span className="button-icon">✅</span>
                                设置需要隐藏的数据
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedVCHash && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="title-icon">📄</span>
                                凭证详细信息
                                <span className="vc-id-badge">ID: {jsonData?.id.substring(0, 8)}...</span>
                            </h3>
                            <button className="close-button" onClick={closeModal}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-body-wrapper">
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
                        </div>


                        <div className="modal-footer">
                            <button className="gradient-button" onClick={closeModal}>
                                关闭窗口
                            </button>
                        </div>
                    </div>
                </div >
            )}

            {selectedVCForCheckbox != '' && (
                <div className="modal-overlay" onClick={closeSetViewedModal}>
                    <div className="modern-modal large-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="title-icon">📋</span>
                                设置查看状态
                                <span className="vc-id-badge">ID: {jsonData?.id.substring(0, 8)}...</span>
                            </h3>
                            <button className="close-button" onClick={closeSetViewedModal}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-scroll-container">
                            <div className="modal-body">
                                {jsonData ? (
                                    <div className="info-container compact-view">
                                        {/* 凭证ID */}
                                        <div className="info-row">
                                            <span className="info-label">凭证ID</span>
                                            <span className="info-value code">{jsonData.id}</span>
                                            <input
                                                type="checkbox"
                                                checked={viewedStatus['id'] || false}
                                                onChange={(e) => handleCheckboxChange('id', e.target.checked)}
                                            />
                                        </div>

                                        {/* 凭证类型 */}
                                        <div className="info-row">
                                            <span className="info-label">凭证类型</span>
                                            <div className="type-tags">
                                                {jsonData?.type?.map((t: string, i: number) => (
                                                    <span key={i} className="type-tag">{t}</span>
                                                ))}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={viewedStatus['type'] || false}
                                                onChange={(e) => handleCheckboxChange('type', e.target.checked)}
                                            />
                                        </div>

                                        {/* 颁发者信息 */}
                                        <div className="info-section">
                                            <h4 className="section-subtitle">颁发者信息</h4>
                                            <div className="info-row">
                                                <span className="info-label">DID标识符</span>
                                                <span className="info-value highlight">{jsonData.issuer.id}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={viewedStatus['issuer.id'] || false}
                                                    onChange={(e) => handleCheckboxChange('issuer.id', e.target.checked)}
                                                />
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">机构名称</span>
                                                <span className="info-value">{jsonData.issuer.name}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={viewedStatus['issuer.name'] || false}
                                                    onChange={(e) => handleCheckboxChange('issuer.name', e.target.checked)}
                                                />
                                            </div>
                                        </div>

                                        {/* 凭证内容 */}
                                        <div className="info-section">
                                            <h4 className="section-subtitle">凭证内容</h4>
                                            {Object.entries(jsonData.credentialSubject).map(([key, value]) => {
                                                if (key === 'id') return null;
                                                return (
                                                    <div className="nested-info" key={key}>
                                                        {Object.entries(value as object).map(([subKey, subValue]) => (
                                                            <div className="info-row nested-field" key={subKey}>
                                                                <span className="info-label sub">{subKey}</span>
                                                                <span className="info-value">{subValue}</span>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={viewedStatus[`credentialSubject.${key}.${subKey}`] || false}
                                                                    onChange={(e) =>
                                                                        handleCheckboxChange(
                                                                            `credentialSubject.${key}.${subKey}`,
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
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
                            <button className="gradient-button" onClick={saveViewedStatus}>
                                保存状态
                            </button>
                            <button className="gradient-button" onClick={closeSetViewedModal}>
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
