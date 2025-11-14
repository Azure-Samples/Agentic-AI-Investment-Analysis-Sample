import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

export function getClientIdForUser(): string {
  // Check if clientId already exists in sessionStorage
  let existingClientId = sessionStorage.getItem('investai-client-id');
  
  if (!existingClientId) {
    // Generate a new unique client ID using crypto.randomUUID or fallback
    existingClientId = crypto?.randomUUID?.() || 
      `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('investai-client-id', existingClientId);
  }
  
  return existingClientId;
};

export function getClientIdForAnalysis(): string {
    const existingClientId = getClientIdForUser();
    
    return `${existingClientId}-analysis`;
};

export function getClientIdForWhatIf(): string {
    const existingClientId = getClientIdForUser();
    
    return `${existingClientId}-whatif`;
};