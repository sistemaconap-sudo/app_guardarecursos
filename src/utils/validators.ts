/**
 * Validadores compartidos para formularios
 */

/**
 * Valida que un email tenga formato correcto
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida que una contraseña cumpla los requisitos mínimos
 */
export function isValidPassword(password: string, minLength: number = 6): boolean {
  return password.length >= minLength;
}

/**
 * Valida que una contraseña cumpla las políticas de seguridad estrictas
 * - Mínimo 8 caracteres
 * - Al menos un número
 * - Al menos una letra mayúscula
 * - Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export function isValidSecurePassword(password: string): { 
  isValid: boolean; 
  errors: string[];
  requirements: Array<{ label: string; met: boolean }>;
} {
  const errors: string[] = [];
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  
  if (!hasMinLength) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!hasNumber) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  if (!hasUppercase) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!hasSpecialChar) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }
  
  const requirements = [
    { label: 'Mínimo 8 caracteres', met: hasMinLength },
    { label: 'Al menos un número', met: hasNumber },
    { label: 'Al menos una mayúscula', met: hasUppercase },
    { label: 'Al menos un carácter especial', met: hasSpecialChar }
  ];
  
  return {
    isValid: errors.length === 0,
    errors,
    requirements
  };
}

/**
 * Valida que un DPI guatemalteco sea válido
 */
export function isValidDPI(dpi: string): boolean {
  const dpiRegex = /^\d{13}$/;
  return dpiRegex.test(dpi);
}

/**
 * Valida que un teléfono guatemalteco sea válido
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Valida coordenadas geográficas
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Valida que un campo no esté vacío
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Valida múltiples campos requeridos
 */
export function validateRequiredFields(fields: Record<string, any>): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (value === '' || value === null || value === undefined) {
      missingFields.push(key);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
