# Multi-Authentication NestJS Application

A robust NestJS application demonstrating multiple authentication strategies including OAuth2 (Google, Apple) and phone number verification.

## Features

- **Multiple Authentication Methods:**
  - OAuth2 with Google
  - OAuth2 with Apple
  - Phone number verification via Twilio
  - Traditional email/password authentication

- **Security:**
  - JWT-based authentication
  - Session management
  - Refresh token rotation
  - Secure password handling with bcrypt

- **Additional Components:**
  - Redis-based session storage
  - MongoDB integration with Mongoose
  - Input validation with class-validator
  - API documentation with Swagger

## Project Architecture

This project follows several architectural patterns and principles:

- **SOLID Principles**: The codebase adheres to Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.

- **Modular Architecture**: The application is divided into focused modules (auth, user, common) that encapsulate specific functionality.

- **Service-Repository Pattern**: Clear separation between business logic (services) and data access layers.

- **Dependency Injection**: NestJS's powerful DI container is used throughout the application.

- **Test-Driven Development (TDD)**: Extensive test coverage with unit tests (.spec files) and E2E tests.

- **Domain-Driven Design (DDD) concepts**: The application structure reflects the business domain with clear boundaries.

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MongoDB
- Redis
- Twilio account for SMS verification
- OAuth credentials (Google & Apple Developer accounts)

## Installation

```bash
# Clone the repository
git clone https://github.com/surenshakhverdyan/multi-authentication.git

# Navigate to the project directory
cd multi-authentication

# Install dependencies
npm install

# Copy environment variables example file
cp .env.example .env
```

After copying the `.env.example` file to `.env`, you'll need to edit it with your specific configuration values.

## Configuration

Edit the `.env` file in the root directory with the following variables:

```env
# App
PORT=3000
CORS_ORIGIN=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_USER=your_mongodb_user
MONGODB_PASS=your_mongodb_password
MONGODB_DB=multi_auth

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password
SESSION_TTL=604800

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_CALLBACK_URL=http://localhost:3000/api/auth/apple/callback
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY_PATH=/path/to/your/apple/private/key.p8

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api/docs
```

## Authentication Endpoints

Note: All endpoints are prefixed with `/api`.

### OAuth2 Authentication

- **Google Authentication:**
  - `GET /api/auth/google` - Initiate Google OAuth2 flow
  - `GET /api/auth/google/callback` - Handle Google OAuth2 callback

- **Apple Authentication:**
  - `GET /api/auth/apple` - Initiate Apple OAuth2 flow
  - `GET /api/auth/apple/callback` - Handle Apple OAuth2 callback

### Phone Number Authentication

- **Phone Verification:**
  - `POST /api/auth/phone/send-code` - Send verification code to phone number
  - `POST /api/auth/phone/verify` - Verify phone number with received code
  - `POST /api/auth/phone/sign-in` - Sign in with verified phone number

### Traditional Authentication

- **Email/Password:**
  - `POST /api/auth/sign-up` - Register new user
  - `POST /api/auth/sign-in` - Login with email and password
  - `POST /api/auth/refresh-token` - Refresh access token
  - `POST /api/auth/sign-out` - Sign out current session
  - `POST /api/auth/sign-out-all` - Sign out all user sessions

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:cov
```

## Project Structure

```
src/
├── app.module.ts        # Main application module
├── main.ts              # Application entry point
├── auth/                # Authentication modules
│   ├── auth.module.ts   # Main auth module configuration
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth-w-phone-number.controller.ts
│   ├── auth-w-phone-number.service.ts
│   ├── dtos/           # Data transfer objects
│   ├── guards/         # Auth guards
│   ├── helpers/        # Helper functions
│   ├── middlewares/    # Auth middlewares
│   └── providers/      # Auth strategies
├── common/             # Shared modules
│   ├── crypto/         # Encryption services
│   ├── session/        # Session management
│   ├── token/          # JWT token handling
│   └── twilio/         # Twilio integration
└── user/               # User module
    ├── user.module.ts
    ├── user.service.ts
    └── schemas/        # MongoDB schemas
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

[MIT](LICENSE)

## Author

Suren Hakhverdyan
