# Database Setup

The `setup-tables.sql` file contains SQL statements to create three necessary tables:
- **clients**: stores customer information
- **products**: stores product catalog
- **users**: manages system access

## Steps to execute:

1. **Open your Supabase project** at https://app.supabase.com/projects
2. **Sign in** with your account
3. **Select the project** `pnmzzgsgmqgzdwsodfla`
4. **Go to SQL Editor** (in the left sidebar)
5. **Click "New Query"**
6. **Copy all content from `setup-tables.sql`** and **paste it** in the editor
7. **Click "Run"** (blue button at the top)

The console will show that the tables were created successfully.

## Alternative (if you have the service_role key):

If you have access to the `SERVICE_ROLE_KEY`, you can run this command in the terminal:

```bash
node scripts/createTablesWithServiceRole.js
```

You would need a `.env.local` file with:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Verify that tables exist

After running the SQL, in Supabase go to:
- **Database** > **Tables** 
- You should see `clients`, `products`, and `users` listed.
