import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Eye, EyeOff, User, Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { passwordFormStyles } from '../styles/shared-styles';
import { authService } from '../utils/authService';
import { isValidSecurePassword } from '../utils/validators';

interface CambiarContrasenaProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

/**
 * Componente para cambiar la contraseña del usuario actual
 * OPTIMIZACIÓN: Handlers memoizados con useCallback
 */
export function CambiarContrasena({ isOpen, onClose, currentUser }: CambiarContrasenaProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Validación de contraseña en tiempo real
  const passwordValidation = useMemo(
    () => isValidSecurePassword(newPassword),
    [newPassword]
  );

  // Verificar si se puede enviar el formulario
  const canSubmit = useMemo(() => {
    return currentPassword.length > 0 &&
           passwordValidation.isValid &&
           newPassword === confirmPassword;
  }, [currentPassword, passwordValidation.isValid, newPassword, confirmPassword]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar contraseña segura antes de enviar
    if (!passwordValidation.isValid) {
      toast.error('Contraseña no cumple los requisitos', {
        description: passwordValidation.errors[0]
      });
      return;
    }

    try {
      // Cambiar contraseña usando el servicio de Supabase
      const result = await authService.changeOwnPassword(
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (!result.success) {
        setError(result.error || 'Error al cambiar la contraseña');
        return;
      }

      toast.success('Contraseña actualizada', {
        description: 'Tu contraseña ha sido cambiada exitosamente.'
      });

      // Limpiar formulario y cerrar
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      onClose();
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setError('Error inesperado. Intente nuevamente.');
    }
  }, [currentPassword, newPassword, confirmPassword, passwordValidation, onClose]);

  const handleClose = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={passwordFormStyles.dialogContent}>
        <DialogHeader className={passwordFormStyles.dialogHeader}>
          <DialogTitle className={passwordFormStyles.dialogTitle}>Cambiar Contraseña</DialogTitle>
          <DialogDescription className={passwordFormStyles.dialogDescription}>
            Actualizar contraseña de usuario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={passwordFormStyles.form}>
          {/* Información del usuario */}
          <div className="flex items-center gap-2.5 mb-4">
            <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentUser?.nombre} {currentUser?.apellido}
            </span>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className={passwordFormStyles.field}>
            <Label htmlFor="currentPassword" className={passwordFormStyles.label}>
              Contraseña Actual *
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese la nueva contraseña"
                className={passwordFormStyles.inputPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={passwordFormStyles.passwordToggle}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className={passwordFormStyles.field}>
            <Label htmlFor="newPassword" className={passwordFormStyles.label}>
              Nueva Contraseña *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingrese la nueva contraseña"
                className={`${passwordFormStyles.inputPassword} ${newPassword && !passwordValidation.isValid ? 'border-red-500' : ''}`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={passwordFormStyles.passwordToggle}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Requisitos de seguridad:
              </p>
              <div className="space-y-1.5">
                {passwordValidation.requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      req.met 
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500' 
                        : 'border-gray-400 dark:border-gray-500 bg-transparent'
                    }`}>
                      {req.met && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      req.met 
                        ? 'text-gray-800 dark:text-gray-200' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={passwordFormStyles.field}>
            <Label htmlFor="confirmPassword" className={passwordFormStyles.label}>
              Confirmar Nueva Contraseña *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme la nueva contraseña"
                className={passwordFormStyles.inputPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={passwordFormStyles.passwordToggle}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className={passwordFormStyles.footer}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className={passwordFormStyles.cancelButton}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className={passwordFormStyles.submitButton}
            >
              <Lock className="h-4 w-4 mr-2" />
              Cambiar Contraseña
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
