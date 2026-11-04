import { FileUploadApiClient } from "./client";

export interface Complaint {
    id: number;
    user: number;
    user_detail?: any;
    subject: string;
    description: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    status_display: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    priority_display: string;
    category?: string;
    admin_response?: string;
    resolved_at?: string;
    attachment?: string | File;
    sent_to_branch?: number;
    sent_to_branch_detail?: any;
    created_at: string;
    updated_at: string;
}

export interface ComplaintCreateRequest {
    subject: string;
    description: string;
    priority?: string;
    category?: string;
    attachment?: File;
    sent_to_branch?: number;
}

export class ComplaintsApiClient extends FileUploadApiClient<Complaint, ComplaintCreateRequest> {
    constructor() {
        super("complaints/");
    }

    // Resolve a complaint (Admin only)
    async resolve(id: number, admin_response?: string) {
        return this.action(id, "resolve", { admin_response });
    }

    // Add admin response (Admin only)
    async addResponse(id: number, admin_response: string) {
        return this.action(id, "add_response", { admin_response });
    }

    // Get statistics (Admin only)
    async getStats() {
        return this.client.get(`${this.endpoint}stats/`);
    }
}

export const complaintsApi = new ComplaintsApiClient();
