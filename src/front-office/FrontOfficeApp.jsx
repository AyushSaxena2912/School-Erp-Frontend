import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  AcademicProvider,
  ClassesPage,
  SectionsPage,
  ClassroomsPage,
  ClassAllocationPage,
  SubjectsPage,
  SubjectAllocationPage,
  AcademicCalendarPage,
  ClassRoutinePage,
  CreateRoutinePage,
} from "./academic";
import { NoticesProvider, NoticeBoardPage } from "./announcements";
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
    <AcademicProvider>
      <NoticesProvider>
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
            <Route path="academic/classes" element={<ClassesPage />} />
            <Route path="academic/sections" element={<SectionsPage />} />
            <Route path="academic/classrooms" element={<ClassroomsPage />} />
            <Route
              path="academic/class-allocation"
              element={<ClassAllocationPage />}
            />
            <Route path="academic/subjects" element={<SubjectsPage />} />
            <Route
              path="academic/subject-allocation"
              element={<SubjectAllocationPage />}
            />
            <Route path="academic/calendar" element={<AcademicCalendarPage />} />
            <Route path="academic/class-routine" element={<ClassRoutinePage />} />
            <Route
              path="academic/class-routine/create"
              element={<CreateRoutinePage />}
            />
            <Route
              path="announcements/notice-board"
              element={<NoticeBoardPage />}
            />
            <Route path="coming-soon" element={<ComingSoonPage />} />
            <Route path="*" element={<Navigate to="/front-office" replace />} />
          </Route>
        </Routes>
      </NoticesProvider>
    </AcademicProvider>
  );
}
