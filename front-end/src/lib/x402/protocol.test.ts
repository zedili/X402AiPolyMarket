import type {
  HTTPAdapter,
  HTTPRequestContext,
  FacilitatorClient,
} from '@x402/core/server';
import {
  x402HTTPResourceServer,
  x402ResourceServer,
} from '@x402/core/server';
import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
} from '@x402/core/http';
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  SupportedResponse,
  VerifyResponse,
} from '@x402/core/types';
import { x402Client } from '@x402/core/client';
import { ExactEvmScheme as ExactEvmClientScheme } from '@x402/evm/exact/client';
import { ExactEvmScheme as ExactEvmServerScheme } from '@x402/evm/exact/server';
import { wrapFetchWithPayment } from '@x402/fetch';
import { privateKeyToAccount } from 'viem/accounts';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  X402_NETWORK,
  X402_PAY_TO,
  X402_PRICE,
  X402_USDC_ADDRESS,
} from './constants';

const TEST_TRANSACTION = `0x${'ab'.repeat(32)}`;

function payerFrom(payload: PaymentPayload) {
  const authorization = payload.payload.authorization;
  if (
    typeof authorization === 'object' &&
    authorization !== null &&
    'from' in authorization &&
    typeof authorization.from === 'string'
  ) {
    return authorization.from;
  }
  throw new Error('Expected an EIP-3009 authorization payer');
}

class MemoryFacilitator implements FacilitatorClient {
  verifyCalls: Array<{
    payload: PaymentPayload;
    requirements: PaymentRequirements;
  }> = [];

  settleCalls: Array<{
    payload: PaymentPayload;
    requirements: PaymentRequirements;
  }> = [];

  async getSupported(): Promise<SupportedResponse> {
    return {
      kinds: [{ x402Version: 2, scheme: 'exact', network: X402_NETWORK }],
      extensions: [],
      signers: { 'eip155:*': [X402_PAY_TO] },
    };
  }

  async verify(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<VerifyResponse> {
    this.verifyCalls.push({ payload, requirements });
    return {
      isValid: true,
      payer: payerFrom(payload),
    };
  }

  async settle(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<SettleResponse> {
    this.settleCalls.push({ payload, requirements });
    return {
      success: true,
      payer: payerFrom(payload),
      transaction: TEST_TRANSACTION,
      network: requirements.network,
      amount: requirements.amount,
    };
  }
}

class RequestAdapter implements HTTPAdapter {
  constructor(private readonly request: Request) {}

  getHeader(name: string) {
    return this.request.headers.get(name) ?? undefined;
  }

  getMethod() {
    return this.request.method;
  }

  getPath() {
    return new URL(this.request.url).pathname;
  }

  getUrl() {
    return this.request.url;
  }

  getAcceptHeader() {
    return this.request.headers.get('accept') ?? '';
  }

  getUserAgent() {
    return this.request.headers.get('user-agent') ?? 'vitest';
  }
}

function requestContext(request: Request): HTTPRequestContext {
  const adapter = new RequestAdapter(request);
  return {
    adapter,
    path: adapter.getPath(),
    method: adapter.getMethod(),
    paymentHeader:
      adapter.getHeader('payment-signature') ?? adapter.getHeader('x-payment'),
  };
}

function instructionResponse(instructions: {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}) {
  return new Response(JSON.stringify(instructions.body ?? {}), {
    status: instructions.status,
    headers: instructions.headers,
  });
}

describe('Signal402 x402 protocol flow', () => {
  let facilitator: MemoryFacilitator;
  let httpServer: x402HTTPResourceServer;
  let resourceFetch: typeof globalThis.fetch;
  let requestCount: number;

  beforeEach(async () => {
    facilitator = new MemoryFacilitator();
    const server = new x402ResourceServer(facilitator).register(
      X402_NETWORK,
      new ExactEvmServerScheme(),
    );
    httpServer = new x402HTTPResourceServer(server, {
      'POST /api/analysis': {
        accepts: {
          scheme: 'exact',
          network: X402_NETWORK,
          price: X402_PRICE,
          payTo: X402_PAY_TO,
        },
        resource: '/api/analysis',
        description: 'Test Signal402 report',
        mimeType: 'application/json',
      },
    });
    await httpServer.initialize();
    requestCount = 0;

    resourceFetch = async (input, init) => {
      requestCount += 1;
      const request = new Request(input, init);
      const context = requestContext(request);
      const result = await httpServer.processHTTPRequest(context);

      if (result.type === 'payment-error') {
        return instructionResponse(result.response);
      }
      if (result.type !== 'payment-verified') {
        throw new Error('Expected the test route to require payment');
      }

      const responseBody = Buffer.from(JSON.stringify({ report: 'generated' }));
      const settlement = await httpServer.processSettlement(
        result.paymentPayload,
        result.paymentRequirements,
        result.declaredExtensions,
        {
          request: context,
          responseBody,
          responseHeaders: { 'content-type': 'application/json' },
        },
      );
      if (!settlement.success) return instructionResponse(settlement.response);

      return new Response(responseBody, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          ...settlement.headers,
        },
      });
    };
  });

  it('advertises an exact 0.01 USDC payment on Arbitrum Sepolia', async () => {
    const response = await resourceFetch('https://signal402.test/api/analysis', {
      method: 'POST',
      body: JSON.stringify({ marketId: 1 }),
    });

    expect(response.status).toBe(402);
    const header = response.headers.get('payment-required');
    expect(header).toBeTruthy();
    const required = decodePaymentRequiredHeader(header!);
    expect(required.x402Version).toBe(2);
    expect(required.accepts).toHaveLength(1);
    expect(required.accepts[0]).toMatchObject({
      scheme: 'exact',
      network: X402_NETWORK,
      amount: '10000',
      asset: X402_USDC_ADDRESS,
      payTo: X402_PAY_TO,
      extra: { name: 'USD Coin', version: '2' },
    });
    expect(facilitator.verifyCalls).toHaveLength(0);
    expect(facilitator.settleCalls).toHaveLength(0);
  });

  it('uses the official client to sign, retry, and expose a settlement receipt', async () => {
    const buyer = privateKeyToAccount(`0x${'11'.repeat(32)}`);
    const client = new x402Client().register(
      X402_NETWORK,
      new ExactEvmClientScheme(buyer),
    );
    const paidFetch = wrapFetchWithPayment(resourceFetch, client);

    const response = await paidFetch('https://signal402.test/api/analysis', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ marketId: 1 }),
    });

    expect(response.status).toBe(200);
    expect(requestCount).toBe(2);
    expect(facilitator.verifyCalls).toHaveLength(1);
    expect(facilitator.settleCalls).toHaveLength(1);
    expect(facilitator.verifyCalls[0].requirements).toMatchObject({
      network: X402_NETWORK,
      amount: '10000',
      payTo: X402_PAY_TO,
    });
    expect(facilitator.verifyCalls[0].payload.payload.signature).toMatch(
      /^0x[0-9a-f]+$/i,
    );

    const receiptHeader = response.headers.get('payment-response');
    expect(receiptHeader).toBeTruthy();
    expect(decodePaymentResponseHeader(receiptHeader!)).toMatchObject({
      success: true,
      transaction: TEST_TRANSACTION,
      network: X402_NETWORK,
      amount: '10000',
      payer: buyer.address,
    });
  });
});
