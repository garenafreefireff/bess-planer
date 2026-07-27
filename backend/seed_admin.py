import argparse
import asyncio
import sys

from app.core.config import get_settings
from app.db.indexes import ensure_indexes
from app.db.mongodb import create_mongodb_client, get_database, ping_database
from app.modules.auth.admin_seed import seed_admin_user


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed or promote an EnergyInsight admin user.")
    parser.add_argument("--email", required=True, help="Admin email address.")
    parser.add_argument("--password", help="Admin password. Required for new users or password reset.")
    parser.add_argument("--name", default="EnergyInsight Admin", help="Admin display name.")
    parser.add_argument("--company", default="DataInsight", help="Admin company name.")
    parser.add_argument("--phone", default=None, help="Admin phone number.")
    parser.add_argument("--industry", default=None, help="Admin industry.")
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="Reset password if the admin user already exists.",
    )
    return parser.parse_args()


async def main() -> int:
    args = parse_args()
    settings = get_settings()
    client = create_mongodb_client(settings.mongodb_uri)

    try:
        database = get_database(client, settings.mongodb_database)
        await ping_database(database)
        await ensure_indexes(database)
        result = await seed_admin_user(
            database,
            settings,
            email=args.email,
            password=args.password,
            representative_name=args.name,
            company_name=args.company,
            phone=args.phone,
            industry=args.industry,
            reset_password=args.reset_password,
        )
    except Exception as exc:
        print(f"Could not seed admin user: {exc}", file=sys.stderr)
        return 1
    finally:
        client.close()

    action = "created" if result.created else "updated"
    details = []
    if result.promoted:
        details.append("promoted to admin")
    if result.password_updated:
        details.append("password updated")
    suffix = f" ({', '.join(details)})" if details else ""
    print(f"Admin user {action}: {result.email}{suffix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
