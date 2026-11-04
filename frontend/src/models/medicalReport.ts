export type DocumentStatus = "pending" | "approved" | "rejected";

export interface MedicalReport {
    id: number;
    doctor: number;
    doctor_detail?: any;
    patient_name: string;
    patient_id?: string;
    report_date: string;
    diagnosis: string;
    treatment?: string;
    recommendations?: string;
    notes?: string;
    /** Approved/active document (read-only) */
    document?: string;
    document_url?: string;
    /** URL to the document awaiting manager approval */
    pending_document_url?: string;
    document_status: DocumentStatus;
    approved_by?: number;
    approved_by_detail?: any;
    approved_at?: string;
    created_at: string;
    updated_at: string;
}

export interface MedicalReportCreateRequest {
    patient_name: string;
    patient_id?: string;
    diagnosis: string;
    treatment?: string;
    recommendations?: string;
    notes?: string;
    /** File upload — routed to pending_document on the server until a manager approves */
    upload_document?: File;
}
