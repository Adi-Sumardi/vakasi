import { apiFetch, apiUpload } from '@/lib/api/client';
import type { Employee } from '@/lib/api/employees';

export type PaymentDetail = {
  id: number;
  employee: Employee;
  amount: number;
  status: string;
  paid_at: string | null;
};

export type PaymentDocument = {
  id: number;
  document_type: string;
  file_name: string;
};

export type Payment = {
  id: number;
  payment_number: string;
  activity: { id: number; activity_code: string; name: string };
  payment_date: string;
  payment_method: string;
  source_account: string | null;
  total_amount: number;
  reference_number: string | null;
  status: string;
  processor?: string;
  details?: PaymentDetail[];
  documents?: PaymentDocument[];
};

export function listPayments(params?: { status?: string }): Promise<Payment[]> {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
  return apiFetch<Payment[]>(`/api/v1/payments${qs}`);
}

export function getPayment(id: number): Promise<Payment> {
  return apiFetch<Payment>(`/api/v1/payments/${id}`);
}

export function createPayment(input: {
  activity_id: number;
  payment_method: string;
  payment_date?: string;
  source_account?: string;
  reference_number?: string;
}): Promise<Payment> {
  return apiFetch<Payment>('/api/v1/payments', { method: 'POST', body: input });
}

export function uploadPaymentEvidence(paymentId: number, documentType: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('document_type', documentType);
  formData.append('file', file);

  return apiUpload(`/api/v1/payments/${paymentId}/evidence`, formData);
}

export function completePayment(paymentId: number): Promise<Payment> {
  return apiFetch<Payment>(`/api/v1/payments/${paymentId}/complete`, { method: 'POST' });
}
