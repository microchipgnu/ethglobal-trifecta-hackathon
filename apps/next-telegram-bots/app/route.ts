import { ApiReference } from '@scalar/nextjs-api-reference';

import { NEXT_TG_BEARER_TOKEN, TUNNEL_URL } from '@/lib/config';
import { openApiSpec } from '@/lib/openapi';

const config = {
  spec: {
    content: openApiSpec,
  },
  theme: 'purple' as const,
  metaData: {
    title: 'Midcurve API',
    description: 'Midcurve API Reference',
  },
  authentication: {
    http: {
      bearer: {
        token: (TUNNEL_URL && NEXT_TG_BEARER_TOKEN) || '',
      },
      basic: {
        username: '',
        password: '',
      },
    },
    securitySchemes: {
      bearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Bearer',
      },
    },
    preferredSecurityScheme: 'bearerAuth',
  },

  hideClientButton: true,
};

export const GET = ApiReference(config);
