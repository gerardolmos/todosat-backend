import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const basePlugins: Core.Config.Plugin = {
    'publicacion-web': {
      enabled: true,
      resolve: 'src/plugins/publicacion-web',
    },
  };

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

  if (!cloudinaryEnabled) {
    if (
      env('NODE_ENV', 'development') ===
      'production'
    ) {
      throw new Error(
        'Cloudinary upload provider is required in production',
      );
    }

    return basePlugins;
  }

  return {
    ...basePlugins,
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
};

export default config;
