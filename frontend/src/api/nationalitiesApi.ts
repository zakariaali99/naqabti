import { BaseApiClient, PaginatedResponse } from "./client";

import { Nationality, NationalityCreateInput, NationalityUpdateInput } from "@/models/nationality";

class NationalitiesApi extends BaseApiClient<Nationality, NationalityCreateInput, NationalityUpdateInput> {
  constructor() {
    super("nationalities/");
  }

  // Override getAll since NationalityViewSet has no pagination
  async getAll(filters?: any): Promise<any> {
     const response = await this.client.get<PaginatedResponse<Nationality>>(this.endpoint, { params: filters });
     // Handle case where backend returns plain array instead of paginated results
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

export default new NationalitiesApi();
