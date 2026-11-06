/**
 * PK-OS Secure Biometric & Attendance Storage Service
 * Encrypted IndexedDB storage with WebCrypto AES-GCM for biometric vectors and sensitive photos.
 * Provides unified interface (IBiometricStorage) for local or remote backend replacement.
 * Supports biometric backup export/import and security audit logs.
 */

import { Employee, BiometricAuditLog, PunchEvidenceMetadata } from '../types/hrAttendanceTypes';

export interface IBiometricStorage {
  saveEncryptedBiometrics(employeeId: string, descriptors: number[][], photoDataUrl?: string): Promise<boolean>;
  getDecryptedBiometrics(employeeId: string): Promise<{ descriptors: number[][]; photoDataUrl?: string } | null>;
  deleteBiometrics(employeeId: string): Promise<boolean>;
  exportEncryptedArchive(): Promise<string>;
  importEncryptedArchive(jsonArchive: string): Promise<{ importedCount: number }>;
}

const DB_NAME = 'pk_secure_biometrics_db';
const DB_VERSION = 1;
const STORE_NAME = 'biometrics_vault';
const AUDIT_STORE_KEY = 'pk_hr_biometric_audit_logs';

// Standard PBKDF2 Derived Key or WebCrypto Key Cache
let cachedKey: CryptoKey | null = null;

async function getMasterKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const enc = new TextEncoder();
  // Fixed hardware salt / key material for PK-OS node (can be provisioned by backend in cloud mode)
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode('PaintKing-Industrial-AES256-BiometricVaultKey-Haridwar-Vapi-2026'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  cachedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('PaintKing-Salt-9594591313'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedKey;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'employeeId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDBBiometricStorage implements IBiometricStorage {
  async saveEncryptedBiometrics(
    employeeId: string,
    descriptors: number[][],
    photoDataUrl?: string
  ): Promise<boolean> {
    try {
      const key = await getMasterKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const payload = JSON.stringify({ descriptors, photoDataUrl, savedAt: new Date().toISOString() });
      const enc = new TextEncoder();

      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(payload)
      );

      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({
          employeeId,
          iv: Array.from(iv),
          cipher: Array.from(new Uint8Array(cipherBuffer)),
          updatedAt: Date.now(),
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error('IndexedDB biometric encryption failed:', err);
      return false;
    }
  }

  async getDecryptedBiometrics(
    employeeId: string
  ): Promise<{ descriptors: number[][]; photoDataUrl?: string } | null> {
    try {
      const db = await openDB();
      const record = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(employeeId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!record || !record.cipher || !record.iv) return null;

      const key = await getMasterKey();
      const iv = new Uint8Array(record.iv);
      const cipher = new Uint8Array(record.cipher);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipher
      );

      const dec = new TextDecoder();
      const parsed = JSON.parse(dec.decode(decrypted));
      return {
        descriptors: parsed.descriptors || [],
        photoDataUrl: parsed.photoDataUrl,
      };
    } catch {
      return null;
    }
  }

  async deleteBiometrics(employeeId: string): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(employeeId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return false;
    }
  }

  async exportEncryptedArchive(): Promise<string> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const exportObj = {
          version: '1.0',
          exportTimestamp: new Date().toISOString(),
          issuer: 'PaintKing-Biometric-Vault',
          records: req.result || [],
        };
        resolve(JSON.stringify(exportObj, null, 2));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async importEncryptedArchive(jsonArchive: string): Promise<{ importedCount: number }> {
    try {
      const parsed = JSON.parse(jsonArchive);
      if (!parsed || !Array.isArray(parsed.records)) {
        throw new Error('Invalid PK biometric vault format');
      }

      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        let count = 0;
        for (const rec of parsed.records) {
          if (rec.employeeId && rec.cipher && rec.iv) {
            store.put(rec);
            count++;
          }
        }
        tx.oncomplete = () => resolve({ importedCount: count });
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error('Vault import error:', err);
      throw err;
    }
  }
}

// Global Storage Singleton instance
export const biometricVault = new IndexedDBBiometricStorage();

// Audit Trail Service
export function recordBiometricAudit(
  action: BiometricAuditLog['action'],
  employeeId: string,
  employeeName: string,
  actor: string,
  details: string
): void {
  try {
    const log: BiometricAuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-IN'),
      date: new Date().toISOString().split('T')[0],
      action,
      employeeId,
      employeeName,
      actor,
      details,
    };
    const logs: BiometricAuditLog[] = JSON.parse(localStorage.getItem(AUDIT_STORE_KEY) || '[]');
    localStorage.setItem(AUDIT_STORE_KEY, JSON.stringify([log, ...logs.slice(0, 99)]));
  } catch {
    // Audit write fail ignored
  }
}

export function getBiometricAuditLogs(): BiometricAuditLog[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_STORE_KEY) || '[]');
  } catch {
    return [];
  }
}
