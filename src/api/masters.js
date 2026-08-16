import api from "./client";

function unwrap(data) {
  return data;
}

export async function fetchMasters() {
  const { data } = await api.get("/api/method/education.api.masters.get_masters");
  return unwrap(data) || { staff: [], classes: [], feeStructures: [], students: [] };
}

export async function fetchStaff() {
  const { data } = await api.get("/api/method/education.api.masters.list_staff");
  return unwrap(data) || [];
}

export async function fetchClasses() {
  const { data } = await api.get("/api/method/education.api.masters.list_classes");
  return unwrap(data) || [];
}

export async function fetchFeeStructures() {
  const { data } = await api.get(
    "/api/method/education.api.masters.list_fee_structures"
  );
  return unwrap(data) || [];
}

export async function fetchStudents() {
  const { data } = await api.get("/api/method/education.api.masters.list_students");
  return unwrap(data) || [];
}
