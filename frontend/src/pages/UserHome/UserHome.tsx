import { useState } from 'react';
// import { Outlet } from 'react-router-dom';
import './UserHome.css'
import { useLocation } from 'react-router-dom';
import DIDView from '../compoents/DIDView/DIDView'
import VCView from '../compoents/VCView/VCView';
import VCApply from '../compoents/VCApply/VCApply';

export default function UserHome() {

    const location = useLocation();
    const didAddress = location.state || {}; // 默认值为空对象
    console.log("UserHome::::DIDSenderAddress::", didAddress.senderAddress);
    console.log("UserHome::::DIDUserAddress::", didAddress.userAddress);

    const [currentView, setCurrentView] = useState('profile');

    return (
        <div className="dashboard-container">
            <nav className="sidebar">
                <button
                    className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`}
                    onClick={() => setCurrentView('profile')}
                >
                    个人资料
                </button>
                <button
                    className={`nav-btn ${currentView === 'vcManage' ? 'active' : ''}`}
                    onClick={() => setCurrentView('vcManage')}
                >
                    VC管理
                </button>
                <button
                    className={`nav-btn ${currentView === 'vcApply' ? 'active' : ''}`}
                    onClick={() => setCurrentView('vcApply')}
                >
                    VC申请
                </button>
            </nav>

            <main className="content-area">
                {currentView === 'profile' && <DIDView senderAddress={didAddress.senderAddress} userAddress={didAddress.userAddress} />}
                {currentView === 'vcManage' && <VCView senderAddress={didAddress.senderAddress} subjectAddress={didAddress.userAddress} />}
                {currentView === 'vcApply' && <VCApply senderAddress={didAddress.senderAddress} subjectAddress={didAddress.userAddress} />}

            </main>
        </div>
    );
}
