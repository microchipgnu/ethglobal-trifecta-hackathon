import {
  ApiReference,
  type ApiReferenceOptions,
} from '@scalar/nextjs-api-reference';

import { TUNNEL_URL, NEXT_TG_BEARER_TOKEN } from '@/lib/config';
import { openApiSpec } from '@/lib/openapi';

const config: ApiReferenceOptions = {
  spec: {
    content: openApiSpec,
  },
  theme: 'purple',
  metaData: {
    title: 'W3GPT Agents API',
    description: 'W3GPT Agents API Reference',
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
