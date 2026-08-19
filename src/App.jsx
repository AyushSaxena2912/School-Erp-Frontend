import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ChangePassword from "./pages/auth/ChangePassword";
import FrontOfficeApp from "./front-office/FrontOfficeApp";
import ParentAdmissionPage from "./pages/ParentAdmissionPage";
import TeacherRecruitmentPage from "./pages/TeacherRecruitmentPage";
import { FrontOfficeProvider } from "./front-office/context/FrontOfficeContext";
import { TeachersProvider } from "./front-office/teachers/context/TeachersContext";

function App() {
  return (
    <FrontOfficeProvider>
      <TeachersProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/home" element={<Navigate to="/front-office" replace />} />
          <Route path="/admission/:token" element={<ParentAdmissionPage />} />
          <Route path="/teacher-recruitment/:token" element={<TeacherRecruitmentPage />} />
          <Route path="/front-office/*" element={<FrontOfficeApp />} />
        </Routes>
      </TeachersProvider>
    </FrontOfficeProvider>
  );
}

export default App;
