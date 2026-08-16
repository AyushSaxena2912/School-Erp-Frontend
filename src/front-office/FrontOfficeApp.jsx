import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import FrontOfficeLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import EnquiriesPage from "./pages/EnquiriesPage";
import EnquiryFormPage from "./pages/EnquiryFormPage";
import VisitorsPage from "./pages/VisitorsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import ComplaintFormPage from "./pages/ComplaintFormPage";
import SettingsPage from "./pages/SettingsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import BranchesPage from "./pages/BranchesPage";
import BranchFormPage from "./pages/BranchFormPage";

export default function FrontOfficeApp() {
  return (
    <Routes>
      <Route element={<FrontOfficeLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="enquiries" element={<EnquiriesPage />} />
        <Route path="enquiries/new" element={<EnquiryFormPage />} />
        <Route path="enquiries/:id/edit" element={<EnquiryFormPage />} />
        <Route path="visitors" element={<VisitorsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="complaints/new" element={<ComplaintFormPage />} />
        <Route path="complaints/:id/edit" element={<ComplaintFormPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="branches" element={<BranchesPage />} />
        <Route path="branches/new" element={<BranchFormPage />} />
        <Route path="branches/:id/edit" element={<BranchFormPage />} />
        <Route path="coming-soon" element={<ComingSoonPage />} />
        <Route path="*" element={<Navigate to="/front-office" replace />} />
      </Route>
    </Routes>
  );
}
