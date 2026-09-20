import { useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);

  const toast = ({ title, description, variant }: any) => {
    console.log(`TOAST: ${title} - ${description} (${variant})`);
    // Basic implementation for now
    alert(`${title}\n${description}`);
  };

  return { toast, toasts };
}
