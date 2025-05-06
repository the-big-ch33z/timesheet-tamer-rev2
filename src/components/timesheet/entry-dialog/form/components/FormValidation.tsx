
import { useToast } from "@/hooks/use-toast";

export const useFormValidation = () => {
  const { toast } = useToast();
  
  const validateSubmission = (hours: string): boolean => {
    console.debug(`[FormValidation] Validating hours: "${hours}" (${typeof hours})`);
    
    // Handle empty value
    if (!hours || hours.trim() === '') {
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
      toast({
        title: "Invalid hours format",
        description: "Hours must be a valid number",
        variant: "destructive"
      });
      return false;
    }
    
    if (hoursNum <= 0) {
      toast({
        title: "Invalid hours",
        description: "Hours must be a positive number",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  return { validateSubmission };
};

export default useFormValidation;
