import { z } from "zod";

export const marketSchema = z.object({
  id: z.string(),
  question: z.string(),
  category: z.enum(["CRYPTO", "TECH", "STOCKS", "POLITICS", "SPORTS", "SCIENCE"]),
  aiPrediction: z.number(), // 0-100
  confidence: z.number(), // 0-100
  suggests: z.enum(["YES", "NO"]),
  yesPrice: z.number(), // in cents
  noPrice: z.number(), // in cents
  volume: z.string(),
  endsDate: z.string(),
  isHot: z.boolean().optional(),
});

export type Market = z.infer<typeof marketSchema>;

export const MOCK_MARKETS: Market[] = [
  {
    id: "1",
    question: "Will Bitcoin reach $100,000 by end of 2025?",
    category: "CRYPTO",
    aiPrediction: 72,
    confidence: 22,
    suggests: "YES",
    yesPrice: 67,
    noPrice: 33,
    volume: "$2.4M",
    endsDate: "Dec 31, 2025",
    isHot: true
  },
  {
    id: "2",
    question: "Will Ethereum upgrade to ETH 3.0 in Q2 2025?",
    category: "CRYPTO",
    aiPrediction: 58,
    confidence: 8,
    suggests: "YES",
    yesPrice: 45,
    noPrice: 55,
    volume: "$1.8M",
    endsDate: "Jun 30, 2025"
  },
  {
    id: "3",
    question: "Will AI surpass human performance in coding by 2026?",
    category: "TECH",
    aiPrediction: 85,
    confidence: 35,
    suggests: "YES",
    yesPrice: 82,
    noPrice: 18,
    volume: "$3.2M",
    endsDate: "Dec 31, 2026",
    isHot: true
  },
  {
    id: "4",
    question: "Will Tesla stock double in value by end of 2025?",
    category: "STOCKS",
    aiPrediction: 42,
    confidence: 8,
    suggests: "NO",
    yesPrice: 38,
    noPrice: 62,
    volume: "$1.5M",
    endsDate: "Dec 31, 2025"
  },
  {
    id: "5",
    question: "Will a new cryptocurrency enter top 10 by market cap in 2025?",
    category: "CRYPTO",
    aiPrediction: 68,
    confidence: 18,
    suggests: "YES",
    yesPrice: 71,
    noPrice: 29,
    volume: "$2.1M",
    endsDate: "Dec 31, 2025"
  },
  {
    id: "6",
    question: "Will quantum computing break RSA encryption by 2027?",
    category: "TECH",
    aiPrediction: 19,
    confidence: 31,
    suggests: "NO",
    yesPrice: 23,
    noPrice: 77,
    volume: "$890K",
    endsDate: "Dec 31, 2027"
  }
];
