export interface ScoringInput {
  eligibleVn: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  cardRequired: boolean;
  kycRequired: boolean;
  frictionLevel: 'low' | 'medium' | 'high' | 'unknown';
  valueUsd: number | null;
  expiry: string | null;  // YYYY-MM-DD
  category: string;
  isDeal: boolean;
}

export interface ScoringResult {
  score: number;
  breakdown: Record<string, number>;
  explanation: string[];
}

export const WEIGHTS = {
  ELIGIBLE_VN: 25,
  RISK: {
    LOW: 20,
    MEDIUM: 5,
    HIGH: -25,
    UNKNOWN: -10
  },
  NO_CARD: 15,
  NO_KYC: 10,
  FRICTION: {
    LOW: 10,
    MEDIUM: 0,
    HIGH: -10,
    UNKNOWN: 0
  },
  VALUE: {
    OVER_100: 15,
    BETWEEN_50_100: 10,
    BETWEEN_10_50: 5,
    UNDER_10: 0
  },
  EXPIRY: {
    OVER_14_DAYS: 5,
    BETWEEN_7_14_DAYS: 2,
    EXPIRED: -50
  },
  CATEGORY: {
    AI_TOOL: 5,
    CLOUD: 3
  },
  NOT_A_DEAL: -100
} as const;

export function scoreFreebie(input: ScoringInput): ScoringResult {
  let totalScore = 0;
  const breakdown: Record<string, number> = {};
  const explanation: string[] = [];

  const addScore = (ruleName: string, points: number, msg: string) => {
    if (points === 0) return;
    totalScore += points;
    breakdown[ruleName] = points;
    explanation.push(msg);
  };

  // 0. Base Check
  if (!input.isDeal) {
    addScore('isDeal', WEIGHTS.NOT_A_DEAL, 'Không phải Deal/Ưu đãi hợp lệ (-100)');
  }

  // 1. VN Eligibility
  if (input.eligibleVn) {
    addScore('eligibleVn', WEIGHTS.ELIGIBLE_VN, 'Hỗ trợ người dùng tại Việt Nam (+25)');
  }

  // 2. Risk Level
  switch (input.riskLevel) {
    case 'low': addScore('riskLevel', WEIGHTS.RISK.LOW, 'Mức độ rủi ro thấp (+20)'); break;
    case 'medium': addScore('riskLevel', WEIGHTS.RISK.MEDIUM, 'Mức độ rủi ro trung bình (+5)'); break;
    case 'high': addScore('riskLevel', WEIGHTS.RISK.HIGH, 'Mức độ rủi ro cao (-25)'); break;
    case 'unknown': addScore('riskLevel', WEIGHTS.RISK.UNKNOWN, 'Mức độ rủi ro không xác định (-10)'); break;
  }

  // 3. Card Required
  if (!input.cardRequired) {
    addScore('cardRequired', WEIGHTS.NO_CARD, 'Không yêu cầu thẻ tín dụng (+15)');
  }

  // 4. KYC Required
  if (!input.kycRequired) {
    addScore('kycRequired', WEIGHTS.NO_KYC, 'Không yêu cầu xác minh KYC (+10)');
  }

  // 5. Friction Level
  switch (input.frictionLevel) {
    case 'low': addScore('frictionLevel', WEIGHTS.FRICTION.LOW, 'Ma sát thấp, dễ tiếp cận (+10)'); break;
    case 'medium': /* 0 points */ break;
    case 'high': addScore('frictionLevel', WEIGHTS.FRICTION.HIGH, 'Thủ tục phức tạp (-10)'); break;
  }

  // 6. Value USD
  if (input.valueUsd !== null) {
    if (input.valueUsd > 100) {
      addScore('valueUsd', WEIGHTS.VALUE.OVER_100, 'Giá trị vượt > $100 (+15)');
    } else if (input.valueUsd >= 50) {
      addScore('valueUsd', WEIGHTS.VALUE.BETWEEN_50_100, 'Giá trị dao động $50 - $100 (+10)');
    } else if (input.valueUsd >= 10) {
      addScore('valueUsd', WEIGHTS.VALUE.BETWEEN_10_50, 'Giá trị dao động $10 - $50 (+5)');
    }
  }

  // 7. Expiry
  if (input.expiry) {
    const expiryDate = new Date(input.expiry);
    const now = new Date();
    // Neutralize time to compare pure dates if needed, but simple ms diff is fine
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      addScore('expiry', WEIGHTS.EXPIRY.EXPIRED, 'Deal đã hết hạn (-50)');
    } else if (diffDays > 14) {
      addScore('expiry', WEIGHTS.EXPIRY.OVER_14_DAYS, 'Thời gian còn lại > 14 ngày (+5)');
    } else if (diffDays >= 7) {
      addScore('expiry', WEIGHTS.EXPIRY.BETWEEN_7_14_DAYS, 'Thời gian còn lại 7-14 ngày (+2)');
    }
  }

  // 8. Category
  const cat = input.category.toLowerCase();
  if (cat === 'ai-tool') {
    addScore('category', WEIGHTS.CATEGORY.AI_TOOL, "Cộng điểm danh mục AI Tools ưu tiên (+5)");
  } else if (cat === 'cloud') {
    addScore('category', WEIGHTS.CATEGORY.CLOUD, "Cộng điểm danh mục Cloud ưu tiên (+3)");
  }

  // Clamp 0 - 100
  const finalScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: finalScore,
    breakdown,
    explanation
  };
}
