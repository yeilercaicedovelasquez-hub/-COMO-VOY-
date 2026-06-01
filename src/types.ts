/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AcademicGrade = '6' | '7' | '11';
export type AcademicSubject = 'Español' | 'Sociales' | 'Filosofía';
export type AcademicStatus = 'Excelente' | 'Bueno' | 'En proceso' | 'Requiere apoyo';

export interface AcademicRecord {
  id: string;
  grado: AcademicGrade;
  asig: AcademicSubject;
  fecha: string; // YYYY-MM-DD
  periodo: '1' | '2' | '3' | '4';
  tema: string;
  actividades: string;
  tareas: string;
  logros: string;
  dificultades: string;
  observaciones: string;
  estado: AcademicStatus;
  userId: string;
  userEmail: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
