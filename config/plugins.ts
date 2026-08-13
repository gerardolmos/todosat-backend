import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const cloudinaryName = env('CLOUDINARY_NAME');
  const cloudinaryKey = env('CLOUDINARY_KEY');
  const cloudinarySecret = env('CLOUDINARY_SECRET');

  const cloudinaryValues = [
    cloudinaryName,
    cloudinaryKey,
    cloudinarySecret,
  ];

  const cloudinaryEnabled =
    cloudinaryValues.every(Boolean);

  const cloudinaryPartiallyConfigured =
    cloudinaryValues.some(Boolean) &&
    !cloudinaryEnabled;

  if (cloudinaryPartiallyConfigured) {
    throw new Error(
      'Cloudinary upload provider is only partially configured',
    );
  }

  if (cloudinaryEnabled) {
    return {
      upload: {
        config: {
          provider: 'cloudinary',
          providerOptions: {
            cloud_name: cloudinaryName,
            api_key: cloudinaryKey,
            api_secret: cloudinarySecret,
          },
          actionOptions: {
            upload: {},
            uploadStream: {},
            delete: {},
          },
        },
      },
    };
  }

  /*
   * Fallback transicional.
   * Se eliminará en cuanto Cloudinary quede
   * validado en producción.
   */
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
