import { apiUpload } from '@/lib/api/client';
import type { ActivityDocument } from '@/lib/api/activities';

export function uploadActivityDocument(activityId: number, documentType: string, file: File): Promise<ActivityDocument> {
  const formData = new FormData();
  formData.append('document_type', documentType);
  formData.append('file', file);

  return apiUpload<ActivityDocument>(`/api/v1/activities/${activityId}/documents`, formData);
}
