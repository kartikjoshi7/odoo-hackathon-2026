from app.core.database import AsyncSessionLocal
from app.models.audit import AuditLog

async def log_audit_event(user_id: int, action: str, target_entity: str):
    """
    Background task to securely log audit events without blocking HTTP responses.
    Creates its own transient database session.
    """
    async with AsyncSessionLocal() as db:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            target_entity=target_entity
        )
        db.add(log_entry)
        await db.commit()
