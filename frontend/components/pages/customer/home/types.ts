export interface HomeCategory {
  id: string;
  label: string;
  emoji: string;
  key: string;
}

export interface HomeRestaurant {
  _id: string;
  name: string;
  cuisineTypes: string[];
  image: string[];
  averageRating: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  isPremium: boolean;
  minimumOrder: number;
  isActive: boolean;
  isBusy?: boolean;
}
