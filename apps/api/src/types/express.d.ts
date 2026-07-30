declare namespace Express {
  interface Request {
    tenantId?: string;
    user?: {
      userId: string;
      email: string;
      tenantId: string;
      companyId: string | null;
      userType: string;
    };
    onboarding?: {
      tenantId: string;
      companyId: string;
    };
  }
}
