import type { Core } from '@strapi/strapi';

const DEVELOPMENT_CORS_ORIGINS = [
  'http://localhost:4321',
  'http://127.0.0.1:4321',
] as const;

const PRODUCTION_CORS_ORIGINS = [
  'https://todosatcom.com',
  'https://www.todosatcom.com',
] as const;

function normalizeOrigins(
  origins: string[],
): string[] {
  return [
    ...new Set(
      origins
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  ];
}

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  const defaultOrigins =
    env('NODE_ENV', 'development') ===
    'production'
      ? [...PRODUCTION_CORS_ORIGINS]
      : [...DEVELOPMENT_CORS_ORIGINS];

  const allowedOrigins =
    normalizeOrigins(
      env.array(
        'CORS_ALLOWED_ORIGINS',
        defaultOrigins,
      ),
    );

  return [
    'strapi::logger',
    'strapi::errors',
    'strapi::security',
    {
      name: 'strapi::cors',
      config: {
        origin: (ctx: {
          request: {
            header: {
              origin?: string;
            };
          };
        }): string => {
          const origin =
            ctx.request.header.origin;

          return (
            origin &&
            allowedOrigins.includes(origin)
          )
            ? origin
            : '';
        },

        /*
         * TodoSatcom no utiliza sesiones
         * públicas de clientes.
         */
        credentials: false,

        methods: [
          'GET',
          'POST',
          'HEAD',
          'OPTIONS',
        ],

        headers: [
          'Content-Type',
          'Origin',
          'Accept',
          'Idempotency-Key',
        ],

        /*
         * Mantener un plazo corto mientras
         * la infraestructura no sea definitiva.
         */
        maxAge: 600,
        keepHeaderOnError: true,
      },
    },
    'global::block-unused-user-auth',
    'strapi::poweredBy',
    'strapi::query',
    {
      name: 'strapi::body',
      config: {
        /*
         * Stripe necesita el cuerpo exacto y sin
         * transformar para verificar la firma.
         */
        includeUnparsed: true,
      },
    },
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};

export default config;
