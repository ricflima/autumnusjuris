export interface DigitalSignature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signatureHash: string;
  timestamp: string;
  ipAddress: string;
  certificateInfo?: {
    issuer: string;
    subject: string;
    serialNumber: string;
    validFrom: string;
    validTo: string;
  };
  status: 'pending' | 'signed' | 'rejected' | 'expired';
  signatureType: 'simple' | 'advanced' | 'qualified';
  metadata?: Record<string, any>;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  requestedBy: string;
  signers: SignatureRequestSigner[];
  title: string;
  message?: string;
  deadline?: string;
  status: 'draft' | 'sent' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  signatureFlow: 'parallel' | 'sequential';
}

export interface SignatureRequestSigner {
  id: string;
  name: string;
  email: string;
  order: number;
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: string;
  rejectionReason?: string;
}

export interface CertificateValidation {
  isValid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  errors?: string[];
}

export interface SignatureValidation {
  isValid: boolean;
  signatureHash: string;
  timestamp: string;
  signer: string;
  documentIntegrity: boolean;
  certificateValidation?: CertificateValidation;
}