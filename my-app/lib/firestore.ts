import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CyclingResult, CreateResultInput, UpdateResultInput } from '@/types';

const COLLECTION_NAME = 'cycling_results';

export async function getAllResults(): Promise<CyclingResult[]> {
  const resultsRef = collection(db, COLLECTION_NAME);
  const q = query(resultsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      results: data.results,
      sourceType: data.sourceType,
      googleSheetUrl: data.googleSheetUrl,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
}

export async function getResultById(id: string): Promise<CyclingResult | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title,
    results: data.results,
    sourceType: data.sourceType,
    googleSheetUrl: data.googleSheetUrl,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function createResult(input: CreateResultInput): Promise<string> {
  const resultsRef = collection(db, COLLECTION_NAME);
  const now = Timestamp.now();

  const docRef = await addDoc(resultsRef, {
    title: input.title,
    results: input.results,
    sourceType: input.sourceType,
    googleSheetUrl: input.googleSheetUrl || null,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function updateResult(id: string, input: UpdateResultInput): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);

  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.results !== undefined) {
    updateData.results = input.results;
  }

  if (input.googleSheetUrl !== undefined) {
    updateData.googleSheetUrl = input.googleSheetUrl;
  }

  await updateDoc(docRef, updateData);
}

export async function deleteResult(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
