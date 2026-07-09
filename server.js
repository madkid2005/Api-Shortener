const fastify = require('fastify')({
  logger: true
});

const cors = require('@fastify/cors');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    // ============ ۱. ثبت پلاگین CORS ============
    await fastify.register(cors, { 
      origin: '*' 
    });

    // ============ ۲. ثبت پلاگین Swagger ============
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.0.3',
        info: {
          title: 'Shortener API',
          version: '1.0.0',
          description: 'URL Shortener Service'
        },
        servers: [
          {
            url: `http://localhost:${PORT}`
          }
        ]
      }
    });

    // ============ ۳. ثبت پلاگین Swagger UI ============
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        tryItOutEnabled: true
      },
      staticCSP: true
    });

    // ============ ۴. تعریف روت‌ها (Routes) ============
    
    // ROUTE 1: Home
    fastify.get('/', {
      schema: {
        tags: ['Info'],
        description: 'مشاهده اطلاعات سرویس',
        summary: 'اطلاعات سرویس'
      },
      handler: async () => {
        return {
          service: 'Shortener API',
          version: '1.0.0',
          docs: `http://localhost:${PORT}/docs`,
          status: '🟢 Online',
          message: 'Free access - No API Key required',
          endpoints: {
            create: 'POST /create',
            stats: 'GET /stats/:code',
            redirect: 'GET /:code'
          }
        };
      }
    });

    // ROUTE 2: Create Short URL
    fastify.post('/create', {
      schema: {
        tags: ['Shortener'],
        description: 'تبدیل لینک بلند به کوتاه',
        summary: 'ساخت لینک کوتاه',
        body: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { 
              type: 'string', 
              description: 'لینک بلند مورد نظر برای کوتاه کردن'
            }
          }
        },
        response: {
          200: {
            description: 'لینک کوتاه با موفقیت ساخته شد',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              url: { type: 'string' },
              code: { type: 'string' },
              shortUrl: { type: 'string' },
              created: { type: 'string', format: 'date-time' },
              clicks: { type: 'number' }
            }
          },
          400: {
            description: 'خطا - URL ارسال نشده',
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        const { url } = request.body;
        if (!url) {
          return reply.status(400).send({ error: 'URL is required' });
        }
        const code = Math.random().toString(36).substring(2, 10);
        return {
          success: true,
          url,
          code,
          shortUrl: `http://localhost:${PORT}/${code}`, // اصلاح پورت داینامیک
          created: new Date().toISOString(),
          clicks: 0
        };
      }
    });

    // ROUTE 3: Get Stats
    fastify.get('/stats/:code', {
      schema: {
        tags: ['Shortener'],
        description: 'دریافت آمار و اطلاعات لینک کوتاه',
        summary: 'آمار لینک کوتاه',
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { 
              type: 'string', 
              description: 'کد لینک کوتاه'
            }
          }
        },
        response: {
          200: {
            description: 'آمار با موفقیت دریافت شد',
            type: 'object',
            properties: {
              code: { type: 'string' },
              clicks: { type: 'number' },
              referrers: { type: 'object' },
              countries: { type: 'object' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        const code = request.params.code;
        return {
          code: code,
          clicks: Math.floor(Math.random() * 1000),
          referrers: {
            'google.com': Math.floor(Math.random() * 100),
            'twitter.com': Math.floor(Math.random() * 50)
          },
          countries: {
            'US': Math.floor(Math.random() * 200),
            'IR': Math.floor(Math.random() * 100)
          }
        };
      }
    });

    // ROUTE 4: Redirect
    fastify.get('/:code', {
      schema: {
        tags: ['Shortener'],
        description: 'رفع مسیر (Redirect) به لینک اصلی',
        summary: 'ردایرکت به لینک اصلی',
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { 
              type: 'string', 
              description: 'کد لینک کوتاه'
            }
          }
        },
        response: {
          200: {
            description: 'لینک اصلی برای ریدایرکت',
            type: 'object',
            properties: {
              redirect: { type: 'string' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        const code = request.params.code;
        return { 
          redirect: `https://example.com/${code}`,
          message: 'Redirecting...'
        };
      }
    });

    // ============ ۵. روشن کردن سرور ============
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`\n🚀 Shortener API running on http://localhost:${PORT}`);
    console.log(`📚 Swagger Docs: http://localhost:${PORT}/docs`);
    console.log(`🔓 Free access - No API Key required`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /            - Service info`);
    console.log(`   POST /create      - Create short URL`);
    console.log(`   GET  /stats/:code - Get URL stats`);
    console.log(`   GET  /:code       - Redirect to original URL`);
    console.log(`\n`);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();