import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';

function App() {
  return (
  <Routes>
    <Route path='/' element={<Navigate to='/login' replace />}/>
    <Route path='/login' element={<Login/>}/>
    <Route path='/forgot-password' element={<ForgotPassword/>}/>
    <Route path='/reset-password' element={<ResetPassword/>}/>
    <Route path='/change-password' element={<ChangePassword/>}/>
  </Routes>
  );
}

export default App;

