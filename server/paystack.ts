import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface InitializeTransactionData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface VerifyTransactionData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  customer: {
    email: string;
    customer_code: string;
  };
  paid_at: string;
}

interface TransferRecipientData {
  recipient_code: string;
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
}

interface TransferData {
  reference: string;
  integration: number;
  domain: string;
  amount: number;
  currency: string;
  source: string;
  reason: string;
  recipient: string;
  status: string;
  transfer_code: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
  country: string;
  currency: string;
  type: string;
  active: boolean;
}

interface ResolveAccountData {
  account_number: string;
  account_name: string;
  bank_id: number;
}

async function paystackRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, any>
): Promise<PaystackResponse<T>> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Paystack request failed");
  }

  return response.json();
}

export async function initializeTransaction(
  email: string,
  amount: number,
  reference: string,
  callbackUrl?: string,
  metadata?: Record<string, any>
): Promise<InitializeTransactionData> {
  const response = await paystackRequest<InitializeTransactionData>(
    "/transaction/initialize",
    "POST",
    {
      email,
      amount: amount * 100,
      reference,
      callback_url: callbackUrl,
      metadata,
    }
  );

  return response.data;
}

export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionData> {
  const response = await paystackRequest<VerifyTransactionData>(
    `/transaction/verify/${reference}`
  );

  return response.data;
}

export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string
): Promise<TransferRecipientData> {
  const response = await paystackRequest<TransferRecipientData>(
    "/transferrecipient",
    "POST",
    {
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }
  );

  return response.data;
}

export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reference: string,
  reason?: string
): Promise<TransferData> {
  const response = await paystackRequest<TransferData>(
    "/transfer",
    "POST",
    {
      source: "balance",
      amount: amount * 100,
      recipient: recipientCode,
      reference,
      reason: reason || "Withdrawal",
    }
  );

  return response.data;
}

export async function listBanks(): Promise<Bank[]> {
  const response = await paystackRequest<Bank[]>(
    "/bank?country=nigeria&currency=NGN"
  );

  return response.data.filter((bank) => bank.active);
}

export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
): Promise<ResolveAccountData> {
  const response = await paystackRequest<ResolveAccountData>(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );

  return response.data;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

export function generateReference(prefix: string = "TXN"): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString("hex");
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

export interface WebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    customer?: {
      email: string;
    };
    [key: string]: any;
  };
}

export type WebhookEventType =
  | "charge.success"
  | "transfer.success"
  | "transfer.failed"
  | "transfer.reversed";
