from django.db import migrations


CITY_COORDS = {
    "Tripoli": (32.8976, 13.1753),
    "Benghazi": (32.1167, 20.0667),
    "Misrata": (32.3778, 15.0901),
    "Ajdabiya": (30.7556, 20.2253),
    "Al Bayda": (32.7628, 21.7550),
    "Az Zawiyah": (32.7544, 12.7297),
    "Tarhuna": (32.4350, 13.6333),
    "Al Khums": (32.6500, 14.2667),
    "Al Marj": (32.4926, 20.8291),
    "Derna": (32.7636, 22.6361),
    "Tobruk": (32.0833, 23.9500),
    "Sabha": (27.0333, 14.4333),
    "Sirte": (31.2000, 16.6000),
    "Zliten": (32.4667, 14.5667),
    "Gharyan": (32.1669, 13.0167),
    "Zuwara": (32.9333, 12.0833),
    "Ghat": (24.9611, 10.1750),
    "Murzuq": (25.9136, 13.9336),
}


def seed_coords(apps, schema_editor):
    City = apps.get_model('niqabaty', 'City')
    for name, (lat, lng) in CITY_COORDS.items():
        City.objects.filter(name__iexact=name).update(latitude=lat, longitude=lng)


class Migration(migrations.Migration):

    dependencies = [
        (
            "niqabaty",
            "0058_city_latitude_city_longitude_historicalcity_latitude_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(seed_coords),
    ]