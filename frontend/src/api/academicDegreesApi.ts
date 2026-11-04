import { BaseApiClient, PaginatedResponse } from "./client";

import { AcademicDegree, AcademicDegreeCreateInput, AcademicDegreeUpdateInput } from "@/models/academicDegree";

class AcademicDegreesApi extends BaseApiClient<AcademicDegree, AcademicDegreeCreateInput, AcademicDegreeUpdateInput> {
  constructor() {
    super("academic-degrees/");
  }

  // Override getAll since AcademicDegreeViewSet has no pagination
  async getAll(filters?: any): Promise<any> {
     const response = await this.client.get<PaginatedResponse<AcademicDegree>>(this.endpoint, { params: filters });
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

export default new AcademicDegreesApi();
