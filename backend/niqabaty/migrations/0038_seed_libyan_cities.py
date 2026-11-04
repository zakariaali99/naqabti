from django.db import migrations

def seed_libyan_cities(apps, schema_editor):
    City = apps.get_model('niqabaty', 'City')
    cities = [
        {'name': 'Tripoli', 'region': 'Northwest', 'prefix': 'TRP'},
        {'name': 'Benghazi', 'region': 'Northeast', 'prefix': 'BNG'},
        {'name': 'Misrata', 'region': 'Northwest', 'prefix': 'MIS'},
        {'name': 'Zawiya', 'region': 'Northwest', 'prefix': 'ZAW'},
        {'name': 'Beida', 'region': 'Northeast', 'prefix': 'BEI'},
        {'name': 'Gharyan', 'region': 'Northwest', 'prefix': 'GHA'},
        {'name': 'Tobruk', 'region': 'Northeast', 'prefix': 'TOB'},
        {'name': 'Ajdabiya', 'region': 'Northeast', 'prefix': 'AJD'},
        {'name': 'Derna', 'region': 'Northeast', 'prefix': 'DER'},
        {'name': 'Sirte', 'region': 'Northwest', 'prefix': 'SIR'},
        {'name': 'Sabha', 'region': 'Southwest', 'prefix': 'SAB'},
        {'name': 'Zliten', 'region': 'Northwest', 'prefix': 'ZLI'},
        {'name': 'Al Khums', 'region': 'Northwest', 'prefix': 'KHU'},
        {'name': 'Sabratha', 'region': 'Northwest', 'prefix': 'SBR'},
        {'name': 'Surman', 'region': 'Northwest', 'prefix': 'SUR'},
        {'name': 'Ghadames', 'region': 'Northwest', 'prefix': 'GDM'},
        {'name': 'Murzuq', 'region': 'Southwest', 'prefix': 'MUR'},
        {'name': 'Ghat', 'region': 'Southwest', 'prefix': 'GHT'},
        {'name': 'Nalut', 'region': 'Northwest', 'prefix': 'NAL'},
        {'name': 'Bani Walid', 'region': 'Northwest', 'prefix': 'BNW'},
        {'name': 'Al Aziziyah', 'region': 'Northwest', 'prefix': 'AZI'},
        {'name': 'Al Marj', 'region': 'Northeast', 'prefix': 'MAR'},
    ]
    for city_data in cities:
        City.objects.get_or_create(name=city_data['name'], defaults=city_data)

class Migration(migrations.Migration):

    dependencies = [
        ('niqabaty', '0037_alter_historicaluser_city_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_libyan_cities),
    ]
