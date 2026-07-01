// Shared types between web and api
export type Role = 'USER' | 'ADMIN' | 'AFFILIATE';
export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: Role;
  plan: SubscriptionPlan;
  affiliateCode?: string;
  createdAt: string;
}

export interface RiasecResult {
  R: number; I: number; A: number; S: number; E: number; C: number;
  top3: string;
  topCode: string;
}

export interface CareerMatch {
  rank: number;
  name: string;
  niche: string;
  pct: number;
  salary: string;
  riasec: string;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  riasecResult: RiasecResult;
  careerResult: CareerMatch[];
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
