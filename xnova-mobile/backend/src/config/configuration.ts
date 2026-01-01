export default () => {
  // 필수 환경변수 검증
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
      uri: process.env.MONGODB_URI,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
    },
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    },
  };
};
