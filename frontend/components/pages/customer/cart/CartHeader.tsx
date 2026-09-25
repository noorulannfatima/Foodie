import CustomerHeader, { CustomerHeaderAction } from '../CustomerHeader';
import { useCustomerT } from '@/stores/customerPreferencesStore';

export interface CartHeaderProps {
  showClearAction?: boolean;
  onClearCart?: () => void;
}

export default function CartHeader({ showClearAction, onClearCart }: CartHeaderProps) {
  const t = useCustomerT();
  return (
    <CustomerHeader
      right={
        showClearAction && onClearCart ? (
          <CustomerHeaderAction icon="trash-outline" label={t('clearCart')} onPress={onClearCart} />
        ) : undefined
      }
    />
  );
}
