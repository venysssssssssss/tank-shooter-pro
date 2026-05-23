import { startServer } from './server';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

startServer(PORT, () => {
  console.log(`Tank Shooter Pro Server running on port ${PORT}`);
});