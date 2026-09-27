# Ticket Board

Simple Azure Boards–style ticket management: bugs, features, and tasks on a kanban board with user assignment and image uploads.

## Features

- Kanban columns: **New → Active → Resolved → Closed** (drag & drop)
- Ticket types: Bug, Feature, Task
- Assign tickets between users
- Upload & attach images to tickets
- MongoDB Atlas storage

## Setup

1. Install dependencies:

```bash
npm install
```

2. `.env.local` is already configured with your MongoDB URI.

3. Seed demo users & tickets (optional):

```bash
npm install dotenv --save-dev
npm run seed
```

4. Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Pick yourself from the avatar bar (or add a user with **+**).
2. Click **+ New ticket**, set type/priority, assign someone, attach images.
3. Drag cards between columns to update status.
4. Click a card to edit, reassign, or delete.
