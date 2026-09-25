import CustomerHeader, { CustomerHeaderAction } from '../CustomerHeader';

export interface CartHeaderProps {
  showClearAction?: boolean;
  onClearCart?: () => void;
}

export default function CartHeader({ showClearAction, onClearCart }: CartHeaderProps) {
  return (
    <CustomerHeader
      right={
        showClearAction && onClearCart ? (
          <CustomerHeaderAction icon="trash-outline" label="Clear cart" onPress={onClearCart} />
        ) : undefined
      }
    />
  );
}
