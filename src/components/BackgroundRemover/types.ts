export interface ImageFile {
  id: number;
  file: File;
  processedFile?: File;
}

export interface AppError {
  message: string;
}