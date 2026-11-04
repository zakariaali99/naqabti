import { BaseApiClient } from "./client";

import {
  Certification,
  CertificationCreateInput,
  CertificationUpdateInput,
} from "@/models";

class CertificationsApi extends BaseApiClient<
  Certification,
  CertificationCreateInput,
  CertificationUpdateInput
> {
  constructor() {
    super("certifications/");
  }

  // Custom certification actions
  async renew(id: number) {
    return this.action(id, "renew", {});
  }

  async revoke(id: number, reason?: string) {
    return this.action(id, "revoke", { reason });
  }

  async downloadCertificate(id: number): Promise<Blob> {
    const response = await this.client.get(`${this.endpoint}${id}/download/`, {
      responseType: "blob",
    });

    return response.data;
  }

  // Override create to support file uploads
  async create(data: CertificationCreateInput, onUploadProgress?: (progressEvent: any) => void) {
    const formData = new FormData();
    
    // Append all fields to FormData
    formData.append("doctor_id", data.doctor_id.toString());
    formData.append(
      "certification_type_id",
      data.certification_type_id.toString(),
    );
    formData.append("issue_date", data.issue_date);

    if (data.expiry_date) formData.append("expiry_date", data.expiry_date);
    if (data.issued_from) formData.append("issued_from", data.issued_from);
    if (data.document && data.document instanceof File) {
      formData.append("document", data.document);
    }

    return this.client.post(this.endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
  }

  // Override update to support file uploads
  async update(id: number, data: CertificationUpdateInput, onUploadProgress?: (progressEvent: any) => void) {
    const formData = new FormData();

    // Append all fields to FormData (only if provided)
    if (data.doctor_id !== undefined)
      formData.append("doctor_id", data.doctor_id.toString());
    if (data.certification_type_id !== undefined)
      formData.append(
        "certification_type_id",
        data.certification_type_id.toString(),
      );
    if (data.issue_date) formData.append("issue_date", data.issue_date);
    if (data.expiry_date) formData.append("expiry_date", data.expiry_date);
    if (data.issued_from) formData.append("issued_from", data.issued_from);
    if (data.document && data.document instanceof File) {
      formData.append("document", data.document);
    }

    return this.client.put(`${this.endpoint}${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
  }
}

export default new CertificationsApi();
