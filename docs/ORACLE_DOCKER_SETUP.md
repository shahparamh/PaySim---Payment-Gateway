# 🐳 Oracle Database via Docker

This project includes a `docker-compose.yml` file located in the `/docker` directory. This allows you to run a local instance of **Oracle Database Express Edition (XE)** using Docker, which is highly recommended for development.

## 🌟 Why use Docker for Oracle?

*   **No Manual Installation**: Oracle is difficult to install on personal computers (especially macOS). Docker handles the complexity for you.
*   **Isolation**: The database runs in a container, keeping your host system clean.
*   **Consistency**: Every team member runs the exact same environment.
*   **Offline Development**: You don't have to rely on cloud databases (like `db.freesql.com`) which can be slow or offline.

## 🚀 How to Start the Local Database

1.  **Ensure Docker is running** on your computer.
2.  Open your terminal and navigate to the `docker` directory:
    ```bash
    cd docker
    ```
3.  Start the container in the background:
    ```bash
    docker-compose up -d
    ```

## 🛠️ Local Credentials

When running through Docker, the database is initialized with the following credentials (defined in `docker-compose.yml`):

| Variable | Value |
| :--- | :--- |
| **Hostname** | `localhost` |
| **Port** | `1521` |
| **Username** | `Paysim` |
| **Password** | `paysim123` |
| **SID / Service Name** | `XE` |

> [!NOTE]  
> These credentials are for **local development only**. They do not need to match your cloud database settings.

## 🔗 Connecting the App to Docker

To tell the backend to use this local database instead of the cloud one, update your `backend/.env` file:

```env
DB_TYPE=oracle
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_USER=Paysim
ORACLE_PASSWORD=paysim123
ORACLE_DB=XE
```
