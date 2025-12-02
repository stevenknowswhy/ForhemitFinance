/**
 * Type definitions for Business Profile Settings
 */

export interface Owner {
  id: string;
  name: string;
  ownershipPercentage: string;
  linkedIn: string;
  role?: string;
}

export interface Product {
  id: string;
  name: string;
  isEditing?: boolean;
}

