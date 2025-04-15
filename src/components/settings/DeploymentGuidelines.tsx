
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TestHarness from '@/utils/validation/TestHarness';

/**
 * DeploymentGuidelines component
 * Provides documentation and tools for successful deployment
 */
const DeploymentGuidelines: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Deployment Guidelines</h1>
      <p className="text-gray-500">
        Follow these guidelines to prevent unsuccessful builds and ensure smooth deployments.
      </p>
      
      <Tabs defaultValue="test-harness">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="test-harness">Test Harness</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          <TabsTrigger value="common-issues">Common Issues</TabsTrigger>
          <TabsTrigger value="rollback">Rollback Plan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="test-harness" className="mt-6">
          <TestHarness />
        </TabsContent>
        
        <TabsContent value="guidelines" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Deployment Checklist</CardTitle>
              <CardDescription>
                Complete these steps before deploying to production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTitle>Always Run Tests Before Deployment</AlertTitle>
                <AlertDescription>
                  Use the Test Harness tab to run comprehensive checks on your application before deploying.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. Code Quality Checks</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ensure all TypeScript type errors are resolved</li>
                  <li>Verify no console.error logs appear during normal operation</li>
                  <li>Confirm UI components render correctly in different screen sizes</li>
                  <li>Check that all form validations work as expected</li>
                </ul>
                
                <h3 className="text-lg font-semibold">2. Data Integrity Checks</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verify time entry data is loaded and displayed correctly</li>
                  <li>Confirm entry creation, update, and deletion work properly</li>
                  <li>Test monthly calculations with different date ranges</li>
                  <li>Validate data persistence across page refreshes</li>
                </ul>
                
                <h3 className="text-lg font-semibold">3. Cross-Browser Testing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Test on Chrome, Firefox, Safari, and Edge</li>
                  <li>Verify mobile responsiveness on iOS and Android devices</li>
                  <li>Check touch interactions work properly on touch devices</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Download Checklist</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="common-issues" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Pitfalls</CardTitle>
              <CardDescription>
                Known breaking patterns and how to avoid them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Inconsistent Data Access Paths</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>Problem:</strong> Using multiple data access methods leads to inconsistencies.
                    </p>
                    <p className="mb-2">
                      <strong>Symptoms:</strong> Data appears in one view but not another, totals don't match across components.
                    </p>
                    <p className="mb-2">
                      <strong>Solution:</strong> Always use the unified data access layer (unifiedTimeEntryService) for consistent data access.
                    </p>
                    <div className="bg-gray-100 p-3 rounded mt-2">
                      <p className="text-sm">
                        The new unified service provides reactive updates across all components that use it.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Invalid Date Handling</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>Problem:</strong> Inconsistent date object handling causes comparison errors.
                    </p>
                    <p className="mb-2">
                      <strong>Symptoms:</strong> Date filters don't work correctly, entries appear on wrong dates.
                    </p>
                    <p className="mb-2">
                      <strong>Solution:</strong> Always use the ensureDate() utility to normalize date objects.
                    </p>
                    <div className="bg-gray-100 p-3 rounded mt-2">
                      <p className="text-sm">
                        The unified service automatically handles date normalization for all operations.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>Storage Synchronization Problems</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>Problem:</strong> Multiple tabs or components updating storage without coordination.
                    </p>
                    <p className="mb-2">
                      <strong>Symptoms:</strong> Data loss, entries disappearing, duplicate entries.
                    </p>
                    <p className="mb-2">
                      <strong>Solution:</strong> Use the unified data layer which implements proper storage event handling.
                    </p>
                    <div className="bg-gray-100 p-3 rounded mt-2">
                      <p className="text-sm">
                        The unified service provides synchronization across tabs and components.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>Monthly Hour Calculation Inconsistencies</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      <strong>Problem:</strong> Monthly totals don't match the sum of daily entries.
                    </p>
                    <p className="mb-2">
                      <strong>Symptoms:</strong> Monthly dashboard shows different totals than expected.
                    </p>
                    <p className="mb-2">
                      <strong>Solution:</strong> Use the unified data access layer consistently and ensure date filtering is correct.
                    </p>
                    <div className="bg-gray-100 p-3 rounded mt-2">
                      <p className="text-sm">
                        The useMonthlyHoursCalculation hook has been updated to use the unified service.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rollback" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rollback Plan</CardTitle>
              <CardDescription>
                How to recover from unsuccessful deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>Always Have a Rollback Strategy</AlertTitle>
                <AlertDescription>
                  Before deploying any major changes, ensure you have a clear rollback path.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">1. Data Backup</h3>
                  <p>Before deploying major changes, back up the user data:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Export timesheet data using the "Export" feature</li>
                    <li>Keep a copy of local storage data via the browser's developer tools</li>
                    <li>Document current app version and configuration</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Staged Rollout</h3>
                  <p>For major changes, follow this deployment strategy:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Deploy to a test environment first and verify functionality</li>
                    <li>Roll out to a small group of test users (10%)</li>
                    <li>Monitor for issues for 24-48 hours</li>
                    <li>If successful, gradually increase deployment to 25%, 50%, and 100%</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Emergency Rollback</h3>
                  <p>If issues are detected after deployment:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Immediately revert to the last known good version</li>
                    <li>Notify users of the temporary rollback</li>
                    <li>Restore any lost data from backups if necessary</li>
                    <li>Investigate and fix the issues in development before trying again</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">4. Data Migration</h3>
                  <p>When data schemas change:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Include automatic migration code in the deployment</li>
                    <li>Test migration with real data before deployment</li>
                    <li>Provide manual data recovery tools for edge cases</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Download Rollback Plan</Button>
              <Button>Run Migration Tests</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeploymentGuidelines;
