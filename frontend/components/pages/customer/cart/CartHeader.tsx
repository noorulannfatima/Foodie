import CustomerHeader, { CustomerHeaderAction } from '../CustomerHeader';

export interface CartHeaderProps {
  showClearAction?: boolean;
  onClearCart?: () => void;
}

export default function CartHeader({ showClearAction, onClearCart }: CartHeaderProps) {
  return (
    <CustomerHeader
      // The filled cart body is white; the empty state sits on the page color.
      background={showClearAction ? 'surface' : 'page'}
      right={
        showClearAction && onClearCart ? (
          <CustomerHeaderAction icon="trash-outline" label="Clear cart" onPress={onClearCart} />
        ) : undefined
      }
    />
  );
}
