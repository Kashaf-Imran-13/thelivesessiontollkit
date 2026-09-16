# Database Documentation & Setup Guide

This directory contains the database schema definitions and seed data for the Session Platform.

## Files
- `schema.sql`: Contains table definitions (`sessions`, `participants`, `session_activities`), constraints, and indexes.
- `seed.sql`: Realistic mock data to quickly populate the database for demonstration and testing.

## Quick Setup with MySQL CLI

1. **Connect to your MySQL server**:
   ```bash
   mysql -u root -p
   ```

2. **Run the schema migration**:
   ```bash
   mysql -u root -p < schema.sql
   ```

3. **(Optional) Seed sample data**:
   ```bash
   mysql -u root -p < seed.sql
   ```

## Entity Relationship Overview

```
+--------------------+           +----------------------+
|      sessions      | 1       * |     participants     |
+--------------------+-----------+----------------------+
| id (PK)            |           | id (PK)              |
| session_code (UQ)  |           | session_id (FK)      |
| title              |           | name                 |
| description        |           | role (host/attendee) |
| topic              |           | is_active            |
| host_name          |           | joined_at            |
| status             |           | left_at              |
| max_participants   |           +----------------------+
| created_at         |
| started_at         | 1       * +----------------------+
| ended_at           |-----------|  session_activities  |
+--------------------+           +----------------------+
                                 | id (PK)              |
                                 | session_id (FK)      |
                                 | participant_name     |
                                 | activity_type        |
                                 | message              |
                                 | created_at           |
                                 +----------------------+
```
