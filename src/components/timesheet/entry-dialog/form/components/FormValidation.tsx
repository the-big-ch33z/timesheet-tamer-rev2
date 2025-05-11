
import { useToast } from "@/hooks/use-toast";

export const useFormValidation = () => {
  const { toast } = useToast();
  
  const validateSubmission = (hours: string): boolean => {
    console.debug(`[FormValidation] Validating hours: "${hours}" (${typeof hours})`);
    
    // Handle empty value
    if (!hours || hours.trim() === '') {
      console.warn(`[FormValidation] Hours validation failed: empty value`);
      toast({
        title: "Invalid hours format",
        description: "Hours cannot be empty",
        variant: "destructive"
      });
      return false;
    }
    
    // Parse to number
    const hoursNum = parseFloat(hours);
    console.debug(`[FormValidation] Parsed hours: ${hoursNum} (${typeof hoursNum})`);
    
    if (isNaN(hoursNum)) {
      console.warn(`[FormValidation] Hours validation failed: not a number`);
      toast({
        title: "Invalid hours format",
        description: "Hours must be a valid number",
        variant: "destructive"
      });
      return false;
    }
    
    if (hoursNum <= 0) {
      console.warn(`[FormValidation] Hours validation failed: not positive`);
      toast({
        title: "Invalid hours",
        description: "Hours must be a positive number",
        variant: "destructive"
      });
      return false;
    }
    
    console.debug(`[FormValidation] Hours validation passed: ${hoursNum}`);
    return true;
  };
  
  return { validateSubmission };
};

export default useFormValidation;
