import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type {
  IStorageAdapter,
  UploadFileInput,
  UploadFileResult,
  DeleteFileResult,
} from "./IStorageAdapter";

/**
 * DigitalOcean Spaces adapter using the S3-compatible API.
 *
 * Required env vars:
 *   DO_SPACES_KEY      — Access Key ID
 *   DO_SPACES_SECRET   — Secret Access Key
 *   DO_SPACES_ENDPOINT — e.g. https://nyc3.digitaloceanspaces.com
 *   DO_SPACES_REGION   — e.g. nyc3
 *   DO_SPACES_BUCKET   — bucket name
 *   DO_SPACES_CDN_URL  — optional CDN base URL
 */
export class DigitalOceanSpacesAdapter implements IStorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor() {
    const key = process.env.DO_SPACES_KEY;
    const secret = process.env.DO_SPACES_SECRET;
    const endpoint = process.env.DO_SPACES_ENDPOINT;
    const region = process.env.DO_SPACES_REGION;
    const bucket = process.env.DO_SPACES_BUCKET;

    if (!key) throw new Error("Missing env var: DO_SPACES_KEY");
    if (!secret) throw new Error("Missing env var: DO_SPACES_SECRET");
    if (!endpoint) throw new Error("Missing env var: DO_SPACES_ENDPOINT");
    if (!region) throw new Error("Missing env var: DO_SPACES_REGION");
    if (!bucket) throw new Error("Missing env var: DO_SPACES_BUCKET");

    this.bucket = bucket;

    // CDN URL takes priority over direct endpoint for public URL construction
    const cdnUrl = process.env.DO_SPACES_CDN_URL;
    this.baseUrl = cdnUrl
      ? cdnUrl.replace(/\/$/, "")
      : `${endpoint.replace(/\/$/, "")}/${bucket}`;

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: key,
        secretAccessKey: secret,
      },
      // DigitalOcean Spaces uses path-style URLs when going through the endpoint directly
      forcePathStyle: false,
    });
  }

  async upload(input: UploadFileInput): Promise<UploadFileResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.mimeType,
        ContentLength: input.fileSize,
        // Make files publicly readable
        ACL: "public-read",
        // Store original filename as metadata for display purposes
        Metadata: {
          "original-filename": encodeURIComponent(input.fileName),
        },
      });

      await this.client.send(command);

      return {
        ok: true,
        url: this.getPublicUrl(input.key),
        key: input.key,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[DigitalOceanSpacesAdapter] upload error:", message);
      return { ok: false, error: `Upload failed: ${message}` };
    }
  }

  async delete(key: string): Promise<DeleteFileResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[DigitalOceanSpacesAdapter] delete error:", message);
      return { ok: false, error: `Delete failed: ${message}` };
    }
  }

  getPublicUrl(key: string): string {
    // If CDN URL is set: https://cdn.example.com/{key}
    // If not, use endpoint+bucket: https://nyc3.digitaloceanspaces.com/{bucket}/{key}
    const cdnUrl = process.env.DO_SPACES_CDN_URL;
    if (cdnUrl) {
      return `${cdnUrl.replace(/\/$/, "")}/${key}`;
    }
    return `${this.baseUrl}/${key}`;
  }
}
