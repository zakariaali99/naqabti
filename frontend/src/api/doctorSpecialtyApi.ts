import { BaseApiClient, PaginatedResponse } from "./client";

import { DoctorSpecialty, DoctorSpecialtyCreateInput, DoctorSpecialtyUpdateInput } from "@/models/doctorSpecialty";

class DoctorSpecialtyApi extends BaseApiClient<DoctorSpecialty, DoctorSpecialtyCreateInput, DoctorSpecialtyUpdateInput> {
  constructor() {
    super("doctor-specialties/");
  }

  async getAll(filters?: any): Promise<any> {
     const response = await this.client.get<PaginatedResponse<DoctorSpecialty>>(this.endpoint, { params: filters });
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

export default new DoctorSpecialtyApi();
