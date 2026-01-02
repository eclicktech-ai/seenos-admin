export interface Project {
  id: string;
  userId: string;
  ownerEmail?: string;
  name: string;
  domain?: string;
  websiteUrl?: string;
  settings?: Record<string, unknown>;
  onboardingStatus?: string;
  researchStatus?: string;
  currentStep?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

