/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../firebase';
import { AcademicRecord, AcademicStatus, AcademicSubject, AcademicGrade, OperationType } from '../types';

const COLLECTION_NAME = 'records';

/**
 * Subscribes to the entire records path in real-time.
 * It filters and sorts locally to prevent query index requirements.
 */
export function subscribeToRecords(
  callback: (records: AcademicRecord[]) => void,
  onError: (error: Error) => void
) {
  const collectionRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const records: AcademicRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push({ id: docSnap.id, ...docSnap.data() } as AcademicRecord);
      });

      // Sort locally: newest date first, then newest creation time
      records.sort((a, b) => {
        const dateDiff = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      callback(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      onError(error as Error);
    }
  );
}

/**
 * Creates a new class tracking record.
 */
export async function createAcademicRecord(
  recordInput: Omit<AcademicRecord, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be logged in to create records.');
  }

  const newDocRef = doc(collection(db, COLLECTION_NAME));
  const recordId = newDocRef.id;

  const nowString = new Date().toISOString();
  const fullRecord: AcademicRecord = {
    ...recordInput,
    id: recordId,
    userId: user.uid,
    userEmail: user.email || 'anonymous@iepatiobonito.edu.co',
    createdAt: nowString,
    updatedAt: nowString,
  };

  try {
    await setDoc(newDocRef, fullRecord);
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${recordId}`);
    throw error;
  }
}

/**
 * Updates properties of an existing class record (like the status/estado).
 */
export async function updateAcademicRecord(
  id: string,
  updates: Partial<Omit<AcademicRecord, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const recordDocRef = doc(db, COLLECTION_NAME, id);
  const nowString = new Date().toISOString();

  const finalUpdates = {
    ...updates,
    updatedAt: nowString,
  };

  try {
    await updateDoc(recordDocRef, finalUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
}

/**
 * Deletes a class record.
 */
export async function deleteAcademicRecord(id: string): Promise<void> {
  const recordDocRef = doc(db, COLLECTION_NAME, id);

  try {
    await deleteDoc(recordDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
}
