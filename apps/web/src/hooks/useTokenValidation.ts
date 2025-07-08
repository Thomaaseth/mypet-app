import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface TokenValidationState {
  token: string | null;
  isValidating: boolean;
  isValid: boolean;
}

interface UseTokenValidationOptions {
  paramName?: string;
  redirectOnInvalid?: string;
  required?: boolean;
}

export function useTokenValidation(options: UseTokenValidationOptions = {}) {
  const { 
    paramName = 'token', 
    redirectOnInvalid = '/forgot-password',
    required = true 
  } = options;
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // Consolidated state
  const [state, setState] = useState<TokenValidationState>({
    token: null,
    isValidating: true,
    isValid: false
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get(paramName);
    
    if (required && !tokenFromUrl) {
      console.log(`Invalid ${paramName} - redirecting to ${redirectOnInvalid}`);
      setState({
        token: null,
        isValidating: false,
        isValid: false
      });
      router.push(redirectOnInvalid);
      return;
    }

    // Valid token found
    setState({
      token: tokenFromUrl,
      isValidating: false,
      isValid: !!tokenFromUrl
    });
  }, [searchParams, paramName, required, redirectOnInvalid, router]);

  return state;
}