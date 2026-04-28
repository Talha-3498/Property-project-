# Property Project Backend

## Setup

1. Copy `.env.example` to `.env`
2. Update values:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CORS_ORIGIN` (your frontend URL)
3. Install packages:

```bash
npm install
```

4. Start API:

```bash
npm run dev
```

## Create First Admin

Register normally from frontend (`/api/register`), then update role in MongoDB:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } });
```

## API

- `POST /api/register`
- `POST /api/login`
- `GET /api/properties`
- `GET /api/properties/:id`
- `POST /api/properties/submit` (auth, user submission for review)
- `GET /api/properties/my/submissions` (auth)
- `POST /api/orders` (auth)
- `GET /api/orders` (auth)
- `POST /api/sell-leads`
- `GET /api/admin/orders` (admin)
- `PUT /api/admin/orders/:id/status` (admin)
- `GET /api/admin/properties` (admin, includes pending/rejected)
- `POST /api/admin/properties` (admin)
- `PUT /api/admin/properties/:id` (admin)
- `PUT /api/admin/properties/:id/status` (admin approve/reject)
- `DELETE /api/admin/properties/:id` (admin)
- `GET /api/admin/users` (admin)
- `GET /api/admin/sell-leads` (admin)
- `PUT /api/admin/sell-leads/:id/status` (admin)

## Seed dummy data

```bash
npm run seed
```
