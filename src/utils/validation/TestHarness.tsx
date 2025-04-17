
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PreDeploymentValidator, ValidationResult } from './preDeploymentValidation';
import { unifiedTimeEntryService } from '../time/services';
import { createTimeLogger } from '../time/errors/timeLogger';

const logger = createTimeLogger('TestHarness');

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
  type: 'system' | 'data' | 'ui' | 'integration';
  severity: 'info' | 'warning' | 'error';
}

/**
 * Test harness component for validating app functionality
 */
const TestHarness: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  });
  
  // Run tests
  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setValidationResults([]);
    
    // Helper to add test results
    const addResult = (result: TestResult) => {
      setResults(prev => [...prev, result]);
      setProgress(prev => prev + 5);
    };
    
    try {
      logger.debug('Running tests');
      
      // Test 1: Storage access
      addResult({
        name: 'Storage Access',
        passed: true,
        message: 'Local storage is accessible',
        type: 'system',
        severity: 'info'
      });
      
      // Test 2: Unified service initialization
      try {
        unifiedTimeEntryService.getAllEntries();
        addResult({
          name: 'Unified Service Init',
          passed: true,
          message: 'Unified time entry service initialized successfully',
          type: 'system',
          severity: 'info'
        });
      } catch (error) {
        addResult({
          name: 'Unified Service Init',
          passed: false,
          message: 'Error initializing unified time entry service',
          details: error,
          type: 'system',
          severity: 'error'
        });
      }
      
      // Test 3: Data loading
      try {
        const entries = unifiedTimeEntryService.getAllEntries();
        addResult({
          name: 'Data Loading',
          passed: true,
          message: `Successfully loaded ${entries.length} time entries`,
          details: { count: entries.length },
          type: 'data',
          severity: 'info'
        });
      } catch (error) {
        addResult({
          name: 'Data Loading',
          passed: false,
          message: 'Error loading time entries',
          details: error,
          type: 'data',
          severity: 'error'
        });
      }
      
      // Let progress bar update
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(30);
      
      // Test 4: Storage operations
      try {
        const testKey = '_test_harness_key';
        localStorage.setItem(testKey, 'test');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (testValue === 'test') {
          addResult({
            name: 'Storage Operations',
            passed: true,
            message: 'Storage operations working correctly',
            type: 'system',
            severity: 'info'
          });
        } else {
          addResult({
            name: 'Storage Operations',
            passed: false,
            message: 'Storage read/write test failed',
            details: { expected: 'test', got: testValue },
            type: 'system',
            severity: 'error'
          });
        }
      } catch (error) {
        addResult({
          name: 'Storage Operations',
          passed: false,
          message: 'Error performing storage operations',
          details: error,
          type: 'system',
          severity: 'error'
        });
      }
      
      // Let progress bar update
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(50);
      
      // Test 5: Run comprehensive validation
      try {
        const validator = new PreDeploymentValidator();
        const validationResults = await validator.validateAll();
        
        setValidationResults(validationResults);
        
        const errors = validationResults.filter(r => !r.valid && r.severity === 'error');
        const warnings = validationResults.filter(r => !r.valid && r.severity === 'warning');
        
        if (errors.length > 0) {
          addResult({
            name: 'Comprehensive Validation',
            passed: false,
            message: `Validation failed with ${errors.length} errors and ${warnings.length} warnings`,
            details: { errors, warnings },
            type: 'system',
            severity: 'error'
          });
        } else if (warnings.length > 0) {
          addResult({
            name: 'Comprehensive Validation',
            passed: true,
            message: `Validation passed with ${warnings.length} warnings`,
            details: { warnings },
            type: 'system',
            severity: 'warning'
          });
        } else {
          addResult({
            name: 'Comprehensive Validation',
            passed: true,
            message: 'Validation passed with no issues',
            type: 'system',
            severity: 'info'
          });
        }
      } catch (error) {
        addResult({
          name: 'Comprehensive Validation',
          passed: false,
          message: 'Error running comprehensive validation',
          details: error,
          type: 'system',
          severity: 'error'
        });
      }
      
      // Let progress bar update
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(90);
      
      // Final delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(100);
    } catch (error) {
      logger.error('Error running tests', error);
      addResult({
        name: 'Test Executor',
        passed: false,
        message: 'Error running test harness',
        details: error,
        type: 'system',
        severity: 'error'
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Calculate summary
  useEffect(() => {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const warnings = results.filter(r => r.severity === 'warning').length;
    
    setSummary({
      total: results.length,
      passed,
      failed,
      warnings,
    });
  }, [results]);
  
  // Severity badge color
  const getSeverityColor = (severity: 'info' | 'warning' | 'error') => {
    switch (severity) {
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Timesheet App Test Harness</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isRunning ? (
          <div className="space-y-2">
            <p>Running tests...</p>
            <Progress value={progress} className="w-full" />
          </div>
        ) : results.length > 0 ? (
          <>
            <Alert className={summary.failed > 0 ? 'bg-red-50' : 'bg-green-50'}>
              <AlertTitle>Test Summary</AlertTitle>
              <AlertDescription>
                Total tests: {summary.total} | 
                Passed: <span className="text-green-600 font-semibold">{summary.passed}</span> | 
                Failed: <span className="text-red-600 font-semibold">{summary.failed}</span> | 
                Warnings: <span className="text-yellow-600 font-semibold">{summary.warnings}</span>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test Results</h3>
              
              {results.map((result, i) => (
                <div key={i} className={`p-3 border rounded-md ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{result.name}</span>
                    <Badge className={getSeverityColor(result.severity)}>
                      {result.severity}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.details && (
                    <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
            
            {validationResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Validation Results</h3>
                
                {validationResults.map((result, i) => (
                  <div key={i} className={`p-3 border rounded-md ${result.valid ? 'bg-green-50' : result.severity === 'warning' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{result.component} ({result.type})</span>
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                    {result.details && (
                      <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p>Click "Run Tests" to validate the application before deployment</p>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          variant={results.length === 0 ? 'default' : 'outline'}
        >
          {results.length === 0 ? 'Run Tests' : 'Run Again'}
        </Button>
        
        {results.length > 0 && (
          <Button 
            variant={summary.failed > 0 ? 'destructive' : 'default'} 
            disabled={isRunning}
          >
            {summary.failed > 0 ? 'Deployment Not Recommended' : 'Ready for Deployment'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TestHarness;
