import 'reflect-metadata';
import { startApplication } from './application';

export { startApplication };

if (require.main === module) {
  startApplication().catch((error: Error) => {
    console.error('Application startup failed:', error.message);
    process.exitCode = 1;
  });
}
