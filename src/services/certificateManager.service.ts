// src/services/certificateManager.service.ts

import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';
import * as crypto from 'crypto';

export interface DigitalCertificate {
  id: string;
  name: string;
  type: 'A1' | 'A3';
  issuer: string;
  subject: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  isValid: boolean;
  keyUsage: string[];
  certificatePath?: string;
  keyPath?: string;
  passphrase?: string;
  thumbprint: string;
}

export interface CertificateStore {
  certificates: DigitalCertificate[];
  defaultCertificate?: string;
}

class CertificateManager {
  private certificatesPath: string;
  private store: CertificateStore;

  constructor(certificatesPath: string = './certificates') {
    this.certificatesPath = certificatesPath;
    this.store = { certificates: [] };
    this.ensureCertificatesDirectory();
    this.loadCertificates();
  }

  private ensureCertificatesDirectory(): void {
    if (!fs.existsSync(this.certificatesPath)) {
      fs.mkdirSync(this.certificatesPath, { recursive: true });
    }
  }

  // Carregar certificados salvos
  private loadCertificates(): void {
    const storePath = path.join(this.certificatesPath, 'store.json');
    
    if (fs.existsSync(storePath)) {
      try {
        const storeData = fs.readFileSync(storePath, 'utf8');
        this.store = JSON.parse(storeData);
        
        // Converter strings de data de volta para Date objects
        this.store.certificates = this.store.certificates.map(cert => ({
          ...cert,
          validFrom: new Date(cert.validFrom),
          validTo: new Date(cert.validTo)
        }));
      } catch (error) {
        console.error('Erro ao carregar certificados:', error);
        this.store = { certificates: [] };
      }
    }
  }

  // Salvar certificados no store
  private saveCertificates(): void {
    const storePath = path.join(this.certificatesPath, 'store.json');
    
    try {
      fs.writeFileSync(storePath, JSON.stringify(this.store, null, 2));
    } catch (error) {
      console.error('Erro ao salvar certificados:', error);
    }
  }

  // Importar certificado A1 (arquivo .pfx/.p12)
  async importA1Certificate(
    filePath: string, 
    passphrase: string, 
    name?: string
  ): Promise<DigitalCertificate> {
    try {
      const certData = fs.readFileSync(filePath);
      const p12Asn1 = forge.asn1.fromDer(certData.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);

      // Extrair certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]![0];
      const certificate = certBag.cert!;

      // Extrair chave privada
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]![0];

      // Gerar ID único para o certificado
      const certId = crypto.createHash('sha256')
        .update(certificate.serialNumber + certificate.issuer.getField('CN').value)
        .digest('hex')
        .substring(0, 16);

      // Salvar certificado e chave separadamente (formato PEM)
      const certPem = forge.pki.certificateToPem(certificate);
      const keyPem = forge.pki.privateKeyToPem(keyBag.key!);

      const certPath = path.join(this.certificatesPath, `${certId}.crt`);
      const keyPath = path.join(this.certificatesPath, `${certId}.key`);

      fs.writeFileSync(certPath, certPem);
      fs.writeFileSync(keyPath, keyPem);

      // Criar objeto do certificado
      const digitalCert: DigitalCertificate = {
        id: certId,
        name: name || this.extractCertificateName(certificate),
        type: 'A1',
        issuer: this.formatDistinguishedName(certificate.issuer.attributes),
        subject: this.formatDistinguishedName(certificate.subject.attributes),
        serialNumber: certificate.serialNumber,
        validFrom: certificate.validity.notBefore,
        validTo: certificate.validity.notAfter,
        isValid: this.isCertificateValid(certificate),
        keyUsage: this.extractKeyUsage(certificate),
        certificatePath: certPath,
        keyPath: keyPath,
        passphrase: passphrase,
        thumbprint: this.calculateThumbprint(certificate)
      };

      // Adicionar ao store
      this.store.certificates.push(digitalCert);
      this.saveCertificates();

      return digitalCert;
    } catch (error) {
      throw new Error(`Erro ao importar certificado A1: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Detectar certificados A3 (smart card/token USB)
  async detectA3Certificates(): Promise<DigitalCertificate[]> {
    // Implementação simplificada - em produção seria necessário usar bibliotecas específicas
    // como node-crypto, pkcs11js ou similar para acessar certificados em hardware
    
    try {
      // Simular detecção de certificados A3 - implementação específica dependeria do middleware
      const a3Certificates: DigitalCertificate[] = [];
      
      // Em uma implementação real, aqui seria feita a comunicação com o middleware
      // do certificado (SafeNet, Gemalto, etc.) para listar certificados disponíveis
      
      console.log('Detecção de certificados A3 requer middleware específico');
      
      return a3Certificates;
    } catch (error) {
      console.error('Erro ao detectar certificados A3:', error);
      return [];
    }
  }

  // Listar todos os certificados
  listCertificates(): DigitalCertificate[] {
    return this.store.certificates.filter(cert => cert.isValid);
  }

  // Obter certificado por ID
  getCertificate(id: string): DigitalCertificate | undefined {
    return this.store.certificates.find(cert => cert.id === id);
  }

  // Definir certificado padrão
  setDefaultCertificate(id: string): void {
    const certificate = this.getCertificate(id);
    if (certificate && certificate.isValid) {
      this.store.defaultCertificate = id;
      this.saveCertificates();
    } else {
      throw new Error('Certificado não encontrado ou inválido');
    }
  }

  // Obter certificado padrão
  getDefaultCertificate(): DigitalCertificate | undefined {
    if (this.store.defaultCertificate) {
      return this.getCertificate(this.store.defaultCertificate);
    }
    
    // Se não há padrão definido, retornar o primeiro válido
    const validCerts = this.listCertificates();
    return validCerts.length > 0 ? validCerts[0] : undefined;
  }

  // Remover certificado
  removeCertificate(id: string): boolean {
    const index = this.store.certificates.findIndex(cert => cert.id === id);
    
    if (index !== -1) {
      const certificate = this.store.certificates[index];
      
      // Remover arquivos do certificado se existirem
      if (certificate.certificatePath && fs.existsSync(certificate.certificatePath)) {
        fs.unlinkSync(certificate.certificatePath);
      }
      if (certificate.keyPath && fs.existsSync(certificate.keyPath)) {
        fs.unlinkSync(certificate.keyPath);
      }
      
      // Remover do store
      this.store.certificates.splice(index, 1);
      
      // Se era o certificado padrão, limpar a referência
      if (this.store.defaultCertificate === id) {
        this.store.defaultCertificate = undefined;
      }
      
      this.saveCertificates();
      return true;
    }
    
    return false;
  }

  // Validar certificado
  validateCertificate(id: string): boolean {
    const certificate = this.getCertificate(id);
    
    if (!certificate) {
      return false;
    }
    
    const now = new Date();
    const isTimeValid = now >= certificate.validFrom && now <= certificate.validTo;
    
    // Atualizar status no store se mudou
    if (certificate.isValid !== isTimeValid) {
      certificate.isValid = isTimeValid;
      this.saveCertificates();
    }
    
    return isTimeValid;
  }

  // Obter dados do certificado para uso em requisições HTTPS
  getCertificateForHTTPS(id?: string): { cert: string; key: string; passphrase?: string } | null {
    const certificate = id ? this.getCertificate(id) : this.getDefaultCertificate();
    
    if (!certificate || !certificate.isValid) {
      return null;
    }
    
    if (certificate.type === 'A1' && certificate.certificatePath && certificate.keyPath) {
      try {
        const cert = fs.readFileSync(certificate.certificatePath, 'utf8');
        const key = fs.readFileSync(certificate.keyPath, 'utf8');
        
        return {
          cert,
          key,
          passphrase: certificate.passphrase
        };
      } catch (error) {
        console.error('Erro ao ler arquivos do certificado:', error);
        return null;
      }
    }
    
    // Para certificados A3, seria necessário implementar comunicação com o hardware
    console.warn('Certificados A3 requerem implementação específica para cada middleware');
    return null;
  }

  // Verificar se há certificados prestes a vencer
  getExpiringCertificates(daysThreshold: number = 30): DigitalCertificate[] {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return this.store.certificates.filter(cert => 
      cert.isValid && cert.validTo <= thresholdDate
    );
  }

  // Métodos utilitários privados
  private extractCertificateName(certificate: forge.pki.Certificate): string {
    const commonName = certificate.subject.getField('CN');
    return commonName ? commonName.value : 'Certificado Digital';
  }

  private formatDistinguishedName(dn: forge.pki.CertificateField[]): string {
    return dn.map(field => `${field.shortName}=${field.value}`).join(', ');
  }

  private isCertificateValid(certificate: forge.pki.Certificate): boolean {
    const now = new Date();
    return now >= certificate.validity.notBefore && now <= certificate.validity.notAfter;
  }

  private extractKeyUsage(certificate: forge.pki.Certificate): string[] {
    const keyUsages: string[] = [];
    
    // Extrair extensões de uso de chave
    const keyUsageExt = certificate.getExtension('keyUsage');
    if (keyUsageExt) {
      // Implementar parsing das extensões de key usage
      keyUsages.push('Digital Signature', 'Key Encipherment');
    }
    
    return keyUsages;
  }

  private calculateThumbprint(certificate: forge.pki.Certificate): string {
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
    return crypto.createHash('sha1').update(der, 'binary').digest('hex').toUpperCase();
  }

  // Limpar certificados expirados
  cleanupExpiredCertificates(): number {
    const initialCount = this.store.certificates.length;
    
    this.store.certificates = this.store.certificates.filter(cert => {
      const isValid = this.validateCertificate(cert.id);
      
      // Se expirado, remover arquivos também
      if (!isValid) {
        if (cert.certificatePath && fs.existsSync(cert.certificatePath)) {
          fs.unlinkSync(cert.certificatePath);
        }
        if (cert.keyPath && fs.existsSync(cert.keyPath)) {
          fs.unlinkSync(cert.keyPath);
        }
      }
      
      return isValid;
    });
    
    this.saveCertificates();
    
    return initialCount - this.store.certificates.length;
  }

  // Exportar informações dos certificados (sem dados sensíveis)
  exportCertificateInfo(): any[] {
    return this.store.certificates.map(cert => ({
      id: cert.id,
      name: cert.name,
      type: cert.type,
      issuer: cert.issuer,
      subject: cert.subject,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      isValid: cert.isValid,
      thumbprint: cert.thumbprint
    }));
  }
}

export { CertificateManager };