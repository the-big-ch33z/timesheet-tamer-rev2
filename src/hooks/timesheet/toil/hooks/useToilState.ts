
import { useState, useCallback } from 'react';
import { TOILSummary } from '@/types/toil';

export interface UseToilStateProps {
  userId: string;
  monthYear: string;
  isTestMode?: boolean;
  testSummary?: TOILSummary | null;
  testLoading?: boolean;
}

export interface UseToilStateResult {
  toilSummary: TOILSummary | null;
  setToilSummary: (summary: TOILSummary | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isCalculating: boolean;
  setIsCalculating: (calculating: boolean) => void;
}

/**
 * Hook for managing TOIL state
 */
export function useToilState({
  userId,
  monthYear,
  isTestMode = false,
  testSummary,
  testLoading = false
}: UseToilStateProps): UseToilStateResult {
  const [toilSummary, setToilSummary] = useState<TOILSummary | null>(
    isTestMode ? testSummary || null : null
  );
  const [isLoading, setIsLoading] = useState(!isTestMode && !testLoading);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateToilSummary = useCallback((summary: TOILSummary | null) => {
    if (!isTestMode) {
      setToilSummary(summary);
    }
  }, [isTestMode]);

  const updateIsLoading = useCallback((loading: boolean) => {
    if (!isTestMode) {
      setIsLoading(loading);
    }
  }, [isTestMode]);

  const updateError = useCallback((err: string | null) => {
    if (!isTestMode) {
      setError(err);
    }
  }, [isTestMode]);

  const updateIsCalculating = useCallback((calculating: boolean) => {
    if (!isTestMode) {
      setIsCalculating(calculating);
    }
  }, [isTestMode]);

  return {
    toilSummary,
    setToilSummary: updateToilSummary,
    isLoading,
    setIsLoading: updateIsLoading,
    error,
    setError: updateError,
    isCalculating,
    setIsCalculating: updateIsCalculating
  };
}
