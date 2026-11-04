import axios from "axios";

export interface PublicDoctorBranch {
  id: number;
  name: string;
  prefix: string;
  city?: string | null;
}

export interface PublicDoctorInstitution {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  logo?: string | null;
}

export interface PublicDoctorCertification {
  id: number;
  type_name: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  issued_from?: string | null;
  document_url?: string | null;
}

export interface PublicDoctorProfile {
  username: string;
  full_doctor_number?: string | null;
  full_name?: string | null;
  profile_image_url?: string | null;
  specialty?: string | null;
  bio?: string | null;
  phone_number?: string | null;
  email?: string | null;
  city_name?: string | null;
  area?: string | null;
  degree_name?: string | null;
  university_name?: string | null;
  branches?: PublicDoctorBranch[];
  institutions?: PublicDoctorInstitution[];
  certifications?: PublicDoctorCertification[];
  visible_fields?: string[];
}

export const publicDoctorApi = {
  getProfile: async (username: string): Promise<PublicDoctorProfile> => {
    // Plain unauthenticated request
    const response = await axios.get<PublicDoctorProfile>(
      `/api/public/doctors/${encodeURIComponent(username)}/`
    );
    return response.data;
  },
};

export default publicDoctorApi;
