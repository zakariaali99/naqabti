import uuid
from niqabaty.models import Notification, Device, User
from niqabaty.utils.firebase import send_fcm_multicast, send_fcm_topic_message
import logging

logger = logging.getLogger(__name__)

def send_notification(
    title, 
    message, 
    user_ids=None, 
    send_to_all_devices=False, 
    notification_type='info', 
    content_type=None, 
    object_id=None,
    created_by=None,
    batch_id=None,
    source='manual',
):
    """
    Centralized utility to send notifications.
    Creates database records and sends FCM messages.
    """
    try:
        if not batch_id:
            batch_id = uuid.uuid4()

        if send_to_all_devices:
            send_fcm_topic_message(
                topic='general',
                title=title,
                body=message,
                data={
                    'type': notification_type,
                    'content_type': str(content_type) if content_type else '',
                    'object_id': str(object_id) if object_id else ''
                }
            )

            if user_ids:
                users = User.objects.filter(id__in=user_ids)
                notifications = [
                    Notification(
                        user=user,
                        title=title,
                        message=message,
                        notification_type=notification_type,
                        content_type=content_type,
                        object_id=object_id,
                        send_to_all_devices=False,
                        batch_id=batch_id,
                        created_by=created_by,
                        source=source,
                    )
                    for user in users
                ]
                Notification.objects.bulk_create(notifications, batch_size=1000)
                return True, f"{len(notifications)} notifications sent"
            else:
                admin_user = User.objects.filter(is_superuser=True).first() or created_by
                Notification.objects.create(
                    user=admin_user,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    content_type=content_type,
                    object_id=object_id,
                    send_to_all_devices=True,
                    batch_id=batch_id,
                    created_by=created_by,
                    source=source,
                )
                return True, "Broadcast notification sent"

        if not user_ids:
            return False, "User IDs are required for non-broadcast notifications"

        users = User.objects.filter(id__in=user_ids)
        if not users.exists():
            return False, "No valid users found"

        notifications_count = 0
        for user in users:
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                content_type=content_type,
                object_id=object_id,
                send_to_all_devices=False,
                batch_id=batch_id,
                created_by=created_by,
                source=source,
            )
            notifications_count += 1

            # Send FCM multicast specifically for this user's devices
            tokens = list(Device.objects.filter(user=user).values_list('fcm_token', flat=True))
            if tokens:
                send_fcm_multicast(
                    tokens=tokens,
                    title=title,
                    body=message,
                    data={
                        'notification_id': str(notification.id),
                        'type': notification_type,
                        'content_type': str(content_type) if content_type else '',
                        'object_id': str(object_id) if object_id else ''
                    }
                )
            
        return True, f"{notifications_count} notifications sent"

    except Exception as e:
        logger.error(f"Error in send_notification: {str(e)}")
        return False, str(e)
