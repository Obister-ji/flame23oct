export interface Email {
  id: string;
  subject: string;
  content: string;
  recipient: string;
  category: string;
  tags: string[];
  createdAt: Date;
  isFavorite: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template: string;
  variables: string[];
  createdBy: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}