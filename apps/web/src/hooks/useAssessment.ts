import { useState, useCallback } from "react";
import { assessmentApi } from "@/lib/api";

interface RiasecResult {
  R: number; I: number; A: number; S: number; E: number; C: number;
  top3: string; topCode: string; mbtiCode?: string;
}
interface CareerMatch {
  rank: number; name: string; niche: string; pct: number; riasec: string; industry?: string;
}

interface AssessmentResult {
  assessment: { id: string };
  riasecResult: RiasecResult;
  careerResult: CareerMatch[];
  vocationalCareerResult?: CareerMatch[] | null;
  track: 'university' | 'vocational';
}

export function useAssessment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (
    answers: { questionId: string; answer: number | string }[],
    track?: 'university' | 'vocational',
    profile?: Record<string, string>,
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await assessmentApi.submit(answers, track, profile);
      setResult(data);
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại";
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      return await assessmentApi.list();
    } catch {
      return [];
    }
  }, []);

  return { isSubmitting, result, error, submit, fetchList };
}
