import { AppDialog } from '@/components/ui/primitives';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  destructive?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  showCancel,
  destructive,
  loading,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AppDialog
      visible={visible}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      showCancel={showCancel}
      confirmVariant={destructive ? 'destructive' : 'primary'}
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
