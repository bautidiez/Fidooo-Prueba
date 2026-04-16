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
        firebaseProjectId: process.env.PROJECT_ID ? 'Configured ✅' : 'Missing ❌',
        groqActive: process.env.GROQ_API_KEY ? 'Yes ✅' : 'No ❌',
        geminiActive: process.env.GEMINI_API_KEY ? 'Yes ✅' : 'No ❌',
        openaiActive: process.env.OPENAI_API_KEY ? 'Yes ✅' : 'No ❌',
      }
    };
  }
}
