import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider } from './StorageProvider';

export class CloudflareR2StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    
    this.bucketName = process.env.R2_BUCKET_NAME || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName || !this.publicUrl) {
      console.warn('Variáveis de ambiente do R2 incompletas!');
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || ''
      }
    });
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType
    });

    await this.client.send(command);

    const url = new URL(key, this.publicUrl).toString();
    return url;
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    await this.client.send(command);
  }
}
