import { FileUploadApiClient } from "./client";

export type LibraryItemType = 'pdf' | 'image' | 'video' | 'link' | 'other';

export interface LibraryItem {
    id: number;
    title: string;
    description?: string;
    category?: string;
    item_type: LibraryItemType;
    item_type_display: string;
    file?: string;
    file_url?: string;
    external_link?: string;
    thumbnail?: string;
    thumbnail_url?: string;
    author_name?: string;
    publication_year?: number;
    download_count: number;
    view_count: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    created_by?: number;
    created_by_name?: string;
    specialty?: number;
    specialty_name?: string;
}

export interface LibraryItemCreateRequest {
    title: string;
    description?: string;
    category?: string;
    item_type: LibraryItemType;
    file?: File;
    external_link?: string;
    thumbnail?: File;
    author_name?: string;
    publication_year?: number;
    is_public?: boolean;
    specialty?: number;
}

interface StartUploadResponse {
    upload_id: string;
}

interface ChunkProgressResponse {
    received_chunks: number;
    total_chunks: number;
}

const CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 250 * 1024 * 1024;
const MAX_CONCURRENT_CHUNKS = 4;

export class LibraryApiClient extends FileUploadApiClient<LibraryItem, LibraryItemCreateRequest> {
    constructor() {
        super("library/");
    }

    async incrementDownload(id: number) {
        return this.action(id, "increment_download");
    }

    async incrementView(id: number) {
        return this.action(id, "increment_view");
    }

    async getStats() {
        return this.client.get(`${this.endpoint}stats/`);
    }

    async createWithProgress(data: LibraryItemCreateRequest, onProgress?: (percent: number) => void) {
        const formData = this.createFormData(data);
        return this.client.post<LibraryItem>(this.endpoint, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 300000,
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percent);
                }
            },
        });
    }

    async updateWithProgress(id: number, data: LibraryItemCreateRequest, onProgress?: (percent: number) => void) {
        const formData = this.createFormData(data);
        return this.client.put<LibraryItem>(`${this.endpoint}${id}/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 300000,
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percent);
                }
            },
        });
    }

    startUpload(data: {
        file_name: string;
        file_size: number;
        total_chunks: number;
        title: string;
        description?: string;
        category?: string;
        author_name?: string;
        publication_year?: number;
        is_public?: boolean;
        specialty?: number;
    }) {
        return this.client.post<StartUploadResponse>(`${this.endpoint}start_upload/`, data);
    }

    uploadChunk(uploadId: string, chunk: Blob, chunkIndex: number) {
        const formData = new FormData();
        formData.append('upload_id', uploadId);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('chunk', chunk);
        return this.client.post<ChunkProgressResponse>(`${this.endpoint}upload_chunk/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 300000,
        });
    }

    finalizeUpload(uploadId: string) {
        return this.client.post<LibraryItem>(`${this.endpoint}finalize_upload/`, { upload_id: uploadId });
    }

    async createChunked(
        file: File,
        metadata: {
            title: string;
            description?: string;
            category?: string;
            author_name?: string;
            publication_year?: number;
            is_public?: boolean;
            specialty?: number;
        },
        onProgress?: (percent: number) => void,
    ): Promise<LibraryItem> {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const chunks: Blob[] = [];

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            chunks.push(file.slice(start, end));
        }

        const startRes = await this.startUpload({
            file_name: file.name,
            file_size: file.size,
            total_chunks: totalChunks,
            ...metadata,
        });

        const uploadId = startRes.data.upload_id;
        let completedBytes = 0;

        const uploadOneChunk = async (index: number): Promise<void> => {
            await this.uploadChunk(uploadId, chunks[index], index);
            completedBytes += chunks[index].size;
            const pct = Math.round((completedBytes / file.size) * 100);
            onProgress?.(Math.min(pct, 99));
        };

        const queue: Promise<void>[] = [];
        let nextIndex = 0;

        const enqueue = (): Promise<void> | null => {
            if (nextIndex >= totalChunks) return null;
            const idx = nextIndex++;
            const task = uploadOneChunk(idx).then(() => {
                const next = enqueue();
                return next || undefined;
            });
            queue.push(task);
            return task;
        };

        for (let i = 0; i < Math.min(MAX_CONCURRENT_CHUNKS, totalChunks); i++) {
            enqueue();
        }

        await Promise.all(queue);

        const finalizeRes = await this.finalizeUpload(uploadId);
        onProgress?.(100);
        return finalizeRes.data;
    }
}

export { CHUNK_SIZE, MAX_FILE_SIZE };
export const libraryApi = new LibraryApiClient();
