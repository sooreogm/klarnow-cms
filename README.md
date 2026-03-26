# NextCMS

A full-stack article CMS built with React, Vite, Express, and PostgreSQL.

## Tech Stack

-   **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Radix UI (shadcn)
-   **Backend**: Express.js, Node.js, TypeScript
-   **Database**: PostgreSQL (Aiven), Drizzle ORM
-   **Features**: Rich text editor (TipTap), Authentication ready, Responsive design
-   **Media uploads**: Server-side image uploads to PocketBase

## Quick Start

### Prerequisites

-   Node.js 20+
-   PostgreSQL database
-   (Optional) Docker and Docker Compose

### Local Development

1. **Install dependencies:**

    ```bash
    npm install
    ```

2. **Set up environment variables:**

    Create a `.env` file in the root directory:

    ```env
    DATABASE_URL=postgres://your-connection-string
    NODE_ENV=development
    NODE_TLS_REJECT_UNAUTHORIZED=0
    PORT=5500
    POCKETBASE_URL=https://pbase.example.com
    POCKETBASE_ADMIN_EMAIL=service-account@example.com
    POCKETBASE_ADMIN_PASSWORD=replace-me
    ```

3. **Push database schema:**

    ```bash
    npm run db:push
    ```

4. **Start the development server:**

    ```bash
    npm run dev
    ```

    The app will be available at `http://localhost:5500`

### Docker (Local)

1. **Build the image:**

    ```bash
    docker build -t nextcms .
    ```

2. **Run with Docker:**

    ```bash
    docker run -p 5500:5500 --env-file .env nextcms
    ```

3. **Or use Docker Compose:**
    ```bash
    docker-compose up
    ```

### Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm start` - Start production server
-   `npm run db:push` - Push database schema to PostgreSQL
-   `npm run check` - Run TypeScript type checking

## Project Structure

```
NextCMS/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/   # Page components
│       ├── components/
│       └── lib/
├── server/          # Express backend
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Database operations
│   └── index.ts     # Entry point
├── shared/          # Shared types/schemas
│   └── schema.ts    # Drizzle schema
└── dist/            # Build output (generated)
```

## API Endpoints

-   `GET /api/stats` - Get dashboard statistics
-   `GET /api/categories` - Get all categories
-   `POST /api/categories` - Create category
-   `GET /api/articles` - Get all articles
-   `POST /api/articles` - Create article
-   `GET /api/comments` - Get all comments
-   `POST /api/uploads/images` - Upload article and cover images to PocketBase
-   And more...

## Environment Variables

-   `DATABASE_URL` - PostgreSQL connection string (required)
-   `NODE_ENV` - Environment (development/production)
-   `NODE_TLS_REJECT_UNAUTHORIZED` - Set to 0 for self-signed certificates
-   `PORT` - Server port (default: 5500)
-   `POCKETBASE_URL` - Hosted PocketBase base URL
-   `POCKETBASE_ADMIN_EMAIL` - PocketBase server-side upload account email
-   `POCKETBASE_ADMIN_PASSWORD` - PocketBase server-side upload account password

## License

MIT
