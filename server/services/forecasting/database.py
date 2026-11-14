
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine


# Locate the existing server/.env file
SERVER_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = SERVER_DIR / ".env"

load_dotenv(ENV_PATH)

# Read PostgreSQL credentials
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")


def get_database_engine():
    required_values = {
        "DB_HOST": DB_HOST,
        "DB_PORT": DB_PORT,
        "DB_NAME": DB_NAME,
        "DB_USER": DB_USER,
        "DB_PASSWORD": DB_PASSWORD,
    }

    missing = [
        name for name, value in required_values.items()
        if not value
    ]

    if missing:
        raise ValueError(
            f"Missing database settings in server/.env: {missing}"
        )

    connection_url = (
        f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    return create_engine(connection_url)


def test_connection():
    engine = get_database_engine()

    with engine.connect() as connection:
        result = connection.exec_driver_sql("SELECT version()")
        print("PostgreSQL connection successful!")
        print(result.fetchone()[0])


if __name__ == "__main__":
    test_connection()
