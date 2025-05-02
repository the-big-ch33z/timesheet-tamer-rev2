
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ToilSummary from '@/components/toil/ToilSummary';
import { TOILSummary } from '@/types/toil';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILSummaryCard');

interface TOILSummaryCardProps {
  summary: TOILSummary | null;
  loading?: boolean;
  onRefresh?: () => void;
  monthName?: string;
}

const TOILSummaryCard: React.FC<TOILSummaryCardProps> = ({ 
  summary, 
  loading = false,
  onRefresh,
  monthName
}) => {
  // Debug the props when they change
  React.useEffect(() => {
    logger.debug('TOILSummaryCard props:', { 
      hasSummary: !!summary, 
      loading, 
      monthName,
      summaryData: summary
    });
  }, [summary, loading, monthName]);
  
  return (
    <Card className="bg-gradient-to-br from-white via-purple-50 to-purple-100 shadow-md rounded-xl w-full">
      <CardHeader className="flex flex-row justify-between items-center pb-2">
        <CardTitle className="text-lg font-semibold text-purple-600">
          {monthName ? `${monthName} TOIL Summary` : 'TOIL Summary'}
        </CardTitle>
        
        {onRefresh && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw 
                    className={`h-4 w-4 ${loading ? 'animate-spin text-purple-400' : 'text-purple-500'}`} 
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Refresh TOIL data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ) : (
          <ToilSummary 
            summary={summary || { 
              userId: '', 
              monthYear: monthName || '', 
              accrued: 0, 
              used: 0, 
              remaining: 0 
            }} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TOILSummaryCard;
