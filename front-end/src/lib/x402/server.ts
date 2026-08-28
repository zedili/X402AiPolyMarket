import 'server-only';

import type { HTTPAdapter, HTTPRequestContext } from '@x402/core/server';
import {
  HTTPFacilitatorClient,
  getFacilitatorResponseError,
  withPrivateCacheControl,
  x402HTTPResourceServer,
  x402ResourceServer,
} from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { NextRequest, NextResponse } from 'next/server';

import {
  X402_NETWORK,
  X402_NETWORK_NAME,
  X402_PAY_TO,
  X402_PRICE,
  X402_PRICE_USDC,
} from './constants';

const facilitatorUrl =
  process.env.X402_FACILITATOR_URL ?? 'https://facilitator.payai.network';

const resourceServer = new x402ResourceServer(
  new HTTPFacilitatorClient({ url: facilitatorUrl, timeoutMs: 30_000 }),
).register(X402_NETWORK, new ExactEvmScheme());

const httpServer = new x402HTTPResourceServer(resourceServer, {
  'POST /api/analysis': {
    accepts: {
      scheme: 'exact',
      network: X402_NETWORK,
      price: X402_PRICE,
      payTo: X402_PAY_TO,
      maxTimeoutSeconds: 300,
    },
    resource: '/api/analysis',
    description: 'Generate one Signal402 prediction-market analysis report',
    mimeType: 'application/json',
    serviceName: 'Signal402',
    tags: ['prediction-markets', 'ai-analysis', 'arbitrum'],
    unpaidResponseBody: () => ({
      contentType: 'application/json',
      body: {
        error: 'Payment required',
        price: `${X402_PRICE_USDC} USDC`,
        network: X402_NETWORK_NAME,
        message: 'Connect a wallet and approve the x402 payment to generate this report.',
      },
    }),
    settlementFailedResponseBody: (_context, settlement) => ({
      contentType: 'application/json',
      body: {
        error: 'Payment settlement failed',
        reason: settlement.errorReason,
      },
    }),
  },
});

let initialized = false;
let initialization: Promise<void> | null = null;

async function initializePaymentServer() {
  if (initialized) return;
  initialization ??= httpServer.initialize();
  try {
    await initialization;
    initialized = true;
  } catch (error) {
    initialization = null;
    throw error;
  }
}

class NextRequestAdapter implements HTTPAdapter {
  constructor(private readonly request: NextRequest) {}

  getHeader(name: string) {
    return this.request.headers.get(name) ?? undefined;
  }

  getMethod() {
    return this.request.method;
  }

  getPath() {
    return this.request.nextUrl.pathname;
  }

  getUrl() {
    return this.request.url;
  }

  getAcceptHeader() {
    return this.request.headers.get('accept') ?? '';
  }

  getUserAgent() {
    return this.request.headers.get('user-agent') ?? '';
  }

  getQueryParams() {
    const params: Record<string, string | string[]> = {};
    this.request.nextUrl.searchParams.forEach((value, key) => {
      const existing = params[key];
      params[key] = existing
        ? Array.isArray(existing)
          ? [...existing, value]
          : [existing, value]
        : value;
    });
    return params;
  }

  getQueryParam(name: string) {
    const values = this.request.nextUrl.searchParams.getAll(name);
    if (values.length === 0) return undefined;
    return values.length === 1 ? values[0] : values;
  }
}

function createRequestContext(request: NextRequest): HTTPRequestContext {
  const adapter = new NextRequestAdapter(request);
  return {
    adapter,
    path: request.nextUrl.pathname,
    method: request.method,
    paymentHeader:
      adapter.getHeader('payment-signature') ?? adapter.getHeader('x-payment'),
  };
}

function paymentErrorResponse(response: {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  isHtml?: boolean;
}) {
  const headers = new Headers(response.headers);
  if (response.isHtml) {
    headers.set('Content-Type', 'text/html');
    return new NextResponse(String(response.body ?? ''), {
      status: response.status,
      headers,
    });
  }

  headers.set('Content-Type', 'application/json');
  return new NextResponse(JSON.stringify(response.body ?? {}), {
    status: response.status,
    headers,
  });
}

function paymentServiceError(error: unknown) {
  const facilitatorError = getFacilitatorResponseError(error);
  if (facilitatorError) {
    return NextResponse.json(
      { error: 'Payment facilitator is temporarily unavailable' },
      { status: 502 },
    );
  }
  console.error('x402 payment server error', error);
  return NextResponse.json({ error: 'Payment service failed' }, { status: 500 });
}

export async function handlePaidAnalysis(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
) {
  try {
    await initializePaymentServer();
  } catch (error) {
    return paymentServiceError(error);
  }

  const context = createRequestContext(request);
  let result: Awaited<ReturnType<typeof httpServer.processHTTPRequest>>;
  try {
    result = await httpServer.processHTTPRequest(context);
  } catch (error) {
    return paymentServiceError(error);
  }

  if (result.type === 'payment-error') {
    return paymentErrorResponse(result.response);
  }
  if (result.type === 'no-payment-required') {
    return handler(request);
  }

  let response: NextResponse;
  try {
    response = await handler(request);
  } catch (error) {
    await result.cancellationDispatcher.cancel({ reason: 'handler_threw', error });
    console.error('Paid analysis handler failed', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }

  if (response.status >= 400) {
    const canceled = await result.cancellationDispatcher.cancel({
      reason: 'handler_failed',
      responseStatus: response.status,
    });
    const failureHeaders = httpServer.createFailurePathSettlementHeaders(
      canceled,
      result.beforeHandlerSettlement,
      result.paymentPayload,
      response.headers.get('Cache-Control'),
    );
    if (failureHeaders) {
      Object.entries(failureHeaders).forEach(([key, value]) =>
        response.headers.set(key, value),
      );
    }
    return response;
  }

  try {
    const responseBody = Buffer.from(await response.clone().arrayBuffer());
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const settlement = await httpServer.processSettlement(
      result.paymentPayload,
      result.paymentRequirements,
      result.declaredExtensions,
      { request: context, responseBody, responseHeaders },
      undefined,
      result.beforeHandlerSettlement,
    );

    if (!settlement.success) {
      return paymentErrorResponse(settlement.response);
    }

    Object.entries(settlement.headers).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    response.headers.set(
      'Cache-Control',
      withPrivateCacheControl(response.headers.get('Cache-Control')),
    );
    return response;
  } catch (error) {
    return paymentServiceError(error);
  }
}
