import { 
  DigitalSignature, 
  SignatureRequest, 
  SignatureRequestSigner,
  SignatureValidation,
  CertificateValidation
} from '../types/digitalSignature';

class DigitalSignatureService {
  // Mock data para demonstração
  private mockSignatures: DigitalSignature[] = [
    {
      id: '1',
      documentId: 'doc-1',
      signerId: 'client-1',
      signerName: 'João Silva',
      signerEmail: 'joao.silva@email.com',
      signatureHash: 'sha256:a1b2c3d4e5f6',
      timestamp: '2025-01-15T10:30:00Z',
      ipAddress: '192.168.1.100',
      status: 'signed',
      signatureType: 'advanced',
      certificateInfo: {
        issuer: 'ICP-Brasil CA',
        subject: 'João Silva - CPF 123.456.789-00',
        serialNumber: 'ABC123456',
        validFrom: '2024-01-01T00:00:00Z',
        validTo: '2025-12-31T23:59:59Z'
      }
    }
  ];

  private mockRequests: SignatureRequest[] = [
    {
      id: '1',
      documentId: 'doc-1',
      requestedBy: 'lawyer-1',
      title: 'Contrato de Prestação de Serviços',
      message: 'Por favor, assine o contrato em anexo',
      deadline: '2025-02-01T23:59:59Z',
      status: 'sent',
      createdAt: '2025-01-15T09:00:00Z',
      signatureFlow: 'sequential',
      signers: [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao.silva@email.com',
          order: 1,
          status: 'signed',
          signedAt: '2025-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria.santos@email.com',
          order: 2,
          status: 'pending'
        }
      ]
    }
  ];

  async getSignatures(documentId?: string): Promise<DigitalSignature[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (documentId) {
          resolve(this.mockSignatures.filter(sig => sig.documentId === documentId));
        }
        resolve([...this.mockSignatures]);
      }, 500);
    });
  }

  async getSignatureRequests(): Promise<SignatureRequest[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.mockRequests]);
      }, 500);
    });
  }

  async createSignatureRequest(request: Omit<SignatureRequest, 'id' | 'createdAt' | 'status'>): Promise<SignatureRequest> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRequest: SignatureRequest = {
          ...request,
          id: `req-${Date.now()}`,
          status: 'draft',
          createdAt: new Date().toISOString(),
        };
        this.mockRequests.push(newRequest);
        resolve(newRequest);
      }, 500);
    });
  }

  async sendSignatureRequest(requestId: string): Promise<SignatureRequest> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const request = this.mockRequests.find(r => r.id === requestId);
        if (!request) {
          reject(new Error('Solicitação não encontrada'));
          return;
        }
        request.status = 'sent';
        resolve(request);
      }, 500);
    });
  }

  async signDocument(documentId: string, signerId: string, signatureData: any): Promise<DigitalSignature> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const signature: DigitalSignature = {
          id: `sig-${Date.now()}`,
          documentId,
          signerId,
          signerName: 'Mock Signer',
          signerEmail: 'signer@example.com',
          signatureHash: `sha256:${Math.random().toString(36).substr(2, 12)}`,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.100',
          status: 'signed',
          signatureType: 'advanced',
          ...signatureData
        };
        this.mockSignatures.push(signature);
        resolve(signature);
      }, 1000);
    });
  }

  async validateSignature(signatureId: string): Promise<SignatureValidation> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const signature = this.mockSignatures.find(s => s.id === signatureId);
        if (!signature) {
          resolve({
            isValid: false,
            signatureHash: '',
            timestamp: '',
            signer: '',
            documentIntegrity: false
          });
          return;
        }

        resolve({
          isValid: true,
          signatureHash: signature.signatureHash,
          timestamp: signature.timestamp,
          signer: signature.signerName,
          documentIntegrity: true,
          certificateValidation: signature.certificateInfo ? {
            isValid: true,
            issuer: signature.certificateInfo.issuer,
            subject: signature.certificateInfo.subject,
            validFrom: signature.certificateInfo.validFrom,
            validTo: signature.certificateInfo.validTo
          } : undefined
        });
      }, 800);
    });
  }

  async deleteSignatureRequest(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.mockRequests.findIndex(r => r.id === requestId);
        if (index > -1) {
          this.mockRequests.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  }

  // Simular integração com provedor de assinatura digital (ICP-Brasil, DocuSign, etc.)
  async integrateWithProvider(provider: 'icp-brasil' | 'docusign' | 'adobe-sign'): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulação de integração
        console.log(`Integração com ${provider} simulada com sucesso`);
        resolve(true);
      }, 1000);
    });
  }
}

export const digitalSignatureService = new DigitalSignatureService();
export default digitalSignatureService;