import type {
  CertificationType,
  CertificationTypeCreate,
  CertificationTypeUpdate,
} from "@/models/certificationTypes";

import { BaseApiClient } from "./client";

class CertificationTypesApiClient extends BaseApiClient<
  CertificationType,
  CertificationTypeCreate,
  CertificationTypeUpdate
> {
  constructor() {
    super("certification-types/");
  }

  // Get certification types with specific filters
  async getByRenewable(isRenewable: boolean) {
    return this.getAll({ is_renewable: isRenewable });
  }

  // Get certification types that have prerequisites
  async getWithPrerequisites() {
    return this.getAll({ has_prerequisites: true });
  }

  // Get certification types without prerequisites (entry-level)
  async getEntryLevel() {
    return this.getAll({ has_prerequisites: false });
  }

  // Search certification types by name or description
  async search(query: string) {
    return this.getAll({ search: query });
  }

  // Get certification types ordered by name
  async getOrderedByName(ascending: boolean = true) {
    return this.getAll({ ordering: ascending ? "name" : "-name" });
  }

  // Get certification types ordered by creation date
  async getOrderedByDate(ascending: boolean = false) {
    return this.getAll({ ordering: ascending ? "created_at" : "-created_at" });
  }

  // Custom method to duplicate a certification type
  async duplicate(id: number, newName: string) {
    return this.action(id, "duplicate", { name: newName });
  }

  // Custom method to get certification type statistics
  async getStats() {
    return this.collectionAction("stats");
  }
}

export default new CertificationTypesApiClient();
