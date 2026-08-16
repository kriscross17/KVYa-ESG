import { useCallback, useState } from 'react';
import Tesseract from 'tesseract.js';

const BUILDING_PATTERNS = {
  electricityConsumptionKwh: [
    /(?:electricity|power|energy|units?|kwh|consumption)[\s:]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:units?|kwh|kWh)/i,
  ],
  waterUsageKl: [
    /(?:water|usage|consumption|litres?|liters?|kl)[\s:]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:kl|kilolitre|kilolitres?|litres?)/i,
  ],
  wasteGeneratedKg: [
    /(?:waste|garbage|refuse)[\s:]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:kg|kilogram)/i,
  ],
  renewableEnergyKwh: [
    /(?:renewable|solar|green energy)[\s:]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:kwh).*?(?:solar|renewable)/i,
  ],
  fuelConsumptionLitres: [
    /(?:fuel|diesel|petrol)[\s:]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:litres?|liters?|l\b)/i,
  ],
  areaSqFt: [
    /(?:area|built[- ]?up|floor)[\s:]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:sq\.?\s*ft|square feet)/i,
  ],
  greenCoverSqFt: [
    /(?:green cover|garden|plantation)[\s:]*([\d,]+\.?\d*)/i,
  ],
};

const OPERATIONAL_PATTERNS = {
  totalEmployees: [
    /(?:total employees?|staff strength|headcount)[\s:]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:employees?|staff)/i,
  ],
  femaleEmployees: [
    /(?:female employees?|women staff)[\s:]*([\d,]+\.?\d*)/i,
  ],
  digitalTransactionsPercent: [
    /(?:digital transactions?|digitalization)[\s:]*([\d,]+\.?\d*)\s*%?/i,
    /([\d,]+\.?\d*)\s*%\s*(?:digital)/i,
  ],
  energyUsageKwh: [
    /(?:operational energy|it energy|energy usage)[\s:]*([\d,]+\.?\d*)/i,
  ],
  trainingHoursPerEmployee: [
    /(?:training hours?)[\s:]*([\d,]+\.?\d*)/i,
  ],
  communityProgramsCount: [
    /(?:community programs?|outreach)[\s:]*([\d,]+\.?\d*)/i,
  ],
  grievancesResolved: [
    /(?:grievances? resolved|resolved grievances?)[\s:]*([\d,]+\.?\d*)/i,
  ],
  grievancesTotal: [
    /(?:total grievances?|grievances? received)[\s:]*([\d,]+\.?\d*)/i,
  ],
};

function extractNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!Number.isNaN(num)) return num;
    }
  }
  return null;
}

export function parseOcrText(text, fieldPatterns) {
  const filled = {};
  const filledFields = [];

  Object.entries(fieldPatterns).forEach(([field, patterns]) => {
    const value = extractNumber(text, patterns);
    if (value !== null) {
      filled[field] = value;
      filledFields.push(field);
    }
  });

  return { filled, filledFields };
}

export function useOcrExtraction(fieldPatterns) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [filledFields, setFilledFields] = useState([]);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(null);

  const reset = useCallback(() => {
    setProgress(0);
    setRawText('');
    setFilledFields([]);
    setError(null);
    setConfidence(null);
  }, []);

  const processImage = useCallback(async (file) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setConfidence(null);
    setRawText('');
    setFilledFields([]);

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;
      const confidenceScore = Number.isFinite(result.data.confidence) ? Math.round(result.data.confidence) : null;
      setConfidence(confidenceScore);
      setRawText(text);

      const { filled, filledFields: fields } = parseOcrText(text, fieldPatterns);
      setFilledFields(fields);

      return { text, filled, filledFields: fields, confidence: confidenceScore };
    } catch (err) {
      const message = err?.message || 'Failed to read the document. Please try again or enter data manually.';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [fieldPatterns]);

  return {
    isProcessing,
    progress,
    rawText,
    filledFields,
    error,
    confidence,
    processImage,
    reset,
  };
}

export { BUILDING_PATTERNS, OPERATIONAL_PATTERNS };
