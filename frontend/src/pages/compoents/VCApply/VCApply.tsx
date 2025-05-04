import { getUserDIDs, showAllUsers, showAllUsersIden } from '../../../services/identityService';
import { getApplication, getApplicationIds, submitApplication } from '../../../services/vcManagerService';
import './VCApply.css';
import { useEffect, useState } from 'react';
import { FormData } from '../../../type/type'



interface VCApplyData {
    senderAddress: string;
    subjectAddress: string;
}

export type ApplyData = {
    key: string;
    value?: string;
    children?: ApplyData[];
    parentId?: string; // 用于追踪父节点
    id: string;        // 唯一标识
};




interface UserListProps {
    users: string[];
    onAction?: (userAddress: string) => void;
    actionText?: string;
    actionStyle?: 'primary' | 'danger';
    showActions?: boolean;
}

// interface FormData {
//     vcType: string;
//     data: Record<string, any>;
// }

interface FormField {
    key: string;
    value: string;
    isNested: boolean;
    nestedFields?: FormField[];
}

interface VCApplication {
    id: string;
    vcType: string;
    issuer: string;
    status: string;
    timestamp: string;
    data: Record<string, any>;
}

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


const VCApplicationInit = {
    id: "string",
    vcType: "string",
    issuer: "string",
    status: "string",
    timestamp: "string",
    data: {
        issuer: "string",
        status: "string"
    },
}

export default function VCApply({ senderAddress, subjectAddress }: VCApplyData) {

    console.log("VCVIew senderAddress:", senderAddress);
    console.log("VCVIew subjectAddress:", subjectAddress);

    useEffect(() => {
        refreshData()
    }, []);

    const [issuerUser, setIssuerUser] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedIssuer, setSelectedIssuer] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    // const [selectedIssuer, setSelectedIssuer] = useState("");
    const [formData, setFormData] = useState<FormData>({
        vcType: "",
        data: {}
    });
    const [fields, setFields] = useState<FormField[]>([]);

    const [applications, setApplications] = useState<VCApplication[]>([]);
    const [selectedApplication, setSelectedApplication] = useState<VCApplication | null>(null);
    const [showApplications, setShowApplications] = useState(false);
    const [vcApplyShowDatas, setVCApplyShowDatas] = useState<VCApplyShowData[]>([]);
    const [loading, setLoading] = useState(false);

    const loadApplications = async () => {
        try {
            setLoading(true);
            setVCApplyShowDatas([]);

            const VCApplyDataIDTemp = await getApplicationIds(subjectAddress, subjectAddress);
            // console.log("VCAPPLY_DATA:", VCApplyDataIDTemp.appIDLists);
            const VCApplyDataIDList = VCApplyDataIDTemp.appIDLists;


            const tempData: VCApplyShowData[] = [];
            for (let i = 0; i < VCApplyDataIDList.length; i++) {
                const VCApplyDataDoc = await getApplication(subjectAddress, VCApplyDataIDList[i]);
                const userDIDs = await getUserDIDs(senderAddress, VCApplyDataDoc.appList.issuerAddress);

                tempData.push({
                    issuerID: userDIDs.dids[0],
                    vcType: VCApplyDataDoc.appList.vcType,
                    data: VCApplyDataDoc.appList.data,
                    timestamp: '2025.08.12' // 建议使用实际时间戳
                });

            }
            setVCApplyShowDatas(tempData);

            console.log("vcApplyShowDatas:", vcApplyShowDatas);
            console.log("vcApplyShowDatasLength:", vcApplyShowDatas.length);

        } catch (error) {
            console.error('获取申请记录失败:', error);
            alert('无法加载申请记录');
        } finally {
            setLoading(false);
        }
    };

    const handleShowVCApply = async () => {
        setShowApplications(!showApplications);
        loadApplications();
    }

    useEffect(() => {
        refreshData();
        // loadApplications();
    }, []);

    const refreshData = async () => {
        console.log("startShowUsers:")
        try {

            const allUserIden = await showAllUsersIden(senderAddress);
            const AllUserAddr = allUserIden.UserAddress;
            const AllUserIden = allUserIden.UserIndenti;

            const IssuerUserAddr: string[] = [];

            for (let i = 0; i < AllUserAddr.length; i++) {
                if (AllUserIden[i] == 2) {
                    IssuerUserAddr.push(AllUserAddr[i]);
                }
            }
            setIssuerUser(IssuerUserAddr);

        } catch (error) {
            console.error('数据刷新失败:', error);
            alert('数据加载失败，请稍后重试');
        }
    };


    const handleAddField = (isNested = false) => {
        setFields([...fields, { key: "", value: "", isNested, nestedFields: [] }]);
    };

    const handleFieldChange = (index: number, field: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...field };
        setFields(newFields);
    };

    const handleAddNestedField = (parentIndex: number) => {
        const newFields = [...fields];
        newFields[parentIndex].nestedFields = [
            ...(newFields[parentIndex].nestedFields || []),
            { key: "", value: "", isNested: false }
        ];
        setFields(newFields);
    };

    const buildNestedObject = (fields: FormField[]) => {
        return fields.reduce((obj: Record<string, any>, field) => {
            if (field.isNested && field.nestedFields) {
                obj[field.key] = buildNestedObject(field.nestedFields);
            } else {
                obj[field.key] = field.value;
            }
            return obj;
        }, {});
    };

    const handleSubmit = async () => {
        const data = buildNestedObject(fields);
        const finalData = {
            vcType: formData.vcType,
            data
        };
        console.log("Final form data:", finalData);
        await submitApplication(subjectAddress, selectedIssuer, finalData.vcType, finalData.data);
        setIsModalOpen(false);
    };

    const VCApply = (userAddress: string) => {
        setSelectedIssuer(userAddress);
        setIsModalOpen(true);
    };


    return (
        <div className="did-container">

            <div className="application-history">
                <button
                    className="toggle-history-button"
                    onClick={() => handleShowVCApply()}
                >
                    {showApplications ? '隐藏申请记录' : '查看我的申请记录'}
                </button>

                {showApplications && (
                    <div className="application-list">
                        <h4>已提交的VC申请 ({vcApplyShowDatas.length}个)</h4>
                        {vcApplyShowDatas.map((app, index) => (
                            <div key={index} className="application-item">
                                <div className="application-info">
                                    <span className="vc-type">证书类型：{app.vcType}</span>
                                    <span className="issuer">颁发者DID: {app.issuerID}</span>
                                    <span className="timestamp">申请时间: {app.timestamp}</span>
                                </div>
                                <button
                                    className="detail-button"
                                    onClick={() => setSelectedApplication({
                                        ...VCApplicationInit,
                                        vcType: app.vcType,
                                        issuer: app.issuerID,
                                        timestamp: app.timestamp,
                                        data: app.data
                                    })}
                                >
                                    查看详情
                                </button>
                            </div>
                        ))}

                        {/* 空状态提示 */}
                        {vcApplyShowDatas.length === 0 && (
                            <div className="empty-state">暂无申请记录</div>
                        )}
                    </div>
                )}
            </div>

            <div className="user-category issuer-users">
                <h3 className="category-title">
                    <span className="icon">✅</span>
                    可信颁发者 ({issuerUser.length}人)
                </h3>
                <UserList
                    users={issuerUser}
                    onAction={VCApply}
                    actionText="申请VC"
                    actionStyle="danger"
                />
                {/* 添加模态框 */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>向 {selectedIssuer} 申请VC</h3>

                            <div className="form-group">
                                <label>VC类型:</label>
                                <input
                                    type="text"
                                    value={formData.vcType}
                                    onChange={(e) => setFormData({ ...formData, vcType: e.target.value })}
                                />
                            </div>

                            <div className="modal-scroll-container">
                                <div className="fields-container">
                                    {fields.map((field, index) => (
                                        <div key={index} className="field-group">
                                            <input
                                                placeholder="字段名"
                                                value={field.key}
                                                onChange={(e) => handleFieldChange(index, { key: e.target.value })}
                                            />
                                            {!field.isNested ? (
                                                <input
                                                    placeholder="相应值"
                                                    value={field.value}
                                                    onChange={(e) => handleFieldChange(index, { value: e.target.value })}
                                                />
                                            ) : (
                                                <div className="nested-fields">
                                                    {field.nestedFields?.map((nestedField, nestedIndex) => (
                                                        <div key={nestedIndex} className="nested-field">
                                                            <input
                                                                placeholder="嵌套键"
                                                                value={nestedField.key}
                                                                onChange={(e) => {
                                                                    const newFields = [...fields];
                                                                    newFields[index].nestedFields![nestedIndex].key = e.target.value;
                                                                    setFields(newFields);
                                                                }}
                                                            />
                                                            <input
                                                                placeholder="嵌套值"
                                                                value={nestedField.value}
                                                                onChange={(e) => {
                                                                    const newFields = [...fields];
                                                                    newFields[index].nestedFields![nestedIndex].value = e.target.value;
                                                                    setFields(newFields);
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                    <button onClick={() => handleAddNestedField(index)}>
                                                        添加嵌套字段
                                                    </button>
                                                </div>
                                            )}
                                            <div className="field-actions">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={field.isNested}
                                                        onChange={(e) => handleFieldChange(index, { isNested: e.target.checked })}
                                                    />
                                                    嵌套字段
                                                </label>
                                                <button onClick={() => setFields(fields.filter((_, i) => i !== index))}>
                                                    删除
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button onClick={() => handleAddField(false)}>添加普通字段</button>
                                <button onClick={() => handleAddField(true)}>添加嵌套字段</button>
                                <button onClick={handleSubmit}>提交申请</button>
                                <button onClick={() => setIsModalOpen(false)}>取消</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedApplication && (
                <div className="modal-overlay">
                    <div className="modern-modal">
                        <div className="modal-header">
                            <h3>申请详情</h3>
                            <button
                                className="icon-close"
                                onClick={() => setSelectedApplication(null)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-scroll-container">

                            <div className="modal-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>VC类型</label>
                                        <div className="info-value accent-text">{selectedApplication.vcType}</div>
                                    </div>
                                    <div className="info-item">
                                        <label>颁发者DID</label>
                                        <div className="info-value did-code">{selectedApplication.issuer}</div>
                                    </div>
                                    <div className="info-item">
                                        <label>提交时间</label>
                                        <div className="info-value">{selectedApplication.timestamp}</div>
                                    </div>
                                </div>

                                <div className="data-card">
                                    <h4 className="data-title">申请数据明细</h4>
                                    <div className="data-container">
                                        <DataRenderer data={selectedApplication.data} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

const UserList: React.FC<UserListProps> = ({
    users,
    onAction,
    actionText,
    actionStyle = 'primary',
    showActions = true
}) => {
    return (
        <div className="user-grid">
            {users.map((user, index) => (
                <div key={user} className="user-card">
                    <div className="user-content-wrapper">
                        <div className="user-info">
                            <span className="user-address">{user}</span>
                            <span className="user-index">#{index + 1}</span>
                        </div>
                        {showActions && onAction && (
                            <button
                                className={`action-button ${actionStyle}`}
                                onClick={() => onAction(user)}
                            >
                                {actionText}
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {users.length === 0 && (
                <div className="empty-state">暂无相关用户</div>
            )}
        </div>
    );
};
const DataRenderer: React.FC<{ data: unknown; depth?: number }> = ({ data, depth = 0 }) => {
    // 处理空值情况
    if (data === null || data === undefined) {
        return <span className="data-value">null</span>;
    }

    // 处理数组类型
    if (Array.isArray(data)) {
        return (
            <div className="array-group">
                {data.map((item, index) => (
                    <div key={index} className="array-item">
                        <span className="array-index">[{index}]</span>
                        <DataRenderer data={item} depth={depth} />
                    </div>
                ))}
            </div>
        );
    }

    // 处理对象类型
    if (typeof data === 'object') {
        return (
            <div className="data-group" style={{ marginLeft: `${depth * 16}px` }}>
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="data-item">
                        <span className="data-key">{key}:</span>
                        <DataRenderer data={value} depth={depth + 1} />
                    </div>
                ))}
            </div>
        );
    }

    // 处理基本类型
    return (
        <span className="data-value">
            {typeof data === 'string' ? data : JSON.stringify(data)}
        </span>
    );
};