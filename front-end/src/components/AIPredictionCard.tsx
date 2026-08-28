'use client';

import { useEffect, useState } from 'react';
import { x402Client } from '@x402/core/client';
import { decodePaymentResponseHeader } from '@x402/core/http';
import type { SettleResponse } from '@x402/core/types';
import type { ClientEvmSigner } from '@x402/evm';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment } from '@x402/fetch';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Loader2,
  Scale,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WalletButton } from '@/components/WalletButton';
import type { AIInsightReport } from '@/lib/api/types';
import {
  X402_CHAIN_ID,
  X402_NETWORK,
  X402_NETWORK_NAME,
  X402_PAY_TO,
  X402_PRICE_USDC,
} from '@/lib/x402/constants';
import { useWallet } from '@/providers/wallet-provider';

interface AIPredictionCardProps {
  marketId: number;
}

export function AIPredictionCard({ marketId }: AIPredictionCardProps) {
  const [report, setReport] = useState<AIInsightReport | null>(null);
  const [settlement, setSettlement] = useState<SettleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<
    'checking' | 'ready' | 'unavailable'
  >('checking');
  const {
    address,
    chainId,
    isConnected,
    switchToArbitrumSepolia,
    signTypedData,
  } = useWallet();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/analysis/status', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('AI readiness check failed');
        return (await response.json()) as { ready?: boolean };
      })
      .then(({ ready }) => setServiceStatus(ready ? 'ready' : 'unavailable'))
      .catch((statusError) => {
        if (statusError instanceof Error && statusError.name === 'AbortError') {
          return;
        }
        setServiceStatus('unavailable');
      });
    return () => controller.abort();
  }, []);

  const requestReport = async () => {
    if (serviceStatus !== 'ready') {
      setError('AI service is unavailable. No payment was requested.');
      return;
    }
    if (!isConnected) {
      setError('Connect an EVM wallet before purchasing a report.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (chainId !== X402_CHAIN_ID) {
        await switchToArbitrumSepolia();
      }

      if (!address) {
        throw new Error('Wallet is not ready on Arbitrum Sepolia.');
      }

      const signer: ClientEvmSigner = {
        address,
        signTypedData,
      };
      const paymentClient = new x402Client().register(
        X402_NETWORK,
        new ExactEvmScheme(signer),
      );
      const paidFetch = wrapFetchWithPayment(globalThis.fetch, paymentClient);

      const response = await paidFetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId }),
      });
      const body = (await response.json()) as AIInsightReport & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error ?? `Request failed (${response.status})`);

      const paymentResponse = response.headers.get('payment-response');
      if (paymentResponse) {
        setSettlement(decodePaymentResponseHeader(paymentResponse));
      }
      setReport(body);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Failed to generate report';
      setError(
        /reject|denied|cancelled|canceled/i.test(message)
          ? 'Wallet request was rejected. No new payment was sent.'
          : message,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Signal402 AI report
          </CardTitle>
          <CardDescription>
            A bounded analysis of the current market snapshot, resolution rules,
            liquidity, and uncertainty. It does not place trades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/35 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">One AI report</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {X402_NETWORK_NAME} · testnet USDC
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{X402_PRICE_USDC} USDC</div>
                <div className="text-xs text-muted-foreground">per request</div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                You sign an EIP-3009 authorization. The facilitator pays gas,
                and Signal402 settles only after the model returns successfully.
              </span>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {serviceStatus === 'unavailable' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                AI reports are temporarily unavailable. Payment is disabled.
              </AlertDescription>
            </Alert>
          )}
          {serviceStatus === 'ready' && isConnected ? (
            <Button onClick={requestReport} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WalletCards className="mr-2 h-4 w-4" />
              )}
              {loading
                ? 'Confirm in wallet, then wait…'
                : chainId === X402_CHAIN_ID
                  ? `Buy report · ${X402_PRICE_USDC} USDC`
                  : `Switch network & buy · ${X402_PRICE_USDC} USDC`}
            </Button>
          ) : serviceStatus === 'ready' ? (
            <WalletButton />
          ) : (
            <Button disabled>
              {serviceStatus === 'checking' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {serviceStatus === 'checking'
                ? 'Checking AI availability…'
                : 'AI reports unavailable'}
            </Button>
          )}
          <p className="break-all text-xs text-muted-foreground">
            Recipient: {X402_PAY_TO}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Signal402 AI report
          </CardTitle>
          <CardDescription>
            Generated {new Date(report.generated_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              icon={Gauge}
              label="Market implied"
              value={`${report.market_probability.toFixed(1)}%`}
            />
            <Metric
              icon={Sparkles}
              label="Independent estimate"
              value={`${report.independent_probability.toFixed(1)}%`}
            />
            <Metric
              icon={Scale}
              label="Model confidence"
              value={`${report.confidence.toFixed(0)}%`}
            />
          </div>

          <p className="leading-7">{report.summary}</p>

          <ReportList
            icon={CheckCircle2}
            title="Snapshot evidence"
            items={report.evidence}
            className="text-emerald-500"
          />
          <ReportList
            icon={Scale}
            title="Counterarguments"
            items={report.counterarguments}
            className="text-blue-500"
          />
          <ReportList
            icon={AlertTriangle}
            title="Risks and failure modes"
            items={report.risks}
            className="text-amber-500"
          />
          {report.assumptions.length > 0 && (
            <ReportList
              icon={Gauge}
              title="Assumptions"
              items={report.assumptions}
              className="text-purple-500"
            />
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{report.disclaimer}</AlertDescription>
          </Alert>

          {settlement?.success && settlement.transaction && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertDescription>
                Payment settled on {X402_NETWORK_NAME}.{' '}
                <a
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
                  href={`https://sepolia.arbiscan.io/tx/${settlement.transaction}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction
                  <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            onClick={requestReport}
            disabled={loading || serviceStatus !== 'ready'}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading
              ? 'Confirm in wallet, then wait…'
              : `Buy fresh report · ${X402_PRICE_USDC} USDC`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ReportList({
  icon: Icon,
  title,
  items,
  className,
}: {
  icon: typeof Gauge;
  title: string;
  items: string[];
  className: string;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <Icon className={`h-4 w-4 ${className}`} />
        {title}
      </h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span aria-hidden>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
