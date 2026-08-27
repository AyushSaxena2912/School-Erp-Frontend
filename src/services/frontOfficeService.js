/**
 * Front Office Service connecting to education.api.front_office endpoints
 */

import { apiRequest } from "./apiClient";

export const frontOfficeService = {
  // ==========================================
  // DASHBOARD
  // ==========================================
  async getDashboardData() {
    return await apiRequest("education.api.front_office.get_dashboard_data", {
      method: "GET",
    });
  },

  // ==========================================
  // ENQUIRIES & ADMISSIONS
  // ==========================================
  async getEnquiries(params = {}) {
    return await apiRequest("education.api.front_office.get_enquiries", {
      method: "GET",
      params,
    });
  },

  async createEnquiry(enquiryData) {
    return await apiRequest("education.api.front_office.create_enquiry", {
      method: "POST",
      body: enquiryData,
    });
  },

  async updateEnquiry(enquiryData) {
    return await apiRequest("education.api.front_office.update_enquiry", {
      method: "POST",
      body: enquiryData,
    });
  },

  async getEnquiryDetail(enquiryId) {
    return await apiRequest("education.api.front_office.get_enquiry_detail", {
      method: "GET",
      params: { enquiry_id: enquiryId },
    });
  },

  async addFollowup(followupData) {
    return await apiRequest("education.api.front_office.add_followup", {
      method: "POST",
      body: followupData,
    });
  },

  async createAdmissionAccounts(enquiryId) {
    return await apiRequest("education.api.front_office.create_admission_accounts", {
      method: "POST",
      body: { enquiry_id: enquiryId },
    });
  },

  async approveAdmission(enquiryId) {
    return await apiRequest("education.api.front_office.approve_admission", {
      method: "POST",
      body: { enquiry_id: enquiryId },
    });
  },

  async regenerateAdmissionToken(enquiryId) {
    return await apiRequest("education.api.front_office.regenerate_admission_token", {
      method: "POST",
      body: { enquiry_id: enquiryId },
    });
  },

  async deleteEnquiry(ids) {
    const idsList = Array.isArray(ids) ? ids : [ids];
    return await apiRequest("education.api.front_office.delete_enquiry", {
      method: "POST",
      body: { ids: idsList },
    });
  },

  // ==========================================
  // VISITOR LOGS
  // ==========================================
  async getVisitors(params = {}) {
    return await apiRequest("education.api.front_office.get_visitors", {
      method: "GET",
      params,
    });
  },

  async checkInVisitor(visitorData) {
    return await apiRequest("education.api.front_office.check_in_visitor", {
      method: "POST",
      body: visitorData,
    });
  },

  async updateVisitor(visitorData) {
    return await apiRequest("education.api.front_office.update_visitor", {
      method: "POST",
      body: visitorData,
    });
  },

  async checkOutVisitor(visitorLogId) {
    return await apiRequest("education.api.front_office.check_out_visitor", {
      method: "POST",
      body: { visitor_log_id: visitorLogId },
    });
  },

  async deleteVisitor(ids) {
    const idsList = Array.isArray(ids) ? ids : [ids];
    return await apiRequest("education.api.front_office.delete_visitor", {
      method: "POST",
      body: { ids: idsList },
    });
  },

  // ==========================================
  // COMPLAINT REGISTER
  // ==========================================
  async getComplaints(params = {}) {
    return await apiRequest("education.api.front_office.get_complaints", {
      method: "GET",
      params,
    });
  },

  async registerComplaint(complaintData) {
    return await apiRequest("education.api.front_office.register_complaint", {
      method: "POST",
      body: complaintData,
    });
  },

  async updateComplaint(complaintData) {
    return await apiRequest("education.api.front_office.update_complaint", {
      method: "POST",
      body: complaintData,
    });
  },

  async updateComplaintStatus(complaintData) {
    return await apiRequest("education.api.front_office.update_complaint_status", {
      method: "POST",
      body: complaintData,
    });
  },

  async deleteComplaint(ids) {
    const idsList = Array.isArray(ids) ? ids : [ids];
    return await apiRequest("education.api.front_office.delete_complaint", {
      method: "POST",
      body: { ids: idsList },
    });
  },

  // ==========================================
  // SETTINGS & METADATA
  // ==========================================
  async getSettings() {
    return await apiRequest("education.api.front_office.get_settings", {
      method: "GET",
    });
  },

  async saveSettings(settingsData) {
    return await apiRequest("education.api.front_office.save_settings", {
      method: "POST",
      body: settingsData,
    });
  },

  async getCustomFields() {
    return await apiRequest("education.api.front_office.get_custom_fields", {
      method: "GET",
    });
  },

  async saveCustomFields(fields) {
    return await apiRequest("education.api.front_office.save_custom_fields", {
      method: "POST",
      body: { custom_fields: fields },
    });
  },

  // ==========================================
  // GUEST PARENT PORTAL TOKENIZED FORMS
  // ==========================================
  async getEnquiryByToken(token) {
    return await apiRequest("education.api.front_office.get_enquiry_by_token", {
      method: "GET",
      params: { token },
    });
  },

  async submitParentFormByToken(formData) {
    return await apiRequest("education.api.front_office.submit_parent_form_by_token", {
      method: "POST",
      body: formData,
    });
  },
};
