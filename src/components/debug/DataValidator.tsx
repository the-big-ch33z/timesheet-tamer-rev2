
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createTimeLogger } from '@/utils/time/errors';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const logger = createTimeLogger('DataValidator');

type ValidationResult = {
  valid: boolean;
  name: string;
  message: string;
  details?: any;
  severity: 'error' | 'warning' | 'info';
};

type ValidatorFunction = () => ValidationResult;

interface DataValidatorProps {
  title?: string;
  moduleName: string;
  validators: ValidatorFunction[];
  onFix?: () => Promise<void>;
}

export const DataValidator: React.FC<DataValidatorProps> = ({
  title = 'Data Validator',
  moduleName,
  validators,
  onFix
}) => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [hasWarnings, setHasWarnings] = useState(false);
  
  // Run validation
  const runValidation = async () => {
    setIsValidating(true);
    
    try {
      logger.debug(`Running validation for ${moduleName}`);
      const newResults: ValidationResult[] = [];
      
      // Run all validators
      for (const validator of validators) {
        try {
          const result = validator();
          newResults.push(result);
        } catch (error) {
          logger.error('Validator function failed:', error);
          newResults.push({
            valid: false,
            name: 'Validator Error',
            message: `A validator failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error'
          });
        }
      }
      
      setResults(newResults);
      
      // Check for errors and warnings
      const errors = newResults.filter(r => !r.valid && r.severity === 'error');
      const warnings = newResults.filter(r => !r.valid && r.severity === 'warning');
      
      setHasErrors(errors.length > 0);
      setHasWarnings(warnings.length > 0);
      
      logger.debug(`Validation complete: ${errors.length} errors, ${warnings.length} warnings`);
    } catch (error) {
      logger.error('Error during validation:', error);
    } finally {
      setIsValidating(false);
    }
  };
  
  // Run fix
  const runFix = async () => {
    if (!onFix) return;
    
    setIsFixing(true);
    
    try {
      logger.debug(`Running fix for ${moduleName}`);
      await onFix();
      logger.debug('Fix complete, re-running validation');
      await runValidation();
    } catch (error) {
      logger.error('Error during fix:', error);
    } finally {
      setIsFixing(false);
    }
  };
  
  // Initial validation
  useEffect(() => {
    runValidation();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{title}</CardTitle>
            {hasErrors && <Badge variant="destructive">Errors</Badge>}
            {hasWarnings && !hasErrors && <Badge variant="outline" className="bg-yellow-100">Warnings</Badge>}
            {!hasErrors && !hasWarnings && <Badge variant="outline" className="bg-green-100">Valid</Badge>}
          </div>
          {isValidating && (
            <Badge variant="outline" className="animate-pulse">Validating...</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="text-xs">
        <div className="max-h-32 overflow-y-auto space-y-1">
          {results.length === 0 && !isValidating && (
            <div className="text-center py-2 text-slate-500">No validation results yet</div>
          )}
          
          {isValidating && (
            <div className="text-center py-2 text-slate-500">Validating...</div>
          )}
          
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-2 rounded flex items-start gap-2 ${
                !result.valid && result.severity === 'error' ? 'bg-red-50 text-red-800 border-l-2 border-red-500' : 
                !result.valid && result.severity === 'warning' ? 'bg-yellow-50 text-yellow-800 border-l-2 border-yellow-500' : 
                'bg-green-50 text-green-800 border-l-2 border-green-500'
              }`}
            >
              {!result.valid && result.severity === 'error' && (
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              {!result.valid && result.severity === 'warning' && (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              {result.valid && (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <div>
                <div className="font-medium">{result.name}</div>
                <div>{result.message}</div>
                {result.details && (
                  <div className="mt-1 p-1 bg-white bg-opacity-50 rounded font-mono text-[9px]">
                    {JSON.stringify(result.details).substring(0, 100)}
                    {JSON.stringify(result.details).length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-end gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={runValidation}
          disabled={isValidating || isFixing}
        >
          Validate
        </Button>
        {onFix && (hasErrors || hasWarnings) && (
          <Button 
            size="sm" 
            variant="default"
            onClick={runFix}
            disabled={isValidating || isFixing}
          >
            Fix Issues
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// TOIL Specific Validator
export const TOILDataValidator: React.FC<{userId: string}> = ({ userId }) => {
  // Create TOIL-specific validators
  const toilValidators = [
    // Check localStorage access
    () => {
      try {
        const testKey = '_test_storage_access';
        localStorage.setItem(testKey, 'test');
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        return {
          valid: retrieved === 'test',
          name: 'Storage Access',
          message: retrieved === 'test' 
            ? 'LocalStorage is accessible' 
            : 'LocalStorage test failed - values cannot be correctly retrieved',
          severity: 'error'
        };
      } catch (error) {
        return {
          valid: false,
          name: 'Storage Access',
          message: `LocalStorage test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        };
      }
    },
    
    // Check TOIL records structure
    () => {
      try {
        const toilRecords = localStorage.getItem('toilRecords');
        
        if (!toilRecords) {
          return {
            valid: true,
            name: 'TOIL Records',
            message: 'No TOIL records found - this is normal for new users',
            severity: 'info'
          };
        }
        
        // Check if valid JSON
        const parsed = JSON.parse(toilRecords);
        
        if (!Array.isArray(parsed)) {
          return {
            valid: false,
            name: 'TOIL Records',
            message: 'TOIL records are not stored as an array',
            details: { type: typeof parsed },
            severity: 'error'
          };
        }
        
        // Check for current user records
        const userRecords = parsed.filter((r: any) => r.userId === userId);
        
        return {
          valid: true,
          name: 'TOIL Records',
          message: `Found ${parsed.length} TOIL records (${userRecords.length} for current user)`,
          severity: 'info'
        };
      } catch (error) {
        return {
          valid: false,
          name: 'TOIL Records',
          message: `TOIL records parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        };
      }
    },
    
    // Check TOIL usage structure
    () => {
      try {
        const toilUsage = localStorage.getItem('toilUsage');
        
        if (!toilUsage) {
          return {
            valid: true,
            name: 'TOIL Usage',
            message: 'No TOIL usage found - this is normal for new users',
            severity: 'info'
          };
        }
        
        // Check if valid JSON
        const parsed = JSON.parse(toilUsage);
        
        if (!Array.isArray(parsed)) {
          return {
            valid: false,
            name: 'TOIL Usage',
            message: 'TOIL usage is not stored as an array',
            details: { type: typeof parsed },
            severity: 'error'
          };
        }
        
        // Check for current user usage
        const userUsage = parsed.filter((u: any) => u.userId === userId);
        
        return {
          valid: true,
          name: 'TOIL Usage',
          message: `Found ${parsed.length} TOIL usage records (${userUsage.length} for current user)`,
          severity: 'info'
        };
      } catch (error) {
        return {
          valid: false,
          name: 'TOIL Usage',
          message: `TOIL usage parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        };
      }
    }
  ];
  
  // Fix function for TOIL data
  const fixToilData = async () => {
    try {
      // Import needed functions
      const { cleanupDuplicateTOILRecords, cleanupDuplicateTOILUsage } = await import('@/utils/time/services/toil');
      
      // Run cleanup
      await cleanupDuplicateTOILRecords(userId);
      await cleanupDuplicateTOILUsage(userId);
      
      // Also clear cache
      const { toilService } = await import('@/utils/time/services/toil');
      toilService.clearCache();
      
      logger.debug('TOIL data fix complete');
    } catch (error) {
      logger.error('Error fixing TOIL data:', error);
      throw error;
    }
  };
  
  return (
    <DataValidator 
      title="TOIL Data Validation" 
      moduleName="TOIL"
      validators={toilValidators}
      onFix={fixToilData}
    />
  );
};
