export interface CloudflareBindings {
  IMAGE_BUCKET: R2Bucket
  IMAGE_METADATA: KVNamespace
  AUTH_USERNAME: string
  AUTH_PASSWORD: string
  JWT_SECRET: string
  MAX_FILE_SIZE: number
  ALLOWED_ORIGINS: string
}

export type Env = {
  Bindings: CloudflareBindings
}
