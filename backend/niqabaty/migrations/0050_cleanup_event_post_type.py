from django.db import migrations


def cleanup_event_posts(apps, schema_editor):
    Post = apps.get_model('niqabaty', 'Post')
    deleted_count, _ = Post.objects.filter(post_type='event').delete()
    if deleted_count:
        print(f"  Deleted {deleted_count} Post records with post_type='event'")


class Migration(migrations.Migration):
    dependencies = [
        ('niqabaty', '0049_migrate_event_posts'),
    ]

    operations = [
        migrations.RunPython(cleanup_event_posts, migrations.RunPython.noop),
    ]
