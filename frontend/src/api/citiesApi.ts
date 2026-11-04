import { BaseApiClient, PaginatedResponse } from "./client";

import { City, CityCreateInput, CityUpdateInput } from "@/models/city";

class CitiesApi extends BaseApiClient<City, CityCreateInput, CityUpdateInput> {
  constructor() {
    super("cities/");
  }

  // Override getAll since CityViewSet has no pagination
  async getAll(filters?: any): Promise<any> {
     const response = await this.client.get<PaginatedResponse<City>>(this.endpoint, { params: filters });
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


export default new CitiesApi();
