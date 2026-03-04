from api.models import Logs


def log(username,action):
    """Log a user action to the Logs model"""
    try:
        Logs.objects.create(
            username=username,
            action=action
        )
    except Exception as e:
        print(f"[ERROR] Failed to log action: {e}")


def get_connection_logs(limit=50):
    """Get recent user connections"""
    try:
        logs = Logs.objects.all().order_by('-created_at')[:limit]
        return list(logs)
    except Exception as e:
        print(f"[ERROR] Failed to read logs: {e}")
        return []
    
