export type DocType =
  | "contract_full"
  | "contract_50_50"
  | "personal_data_consent"
  | "refund_application"
  | "pause_application"
  | "personal_data_excel"
  | "refund_receipt_full"
  | "refund_receipt_partial";

export type DocStatus = "draft" | "under_review" | "approved" | "returned" | "signed";

export type SignStatus = "pending" | "approved" | "expired";

export interface Document {
  id: number;
  deal_id: number;
  client_id?: number;
  doc_type: DocType;
  status: DocStatus | string;
  sign_status?: SignStatus | string;
  file_path: string;
  file_path_docx: string;
  file_path_pdf: string;
  created_at: string;
  updated_at?: string;
}

export type Documents_Create_from_client_Request = {
  client_id: number;
  deal_id: number;
  doc_type: string;
  extra?: Record<string, any>;
}

export type Documents_Upload_document_Request = {
  deal_id: number;
  doc_type: DocType;
  file: File;
}