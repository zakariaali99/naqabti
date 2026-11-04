import { BaseApiClient, PaginatedResponse } from "./client";

import { Institution, InstitutionInput } from "@/models/institution";

class InstitutionsApi extends BaseApiClient<Institution, InstitutionInput, InstitutionInput> {
  constructor() {
    super("institutions/");
  }

  async getAll(filters?: any): Promise<any> {
     const response = await this.client.get<PaginatedResponse<Institution>>(this.endpoint, { params: filters });
     if (Array.isArray(response.data)) {
       return {
         ...response,
         data: {
           results: response.data,
           count: response.data.length,
           next: null,
           previous: null
         }
       };
     }
     return response;
  }
}

export default new InstitutionsApi();
