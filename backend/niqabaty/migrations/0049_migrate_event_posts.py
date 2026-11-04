from django.db import migrations


def migrate_event_posts(apps, schema_editor):
    Post = apps.get_model('niqabaty', 'Post')
    Event = apps.get_model('niqabaty', 'Event')
    
    event_posts = Post.objects.filter(post_type='event', is_deleted=False)
    
    events = []
    for post in event_posts:
        events.append(Event(
            title=post.title,
            content=post.content or "",
            excerpt=post.excerpt,
            featured_image=post.featured_image,
            event_date=post.created_at,
            status=post.status,
            author=post.author,
            published_at=post.published_at,
            views_count=post.views_count,
            is_featured=post.is_featured,
            notification_sent=post.notification_sent,
            created_by=post.created_by,
            updated_by=post.updated_by,
            created_at=post.created_at,
            updated_at=post.updated_at,
            is_deleted=False,
        ))
    
    Event.objects.bulk_create(events)


def reverse_migrate_event_posts(apps, schema_editor):
    Event = apps.get_model('niqabaty', 'Event')
    Event.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('niqabaty', '0048_historicalevent_event'),
    ]

    operations = [
        migrations.RunPython(migrate_event_posts, reverse_migrate_event_posts),
    ]
