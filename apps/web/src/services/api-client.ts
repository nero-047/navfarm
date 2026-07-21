import { api as coreApi } from '../lib/api-client';

// Compatibility facade for the admin/console application imported from the
// upstream NAVFarm frontend. Session storage and token refresh remain owned by
// the shared API client used by the rest of this web application.
export const api = {
  get: (path: string, options?: any): Promise<any> => coreApi.get<any>(path, options),
  post: (path: string, body?: any, options?: any): Promise<any> =>
    coreApi.post<any>(path, body, options),
  put: (path: string, body?: any, options?: any): Promise<any> =>
    coreApi.put<any>(path, body, options),
  patch: (path: string, body?: any, options?: any): Promise<any> =>
    coreApi.patch<any>(path, body, options),
  delete: (path: string, options?: any): Promise<any> => coreApi.delete<any>(path, options),
};

export default api;
