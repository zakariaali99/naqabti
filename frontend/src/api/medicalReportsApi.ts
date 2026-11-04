import { FileUploadApiClient } from "./client";
import type { MedicalReport, MedicalReportCreateRequest } from "@/models/medicalReport";

export type { MedicalReport, MedicalReportCreateRequest } from "@/models/medicalReport";

class MedicalReportsApi extends FileUploadApiClient<MedicalReport, MedicalReportCreateRequest> {
    constructor() {
        super("medical-reports/");
    }

    async getStats() {
        return this.client.get(`${this.endpoint}stats/`);
    }

    async approveDocument(id: number) {
        return this.client.post<MedicalReport>(`${this.endpoint}${id}/approve_document/`);
    }

    async rejectDocument(id: number) {
        return this.client.post<MedicalReport>(`${this.endpoint}${id}/reject_document/`);
    }

    async exportPdf(id: number) {
        try {
            const response = await this.client.get(`${this.endpoint}${id}/export_pdf/`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const disposition = response.headers['content-disposition'] || '';
            const match = disposition.match(/filename="?(.+?)"?$/);
            link.download = match ? match[1] : `medical_report_${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            throw error;
        }
    }
}

export const medicalReportsApi = new MedicalReportsApi();
