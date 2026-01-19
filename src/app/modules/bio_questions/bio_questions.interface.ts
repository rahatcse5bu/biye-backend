export interface IBioQuestion {
  user: string; // User ID (ObjectId as string)
  questions: string[]; // Array of question strings
  createdAt?: Date;
  updatedAt?: Date;
}
