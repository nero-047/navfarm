# Windows RDP development-server deployment

This runbook hosts the current NAVFarm API, web application and MySQL on one
Windows Server. It is a shared **demo/testing** deployment, not a production
architecture.

## Current test server

- Server address: `103.234.185.14`
- RDP management endpoint: `103.234.185.14:9296`

Port `9296` is only the Remote Desktop port. It is not the NAVFarm web port,
API port, or MySQL port and must not appear in the NAVFarm environment files.
The screenshot confirms that IIS is already installed, so the preferred public
shape is IIS on HTTPS port 443 proxying to a private web process on 3002 and API
process on 2877.

## What is required

- Windows Server with inbound RDP restricted to the administrators who need it.
- Node.js 24 and Corepack/pnpm 11.10.0.
- Git.
- MySQL 8, running as a Windows service.
- A DNS name and HTTPS reverse proxy are strongly recommended for testers.

Redis is **not required by the current application**. There is no Redis client,
module or `REDIS_*` environment read in the API or web application. Installing a
Redis server or adding a `REDIS_URL` today has no effect.

## Inspect the existing MySQL installation

Open PowerShell as Administrator on the RDP server. These commands do not reveal
the database password:

```powershell
# Find the Windows service and whether it is running.
Get-Service | Where-Object { $_.Name -match 'mysql|maria' -or $_.DisplayName -match 'mysql|maria' }

# Show the executable/configuration used by the service.
Get-CimInstance Win32_Service |
  Where-Object { $_.Name -match 'mysql|maria' -or $_.DisplayName -match 'mysql|maria' } |
  Select-Object Name, State, StartMode, PathName

# Confirm which process is listening on the normal MySQL port.
Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, OwningProcess

# Find the CLI and print its version, if it is on PATH.
Get-Command mysql -ErrorAction SilentlyContinue
mysql --version
```

If `mysql` is not on `PATH`, its usual location is
`C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`. Use the `PathName`
reported for the service to locate the actual installation and `my.ini`.

The existing MySQL password cannot be displayed in plaintext. Obtain it from
the server owner/password manager, or follow MySQL's controlled password-reset
procedure if it has been lost. When a credential is available, connect locally:

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p
```

Enter the password only at the prompt, then inspect the server:

```sql
SELECT VERSION() AS mysql_version, @@hostname AS host, @@port AS port,
       @@datadir AS data_directory;
SHOW VARIABLES LIKE 'bind_address';
SHOW DATABASES;
SELECT user, host, plugin FROM mysql.user ORDER BY user, host;
```

For NAVFarm, confirm whether the required databases already exist:

```sql
SHOW DATABASES LIKE 'navfarm_master';
SHOW DATABASES LIKE 'tenant_system';
SHOW DATABASES LIKE 'tenant\_%';
```

Use `127.0.0.1` as `DATABASE_HOST` when MySQL and NAVFarm run on this same
Windows server. Keep TCP 3306 closed publicly; the application does not need a
public MySQL endpoint.

## Environment files

Create these files directly on the server. Both are ignored by Git and must
never be committed.

### `apps/api/.env`

```dotenv
NODE_ENV=production
PORT=2877
API_PREFIX=api/v1
API_DOCS_PATH=api/docs

# Exact browser origins only; comma-separate additional origins.
# Do not add a trailing slash.
CORS_ORIGINS=https://navfarm-dev.example.com
FRONTEND_URL=https://navfarm-dev.example.com

# Keep uploads outside the Git checkout so a pull/redeploy does not remove them.
UPLOADS_DIR=C:/NAVFarm/data/uploads

# MySQL is on this Windows server.
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USERNAME=navfarm_app
DATABASE_PASSWORD=REPLACE_WITH_MYSQL_PASSWORD
DATABASE_NAME=navfarm_master
DATABASE_SSL=false

# Generate independent long random values. Never reuse the examples.
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=REPLACE_WITH_A_DIFFERENT_LONG_RANDOM_SECRET

SYSTEM_TENANT_DATABASE=tenant_system
SYSTEM_ADMIN_NAME="NAVFarm System Administrator"
SYSTEM_ADMIN_EMAIL=REPLACE_WITH_ADMIN_EMAIL
SYSTEM_ADMIN_PASSWORD=REPLACE_WITH_A_STRONG_ADMIN_PASSWORD

# Demo tenant seeded for testing. These are not Triple C production records.
DEV_TENANT_CODE=devco
DEV_TENANT_NAME="Triple C Demo"
DEV_COMPANY_CODE=TRIPLEC
DEV_COMPANY_NAME="Triple C Demo"

# Optional until real SMTP details are available. Password reset/email delivery
# will not work with blank credentials.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME="NAVFarm Support"
```

If the web application is exposed directly on port 3002 instead of through
HTTPS, use the exact public address in both URL fields, for example
`http://SERVER_NAME_OR_IP:3002`. Every browser origin used by testers must be in
`CORS_ORIGINS`.

### `apps/web/.env.local`

Preferred values when IIS/Nginx exposes the API at the same HTTPS host:

```dotenv
NEXT_PUBLIC_API_URL=https://navfarm-dev.example.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://navfarm-dev.example.com
```

Direct-port values when there is no reverse proxy:

```dotenv
NEXT_PUBLIC_API_URL=http://SERVER_NAME_OR_IP:2877/api/v1
NEXT_PUBLIC_SOCKET_URL=http://SERVER_NAME_OR_IP:2877
```

`NEXT_PUBLIC_*` values are compiled into the browser bundle. Change them before
running the web production build, then rebuild whenever they change.

There are currently no application environment variables for Redis or R2.

## Install and build

Run in an elevated PowerShell only where administrator access is required:

```powershell
corepack enable
corepack prepare pnpm@11.10.0 --activate
pnpm install --frozen-lockfile
pnpm nx run-many -t build -p api web
```

The API build entry point is `apps/api/dist/main.js`. The web production output
is `apps/web/.next`.

## Database setup and demo seed

The MySQL account must be able to create and migrate `navfarm_master`,
`tenant_system`, and `tenant_<code>` databases. Do not expose MySQL port 3306 to
the public internet.

On a new, dedicated test database server:

```powershell
pnpm nx run api:db-seed-demo --fresh
```

`--fresh` drops and recreates the configured master, system and demo-tenant
databases. Never run it against a database containing data that must be kept.
After seeding, verify the users, company/area assignments, roles and important
master counts directly in MySQL, then sign in with every seeded role.

## Start the applications

From the repository root:

```powershell
node apps/api/dist/main.js
pnpm nx run web:start -- --port=3002
```

For a persistent shared server, register each command with a Windows service
wrapper or Task Scheduler using the repository root as its working directory.
Configure automatic restart and separate log files. Do not rely on an open RDP
terminal to keep either process alive.

Expose only HTTPS port 443 through the Windows firewall when using a reverse
proxy. If direct ports are temporarily used, allow TCP 3002 and 2877 only from
the testers' known networks; keep 3306 private.

## Redis later, if a feature actually adopts it

Do not install Redis merely for this deployment. When caching, queues, distributed
rate limiting or Socket.IO scaling is implemented, add a supported Redis client
to the API first and define the environment contract in code.

For Windows Server, the practical choices are:

1. A managed Redis service — simplest operationally.
2. Memurai, Redis's Windows compatibility partner, for a native Windows service.
3. Redis under WSL2 on Windows Server 2022/2025.

For WSL2, run `wsl.exe --install` in Administrator PowerShell and restart, then
install Redis inside Ubuntu from the official Redis APT repository. Keep Redis
bound to localhost/protected mode and do not open port 6379 publicly. A future
application integration would likely use a single secret such as:

```dotenv
REDIS_URL=redis://:REPLACE_WITH_REDIS_PASSWORD@127.0.0.1:6379/0
```

That variable is illustrative only: the current NAVFarm code does not read it.
