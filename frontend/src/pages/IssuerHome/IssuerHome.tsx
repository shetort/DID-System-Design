import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './IssuerHome.css'

import IssuerVC from '../compoents/IssuerVC/IssuerVC';
import IssuerUserManage from '../compoents/IssuerUserManage/IssuerUserManage';
import IssuerTestCom from '../compoents/IssuerTestCom/IssuerTestCom';

export default function IssuerHome() {

    const location = useLocation();
    const didAddress = location.state || {}; // 默认值为空对象

    const [currentView, setCurrentView] = useState('profile');

    return (
        <div className="dashboard-container">
            <nav className="sidebar">
                <button
                    className={`nav-btn ${currentView === 'vcManage' ? 'active' : ''}`}
                    onClick={() => setCurrentView('vcManage')}
                >
                    VC管理
                </button>
                <button
                    className={`nav-btn ${currentView === 'userManage' ? 'active' : ''}`}
                    onClick={() => setCurrentView('userManage')}
                >
                    用户管理
                </button>
                <button
                    className={`nav-btn ${currentView === 'test' ? 'active' : ''}`}
                    onClick={() => setCurrentView('test')}
                >
                    测试部分
                </button>
            </nav>

            <main className="content-area">
                {currentView === 'vcManage' && <IssuerVC senderAddress={didAddress.senderAddress} issuerAddress={didAddress.userAddress} />}
                {currentView === 'userManage' && <IssuerUserManage senderAddress={didAddress.senderAddress} issuerAddress={didAddress.userAddress} />}
                {currentView === 'test' && <IssuerTestCom senderAddress={didAddress.userAddress} issuerAddress={didAddress.userAddress} />}

            </main>
        </div>
    );
}
