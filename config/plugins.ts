import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const bucketName = env('BUCKET_NAME');
  const bucketEndpoint = env('BUCKET_ENDPOINT');
  const bucketRegion = env('BUCKET_REGION');
  const bucketAccessKeyId = env('BUCKET_ACCESS_KEY_ID');
  const bucketSecretAccessKey = env('BUCKET_SECRET_ACCESS_KEY');

  const s3Enabled =
    bucketName &&
    bucketEndpoint &&
    bucketAccessKeyId &&
    bucketSecretAccessKey;

  if (!s3Enabled) {
    return {};
  }

  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          s3Options: {
            credentials: {
              accessKeyId: bucketAccessKeyId,
              secretAccessKey: bucketSecretAccessKey,
            },
            endpoint: bucketEndpoint,
            region: bucketRegion || 'auto',
            params: {
              Bucket: bucketName,
              ACL: 'private',
              signedUrlExpires: 15 * 60,
            },
          },
        },
      },
    },
  };
};

export default config;
