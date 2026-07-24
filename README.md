# Sistema contable + Supabase

This project is integrated with Supabase as a backend database.

## 1) Configuration

1. Create a project in Supabase.
2. Copy the `.env.example` file to `.env`.
3. Complete these variables:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

You can find these values in Supabase: Project Settings > API.

## 2) Run the project

```
npm install
npm run dev
```

## 3) Test connection with Supabase

The main screen shows:

- Connection status to the backend.
- A form to query a table (e.g., `products`) and see the first 10 records.

## Database Structure

### Tables

- **clients**: Store customer information
- **products**: Store product catalog
- **users**: User access control

### How to create tables

See `scripts/README.md` for detailed instructions.
