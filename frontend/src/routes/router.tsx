import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from '../pages/Register/Register';
import Login from '../pages/Login/Login'
import UserHome from '../pages/UserHome/UserHome';
import AdminHome from '../pages/AdminHome/AdminHome';
import IssuerHome from '../pages/IssuerHome/IssuerHome';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path='/' element={<Login />} />
                <Route path="/Register" element={<Register />} />
                <Route path='/userHome' element={<UserHome />} />
                <Route path='/AdminHome' element={<AdminHome />} />
                <Route path='/IssuerHome' element={<IssuerHome />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;