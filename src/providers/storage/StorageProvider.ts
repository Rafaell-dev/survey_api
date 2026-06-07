export interface StorageProvider {
  upload(
    file: Buffer,
    key: string,
    contentType: string
  ): Promise<string>;

  delete(
    key: string
  ): Promise<void>;
}
