import firebase_admin
from firebase_admin import credentials, messaging
import os
from django.conf import settings

_is_initialized = False

def initialize_firebase():
    global _is_initialized
    if _is_initialized:
        return

    try:
        # Check if already initialized by checking apps
        if not firebase_admin._apps:
            # You can load credentials from a file or environment variables
            # For now, we'll try to use Application Default Credentials (ADC)
            # or check for a specific key file path in settings
            
            cred = None
            key_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
            
            if key_path and os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
            else:
                # Use ADC or assume initialized elsewhere
                cred = credentials.ApplicationDefault()

            firebase_admin.initialize_app(cred)
            _is_initialized = True
            print("Firebase Admin initialized successfully")
    except Exception as e:
        print(f"Failed to initialize Firebase Admin: {e}")

def send_fcm_message(token, title, body, data=None):
    """
    Send a single FCM message.
    """
    initialize_firebase()
    
    if not token:
        return None

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        return response
    except Exception as e:
        print(f"Error sending FCM message: {e}")
        return None

def send_fcm_multicast(tokens, title, body, data=None):
    """
    Send multicast FCM message to multiple tokens.
    """
    initialize_firebase()
    
    if not tokens:
        return None

    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )
        response = messaging.send_each_for_multicast(message)
        return response
    except Exception as e:
        print(f"Error sending FCM multicast: {e}")
        return None

def send_fcm_topic_message(topic, title, body, data=None):
    """
    Send FCM message to a topic (e.g., 'all_users').
    """
    initialize_firebase()
    
    if not topic:
        return None

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            topic=topic,
        )
        response = messaging.send(message)
        return response
    except Exception as e:
        print(f"Error sending FCM topic message: {e}")
        return None
