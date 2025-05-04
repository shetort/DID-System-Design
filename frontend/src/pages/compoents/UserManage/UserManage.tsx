
import { showAllUsers, addIssuer, showAllUsersIden, removeIssuer } from '../../../services/identityService'
import { useEffect, useState } from 'react';
import './UserManage.css'

interface UserManageData {
    senderAddress: string;
}

interface UserListProps {
    users: string[];
    onAction?: (userAddress: string) => void;
    actionText?: string;
    actionStyle?: 'primary' | 'danger';
    showActions?: boolean;
}

export default function UserManage({ senderAddress }: UserManageData) {

    console.log("VCVIew senderAddress:", senderAddress);

    const [commonUser, setCommonUser] = useState<string[]>([]);
    const [issuerUser, setIssuerUser] = useState<string[]>([]);
    const [adminUser, setAdminUser] = useState<string[]>([]);

    const refreshData = async () => {
        console.log("startShowUsers:")
        try {
            const allAddress = await showAllUsers(senderAddress);
            console.log("allAddress:", allAddress.allUsersList);

            const allUserIden = await showAllUsersIden(senderAddress);
            console.log("7777777777777777:", allUserIden.UserAddress);
            console.log("7777777777777777:", allUserIden.UserIndenti);

            const AllUserAddr = allUserIden.UserAddress;
            const AllUserIden = allUserIden.UserIndenti;

            const CommonUserAddr: string[] = [];
            const IssuerUserAddr: string[] = [];
            const AdminUserAddr: string[] = [];

            for (let i = 0; i < AllUserAddr.length; i++) {
                if (AllUserIden[i] == 1) {
                    CommonUserAddr.push(AllUserAddr[i]);
                } else if (AllUserIden[i] == 2) {
                    IssuerUserAddr.push(AllUserAddr[i]);
                } else {
                    AdminUserAddr.push(AllUserAddr[i]);
                }
            }

            setCommonUser(CommonUserAddr);
            setIssuerUser(IssuerUserAddr);
            setAdminUser(AdminUserAddr);

        } catch (error) {
            console.error('数据刷新失败:', error);
            alert('数据加载失败，请稍后重试');
        }
    };

    const handleAddIssuer = async (userAddress: string) => {
        try {
            console.log("7879978797:", userAddress);

            const success = await addIssuer(senderAddress, userAddress);
            if (success) {
                await refreshData();
                alert("已设为可信颁发者");
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('设置失败，请检查网络连接');
        }
    };

    const handleRemoveIssuer = async (userAddress: string) => {
        try {
            console.log("456464465456:", userAddress);
            const success = await removeIssuer(senderAddress, userAddress);
            if (success) {
                await refreshData();
                alert("已移除可信颁发者");
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('设置失败，请检查网络连接');
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <div className="user-management-container">
            <h2 className="section-title">用户身份管理</h2>

            {/* 管理员用户 */}
            <div className="user-category admin-users">
                <h3 className="category-title">
                    <span className="icon">👑</span>
                    管理员用户 ({adminUser.length}人)
                </h3>
                <UserList
                    users={adminUser}
                    showActions={false}
                />
            </div>

            {/* 可信颁发者 */}
            <div className="user-category issuer-users">
                <h3 className="category-title">
                    <span className="icon">✅</span>
                    可信颁发者 ({issuerUser.length}人)
                </h3>
                <UserList
                    users={issuerUser}
                    onAction={handleRemoveIssuer}
                    actionText="移除身份"
                    actionStyle="danger"
                />
            </div>

            {/* 普通用户 */}
            <div className="user-category common-users">
                <h3 className="category-title">
                    <span className="icon">👤</span>
                    普通用户 ({commonUser.length}人)
                </h3>
                <UserList
                    users={commonUser}
                    onAction={handleAddIssuer}
                    actionText="设为颁发者"
                    actionStyle="primary"
                />
            </div>
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
                    {/* 修改为flex横向布局 */}
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
