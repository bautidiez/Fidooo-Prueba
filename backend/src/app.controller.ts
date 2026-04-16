import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Fidooo AI Chat Backend is running!';
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      config: {
        projectId: process.env.PROJECT_ID ? 'Configured ✅' : 'Missing ❌',
        openai: process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Missing ❌',
      }
    };
  }
}
