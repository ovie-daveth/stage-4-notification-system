## User Service

Microservice responsible for user management, authentication, and profile management in the distributed notification system.

### Features
- User registration and authentication (JWT)
- User profile management (CRUD operations)
- User preferences management (email/push notifications, quiet hours)
- Push token management (add/remove tokens)
- Role-based access control (user, admin)
- MongoDB persistence
- REST API endpoints for both public and internal service communication

### Setup
1. Install dependencies:
   ```
   npm install
   ```
2. Configure environment:
   ```
   cp env.example .env
   ```
   Update MongoDB URI, JWT secret, and other settings as needed.
3. Ensure MongoDB is running.
4. Start the service:
   ```
   npm run dev
   ```

### Environment Variables
See `env.example` for the full list, including:
- `PORT` - Service port (default: 4001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 7d)
- `CORS_ORIGIN` - Allowed CORS origin (production only)

### HTTP Endpoints

#### Public Endpoints
| Method | Path | Description |
| -- | -- | -- |
| `POST` | `/api/v1/users` | Register a new user |
| `POST` | `/api/v1/users/login` | Login and get access token |

#### Authenticated Endpoints
| Method | Path | Description |
| -- | -- | -- |
| `GET` | `/api/v1/users/me` | Get current user profile |
| `PATCH` | `/api/v1/users/me` | Update current user profile |
| `PATCH` | `/api/v1/users/me/preferences` | Update user preferences |
| `POST` | `/api/v1/users/me/push-tokens` | Add push token |
| `DELETE` | `/api/v1/users/me/push-tokens/:push_token` | Remove push token |

#### Admin Endpoints
| Method | Path | Description |
| -- | -- | -- |
| `GET` | `/api/v1/users` | List all users (paginated) |

#### Internal Service Endpoints (No Auth)
| Method | Path | Description |
| -- | -- | -- |
| `GET` | `/api/v1/users/:user_id` | Get user by ID (for email/push services) |
| `DELETE` | `/api/v1/users/:user_id/push-tokens/:push_token` | Remove push token (for push service) |

#### Health Check
| Method | Path | Description |
| -- | -- | -- |
| `GET` | `/health` | Returns service health information |

### Request/Response Examples

#### Register User
**Request:**
```json
POST /api/v1/users
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "+1234567890",
      "preferences": {
        "email_notifications": true,
        "push_notifications": true,
        "quiet_hours_start": null,
        "quiet_hours_end": null
      },
      "roles": ["user"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "access_token": "jwt_token"
  },
  "message": "User registered successfully",
  "error": null,
  "meta": { ... }
}
```

#### Login User
**Request:**
```json
POST /api/v1/users/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "jwt_token"
  },
  "message": "User logged in successfully",
  "error": null,
  "meta": { ... }
}
```

#### Get User by ID (Internal Service)
**Request:**
```
GET /api/v1/users/user_id_123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_id_123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "preferences": {
      "email_notifications": true,
      "push_notifications": true,
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "06:00"
    },
    "push_tokens": ["fcm_token_1", "fcm_token_2"],
    "is_active": true,
    ...
  },
  "message": "User retrieved successfully",
  "error": null,
  "meta": { ... }
}
```

### Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### User Model
- `user_id` - Unique user identifier (UUID)
- `email` - User email (unique, required)
- `password_hash` - Hashed password (required)
- `first_name` - User first name
- `last_name` - User last name
- `phone_number` - User phone number
- `push_tokens` - Array of push notification tokens
- `roles` - Array of user roles (default: ['user'])
- `preferences` - User preferences object
  - `email_notifications` - Boolean (default: true)
  - `push_notifications` - Boolean (default: true)
  - `quiet_hours_start` - String (format: "HH:MM") or null
  - `quiet_hours_end` - String (format: "HH:MM") or null
- `last_login_at` - Last login timestamp
- `is_active` - Boolean (default: true)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Testing
```
npm run lint
```
Add integration tests (Jest/Supertest) as needed.

### Integration with Other Services
- **Email Service**: Calls `GET /api/v1/users/:user_id` to fetch user profile and preferences
- **Push Service**: Calls `GET /api/v1/users/:user_id` to fetch user profile and push tokens, and `DELETE /api/v1/users/:user_id/push-tokens/:push_token` to remove invalid tokens
- **API Gateway**: Routes user management requests to this service

### Next Steps
- Add rate limiting for authentication endpoints
- Implement password reset functionality
- Add email verification
- Add two-factor authentication
- Implement user activity logging
- Add metrics and monitoring integration

