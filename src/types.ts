export interface FinishType {
  id: string;
  number: string;
  name: string;
  description: string;
  image: string; // url or placeholder gradient
}

export interface ClientLogo {
  name: string;
  category: string;
  domain?: string;
  logoUrl?: string;
}

export interface Review {
  reviewer: string;
  designation: string;
  text: string;
  avatar: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: 'Spray Painting' | 'Hydrographic Printing' | 'Digital Printing' | 'Injection Molding';
  image: string;
  alt: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  avatar: string;
  image: string;
}

export interface OfficeAddress {
  name: string;
  address: string;
  contactPerson?: string;
  phone?: string;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}
