import React, { createContext, useContext, useEffect, useState } from "react";
import { initialTeachersData } from "../data/teachers";

const TeachersContext = createContext(null);
const STORAGE_KEY = "bm_teachers_data_v1";

export function TeachersProvider({ children }) {
  const [teachers, setTeachers] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return initialTeachersData;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
    } catch {
      // ignore
    }
  }, [teachers]);

  const addTeacher = (teacher) => {
    const newId = `tch-${Date.now()}`;
    const generatedTid = teacher.teacherId || `T${Math.floor(100000 + Math.random() * 900000)}`;
    const fullName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.name || "Teacher";
    
    const newTeacher = {
      ...teacher,
      id: newId,
      teacherId: generatedTid,
      name: fullName,
      phone: teacher.primaryContact || teacher.phone || "",
      classAssigned: teacher.classTeacher || teacher.classAssigned || "—",
      subject: (teacher.subjects && teacher.subjects[0]) || teacher.subject || "General",
      status: teacher.status || "Active",
    };

    setTeachers((prev) => [newTeacher, ...prev]);
    return newTeacher;
  };

  const updateTeacher = (id, updates) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const firstName = updates.firstName !== undefined ? updates.firstName : t.firstName;
        const lastName = updates.lastName !== undefined ? updates.lastName : t.lastName;
        const fullName = `${firstName || ""} ${lastName || ""}`.trim() || updates.name || t.name;
        
        return {
          ...t,
          ...updates,
          name: fullName,
          phone: updates.primaryContact !== undefined ? updates.primaryContact : (updates.phone || t.phone),
          classAssigned: updates.classTeacher !== undefined ? updates.classTeacher : (updates.classAssigned || t.classAssigned),
          subject: (updates.subjects && updates.subjects[0]) || updates.subject || t.subject,
        };
      })
    );
  };

  const deleteTeacher = (id) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const getTeacherById = (id) => {
    return teachers.find((t) => t.id === id || t.teacherId === id);
  };

  const sendRecruitmentForm = (candidateData) => {
    const token = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomTid = `T${Math.floor(100000 + Math.random() * 900000)}`;
    const fullName = `${candidateData.firstName || ""} ${candidateData.lastName || ""}`.trim() || candidateData.name || "Candidate";
    
    const newTeacher = {
      id: `tch-${Date.now()}`,
      teacherId: randomTid,
      name: fullName,
      firstName: candidateData.firstName || "",
      lastName: candidateData.lastName || "",
      email: candidateData.email || "",
      phone: candidateData.phone || candidateData.primaryContact || "",
      primaryContact: candidateData.phone || candidateData.primaryContact || "",
      subject: candidateData.subject || "General",
      subjects: candidateData.subjects || (candidateData.subject ? [candidateData.subject] : ["General"]),
      status: "Form Sent",
      recruitmentToken: token,
      formSentAt: new Date().toLocaleDateString(),
      invitationMessage: candidateData.message || "",
      isRecruitmentCandidate: true,
    };

    setTeachers((prev) => [newTeacher, ...prev]);
    return {
      teacher: newTeacher,
      token,
      link: `${window.location.origin}/teacher-recruitment/${token}`,
    };
  };

  const requestTeacherCorrections = (id, notes) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== id && t.teacherId !== id) return t;
        return {
          ...t,
          status: "Corrections Requested",
          correctionNotes: notes,
          correctionsRequestedAt: new Date().toLocaleDateString(),
        };
      })
    );
  };

  const submitTeacherCorrections = (tokenOrId, updatedData) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== tokenOrId && t.recruitmentToken !== tokenOrId) return t;
        return {
          ...t,
          ...updatedData,
          status: "Corrections Submitted",
          correctionsSubmittedAt: new Date().toLocaleDateString(),
        };
      })
    );
  };

  const markTeacherHired = (id) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== id && t.teacherId !== id) return t;
        return {
          ...t,
          status: "Hired",
          hiredAt: new Date().toLocaleDateString(),
        };
      })
    );
  };

  const createTeacherAccount = (id, accountData = {}) => {
    const generatedTeacherId = `T${Math.floor(100000 + Math.random() * 900000)}`;
    const tempPassword = accountData.tempPassword || `Bm@${Math.floor(1000 + Math.random() * 9000)}`;
    let createdAccountInfo = null;

    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== id && t.teacherId !== id) return t;
        const finalEmail = accountData.email || t.email || `${(t.firstName || "teacher").toLowerCase()}.${(t.lastName || "staff").toLowerCase()}@bodhyamarg.com`;
        const finalClass = accountData.classAssigned || t.classAssigned || "Class I-A";
        const finalSubject = accountData.primarySubject || t.subject || "General";
        
        createdAccountInfo = {
          id: t.id,
          name: t.name || `${t.firstName} ${t.lastName}`.trim(),
          teacherId: generatedTeacherId,
          email: finalEmail,
          tempPassword,
          classAssigned: finalClass,
          subject: finalSubject,
          createdAt: new Date().toLocaleDateString(),
        };

        return {
          ...t,
          teacherId: generatedTeacherId,
          email: finalEmail,
          classAssigned: finalClass,
          subject: finalSubject,
          status: "Active",
          accountCreatedAt: new Date().toLocaleDateString(),
          isRecruitmentCandidate: false,
        };
      })
    );

    return createdAccountInfo;
  };

  const getTeacherByToken = (token) => {
    return teachers.find((t) => t.recruitmentToken === token || t.id === token);
  };

  return (
    <TeachersContext.Provider
      value={{
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        getTeacherById,
        sendRecruitmentForm,
        requestTeacherCorrections,
        submitTeacherCorrections,
        getTeacherByToken,
        markTeacherHired,
        createTeacherAccount,
      }}
    >
      {children}
    </TeachersContext.Provider>
  );
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) {
    throw new Error("useTeachers must be used within a TeachersProvider");
  }
  return ctx;
}
