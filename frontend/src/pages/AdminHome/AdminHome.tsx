import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './AdminHome.css'

import UserManage from '../compoents/UserManage/UserManage';
import Log from '../compoents/Log/Log';

export default function AdminHome() {

    const location = useLocation();
    const didAddress = location.state || {}; // 默认值为空对象

    const [currentView, setCurrentView] = useState('profile');

    return (
        <div className="dashboard-container">
            <nav className="sidebar">
                <button
                    className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`}
                    onClick={() => setCurrentView('profile')}
                >
                    账户管理
                </button>
                <button
                    className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
                    onClick={() => setCurrentView('settings')}
                >
                    查看日志
                </button>
            </nav>

            <main className="content-area">
                {currentView === 'profile' && <UserManage senderAddress={didAddress.senderAddress} />}
                {currentView === 'settings' && <Log senderAddress={didAddress.senderAddress} />}

            </main>
        </div>
    );
}
