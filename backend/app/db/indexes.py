from motor.motor_asyncio import AsyncIOMotorDatabase


async def ensure_indexes(database: AsyncIOMotorDatabase) -> None:
    await database["users"].create_index("email", unique=True)
    await database["users"].create_index("created_at", name="admin_dashboard_users_created_at")
    await database["users"].create_index(
        [("status", 1), ("created_at", -1)],
        name="admin_dashboard_users_status_created_at",
    )
    await database["users"].create_index(
        [("role", 1), ("created_at", -1)],
        name="admin_dashboard_users_role_created_at",
    )
    await database["users"].create_index("company_name", name="admin_files_users_company_name")
    await database["users"].create_index("representative_name", name="admin_search_users_representative_name")
    await database["auth_sessions"].create_index("refresh_token_hash", unique=True)
    await database["auth_sessions"].create_index("user_id")
    await database["auth_sessions"].create_index("expires_at", expireAfterSeconds=0)
    await database["sites"].create_index([("user_id", 1), ("updated_at", -1)])
    await database["sites"].create_index([("user_id", 1), ("code", 1)], unique=True)
    await database["sites"].create_index("tariff_id")
    await database["projects"].create_index([("user_id", 1), ("updated_at", -1)])
    await database["projects"].create_index(
        "created_at",
        name="admin_dashboard_projects_created_at",
    )
    await database["projects"].create_index(
        [("status", 1), ("created_at", -1)],
        name="admin_dashboard_projects_status_created_at",
    )
    await database["projects"].create_index(
        [("project_type", 1), ("created_at", -1)],
        name="admin_dashboard_projects_type_created_at",
    )
    await database["projects"].create_index("site_id")
    await database["projects"].create_index("bess_catalog_id")
    await database["projects"].create_index("latest_analysis_run_id")
    await database["projects"].create_index("active_load_dataset_id")
    await database["projects"].create_index("active_pv_dataset_id")
    await database["projects"].create_index("dataset_ids")
    await database["projects"].create_index("name", name="admin_search_projects_name")
    await database["tariffs"].create_index("code", unique=True)
    await database["tariffs"].create_index([("status", 1), ("effective_from", -1)])
    await database["tariffs"].create_index("voltage_level")
    await database["bess_catalog"].create_index("code", unique=True)
    await database["bess_catalog"].create_index([("status", 1), ("version", -1)])
    await database["analysis_runs"].create_index([("user_id", 1), ("created_at", -1)])
    await database["analysis_runs"].create_index(
        "created_at",
        name="admin_dashboard_analysis_created_at",
    )
    await database["analysis_runs"].create_index(
        "completed_at",
        name="admin_dashboard_analysis_completed_at",
    )
    await database["analysis_runs"].create_index(
        [("status", 1), ("created_at", -1)],
        name="admin_dashboard_analysis_status_created_at",
    )
    await database["analysis_runs"].create_index(
        [("analysis_type", 1), ("created_at", -1)],
        name="admin_dashboard_analysis_type_created_at",
    )
    await database["analysis_runs"].create_index([("user_id", 1), ("analysis_type", 1)])
    await database["analysis_runs"].create_index("project_id")
    await database["analysis_runs"].create_index("bess_catalog_id")
    await database["analysis_runs"].create_index("input_snapshot.active_datasets.load_profile.dataset_id")
    await database["analysis_runs"].create_index("input_snapshot.active_datasets.pv_profile.dataset_id")
    await database["files"].create_index([("user_id", 1), ("updated_at", -1)])
    await database["files"].create_index("created_at", name="admin_dashboard_files_created_at")
    await database["files"].create_index(
        [("status", 1), ("created_at", -1)],
        name="admin_dashboard_files_status_created_at",
    )
    await database["files"].create_index(
        [("kind", 1), ("created_at", -1)],
        name="admin_dashboard_files_kind_created_at",
    )
    await database["files"].create_index(
        [("user_id", 1), ("created_at", -1)],
        name="admin_dashboard_files_user_created_at",
    )
    await database["files"].create_index("project_id")
    await database["files"].create_index("sha256")
    await database["files"].create_index([("user_id", 1), ("project_id", 1), ("kind", 1), ("sha256", 1)])
    await database["files"].create_index([("user_id", 1), ("project_id", 1), ("kind", 1), ("version", -1)])
    await database["files"].create_index([("extension", 1), ("created_at", -1)], name="admin_files_extension_created_at")
    await database["files"].create_index("original_name", name="admin_files_original_name")
    await database["datasets"].create_index([("user_id", 1), ("updated_at", -1)])
    await database["datasets"].create_index("project_id")
    await database["datasets"].create_index("file_id", unique=True)
    await database["datasets"].create_index([("user_id", 1), ("project_id", 1), ("dataset_type", 1), ("updated_at", -1)])
    await database["leads"].create_index("email", unique=True)
    await database["leads"].create_index("created_at", name="admin_dashboard_leads_created_at")
    await database["leads"].create_index(
        [("status", 1), ("created_at", -1)],
        name="admin_dashboard_leads_status_created_at",
    )
    await database["leads"].create_index([("status", 1), ("updated_at", -1)])
    await database["leads"].create_index([("sources", 1), ("updated_at", -1)])
    await database["notification_outbox"].create_index(
        [("status", 1), ("created_at", -1)],
        name="admin_dashboard_notification_status_created_at",
    )


