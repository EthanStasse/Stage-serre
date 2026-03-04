from api.models import Logs


def log_user_connection(username):
    """Log a user connection to the Logs model"""
    try:
        Logs.objects.create(
            username=username,
            action='login'
        )
    except Exception as e:
        print(f"[ERROR] Failed to log connection: {e}")


def get_connection_logs(limit=50):
    """Get recent user connections"""
    try:
        logs = Logs.objects.all().order_by('-created_at')[:limit]
        return list(logs)
    except Exception as e:
        print(f"[ERROR] Failed to read logs: {e}")
        return []
    
def log_user_action(username, action):
    """Log a user action to the Logs model"""
    try:
        Logs.objects.create(
            username=username,
            action=action
        )
    except Exception as e:
        print(f"[ERROR] Failed to log user action: {e}")
