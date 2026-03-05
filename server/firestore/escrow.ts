import { getFirestoreDb } from "../firebase-admin";
import { EscrowRecord, Dispute, COLLECTIONS } from "./collections";
import { debitWallet, releaseEscrow as releaseEscrowBalance, refundEscrow as refundEscrowBalance } from "./wallets";

const AUTO_RELEASE_HOURS = 48;

export async function createEscrowRecord(
  requestId: string,
  requesterId: string,
  helperId: string,
  amount: number,
  platformFee: number
): Promise<EscrowRecord> {
  const db = getFirestoreDb();
  const now = new Date();
  const autoReleaseAt = new Date(now.getTime() + AUTO_RELEASE_HOURS * 60 * 60 * 1000);
  
  await debitWallet(
    requesterId,
    amount,
    'escrow_lock',
    `escrow_lock_${requestId}`,
    `Escrow locked for task ${requestId}`
  );
  
  const escrowRecord: EscrowRecord = {
    requestId,
    requesterId,
    helperId,
    amount,
    platformFee,
    status: 'locked',
    lockedAt: now,
    releasedAt: null,
    disputeId: null,
    autoReleaseAt,
  };
  
  const docRef = await db.collection(COLLECTIONS.ESCROW_RECORDS).add(escrowRecord);
  return { ...escrowRecord, id: docRef.id };
}

export async function getEscrowRecordById(id: string): Promise<EscrowRecord | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.ESCROW_RECORDS).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as EscrowRecord;
}

export async function getEscrowByRequestId(requestId: string): Promise<EscrowRecord | null> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.ESCROW_RECORDS)
    .where('requestId', '==', requestId)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as EscrowRecord;
}

export async function releaseEscrow(escrowId: string): Promise<void> {
  const db = getFirestoreDb();
  const escrow = await getEscrowRecordById(escrowId);
  
  if (!escrow) {
    throw new Error("Escrow record not found");
  }
  
  if (escrow.status !== 'locked') {
    throw new Error("Escrow is not in locked state");
  }
  
  await releaseEscrowBalance(
    escrow.requesterId,
    escrow.helperId,
    escrow.amount,
    escrow.platformFee,
    escrowId,
    escrow.requestId
  );
  
  await db.collection(COLLECTIONS.ESCROW_RECORDS).doc(escrowId).update({
    status: 'released',
    releasedAt: new Date(),
  });
}

export async function refundEscrow(escrowId: string): Promise<void> {
  const db = getFirestoreDb();
  const escrow = await getEscrowRecordById(escrowId);
  
  if (!escrow) {
    throw new Error("Escrow record not found");
  }
  
  if (escrow.status !== 'locked') {
    throw new Error("Escrow is not in locked state");
  }
  
  await refundEscrowBalance(
    escrow.requesterId,
    escrow.amount,
    escrowId,
    escrow.requestId
  );
  
  await db.collection(COLLECTIONS.ESCROW_RECORDS).doc(escrowId).update({
    status: 'refunded',
    releasedAt: new Date(),
  });
}

export async function createDispute(
  data: Omit<Dispute, 'id' | 'createdAt' | 'resolvedAt' | 'status' | 'resolution' | 'resolvedBy'>
): Promise<Dispute> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const dispute: Dispute = {
    ...data,
    status: 'open',
    resolution: null,
    resolvedBy: null,
    createdAt: now,
    resolvedAt: null,
  };
  
  const docRef = await db.collection(COLLECTIONS.DISPUTES).add(dispute);
  
  await db.collection(COLLECTIONS.ESCROW_RECORDS).doc(data.escrowId).update({
    status: 'disputed',
    disputeId: docRef.id,
  });
  
  return { ...dispute, id: docRef.id };
}

export async function getDisputeById(id: string): Promise<Dispute | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.DISPUTES).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as Dispute;
}

export async function getOpenDisputes(): Promise<Dispute[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.DISPUTES)
    .where('status', 'in', ['open', 'under_review'])
    .orderBy('createdAt', 'asc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute));
}

export async function resolveDispute(
  disputeId: string,
  resolution: 'requester' | 'helper',
  resolvedBy: string,
  resolutionNote: string
): Promise<void> {
  const db = getFirestoreDb();
  const dispute = await getDisputeById(disputeId);
  
  if (!dispute) {
    throw new Error("Dispute not found");
  }
  
  const escrow = await getEscrowRecordById(dispute.escrowId);
  if (!escrow) {
    throw new Error("Escrow record not found");
  }
  
  if (resolution === 'helper') {
    await releaseEscrow(dispute.escrowId);
  } else {
    await refundEscrow(dispute.escrowId);
  }
  
  await db.collection(COLLECTIONS.DISPUTES).doc(disputeId).update({
    status: resolution === 'helper' ? 'resolved_helper' : 'resolved_requester',
    resolution: resolutionNote,
    resolvedBy,
    resolvedAt: new Date(),
  });
}

export async function getEscrowsForAutoRelease(): Promise<EscrowRecord[]> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const snapshot = await db.collection(COLLECTIONS.ESCROW_RECORDS)
    .where('status', '==', 'locked')
    .where('autoReleaseAt', '<=', now)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowRecord));
}
