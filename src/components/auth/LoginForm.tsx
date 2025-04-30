
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message || "Please check your credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert className="bg-blue-50 text-blue-800 border-blue-100 mb-4">
        <AlertDescription className="flex items-start">
          <InfoIcon className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <p className="font-medium">Demo Account</p>
            <p className="text-sm">Email: admin@example.com</p>
            <p className="text-sm">Password: password</p>
          </div>
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email" 
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="#" className="text-sm text-brand-600 hover:text-brand-800">
            Forgot password?
          </a>
        </div>
        <Input 
          id="password"
          type="password" 
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
