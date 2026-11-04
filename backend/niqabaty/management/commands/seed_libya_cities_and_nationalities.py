import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from niqabaty.models import City, Nationality, User

# Complete list of 184 nationality translations parsed from frontend locale
NATIONALITY_TRANSLATIONS = {
    "Afghan": "أفغاني",
    "Albanian": "ألباني",
    "Algerian": "جزائري",
    "American": "أمريكي",
    "Andorran": "أندوري",
    "Angolan": "أنغولي",
    "Argentine": "أرجنتيني",
    "Armenian": "أرميني",
    "Australian": "أسترالي",
    "Austrian": "نمساوي",
    "Azerbaijani": "أذربيجاني",
    "Bahamian": "باهامي",
    "Bahraini": "بحريني",
    "Bangladeshi": "بنغلاديشي",
    "Barbadian": "باربادوسي",
    "Belarusian": "بيلاروسي",
    "Belgian": "بلجيكي",
    "Belizean": "بليزي",
    "Beninese": "بنيني",
    "Bhutanese": "بوتاني",
    "Bolivian": "بوليفي",
    "Bosnian": "بوسني",
    "Brazilian": "برازيلي",
    "British": "بريطاني",
    "Bruneian": "بروني",
    "Bulgarian": "بلغاري",
    "Burkinabe": "بوركيني",
    "Burmese": "بورمي",
    "Burundian": "بوروندي",
    "Cambodian": "كمبودي",
    "Cameroonian": "كاميروني",
    "Canadian": "كندي",
    "Cape Verdean": "كاب فيردي",
    "Chadian": "تشادي",
    "Chilean": "شيلي",
    "Chinese": "صيني",
    "Colombian": "كولومبي",
    "Comoran": "قُمري",
    "Congolese": "كونغولي",
    "Costa Rican": "كوستاريكي",
    "Croatian": "كرواتي",
    "Cuban": "كوبي",
    "Cypriot": "قبرصي",
    "Czech": "تشيكي",
    "Danish": "دانمركي",
    "Djiboutian": "جيبوتي",
    "Dominican": "دومينيكاني",
    "Dutch": "هولندي",
    "East Timorese": "تيموري شرقي",
    "Ecuadorian": "إكوادوري",
    "Egyptian": "مصري",
    "Emirati": "إماراتي",
    "Equatorial Guinean": "غيني استوائي",
    "Eritrean": "إريتري",
    "Estonian": "إستوني",
    "Ethiopian": "إثيوبي",
    "Fijian": "فيجي",
    "Filipino": "فلبيني",
    "Finnish": "فنلندي",
    "French": "فرنسي",
    "Gabonese": "غابوني",
    "Gambian": "غامبي",
    "Georgian": "جورجي",
    "German": "ألماني",
    "Ghanaian": "غاني",
    "Greek": "يوناني",
    "Grenadian": "غرينادي",
    "Guatemalan": "غواتيمالي",
    "Guinean": "غيني",
    "Guyanese": "غياني",
    "Haitian": "هايتي",
    "Honduran": "هندوراسي",
    "Hungarian": "مجري",
    "Icelandic": "آيسلندي",
    "Indian": "هندي",
    "Indonesian": "إندونيسي",
    "Iranian": "إيراني",
    "Iraqi": "عراقي",
    "Irish": "أيرلندي",
    "Italian": "إيطالي",
    "Ivorian": "إيفواري",
    "Jamaican": "جامايكي",
    "Japanese": "ياباني",
    "Jordanian": "أردني",
    "Kazakh": "كازاخستاني",
    "Kenyan": "كيني",
    "Kuwaiti": "كويتي",
    "Kyrgyz": "قيرغيزستاني",
    "Laotian": "لاوسي",
    "Latvian": "لاتفيري",
    "Lebanese": "لبناني",
    "Liberian": "ليبيري",
    "Libyan": "ليبي",
    "Liechtenstein": "ليختنشتايني",
    "Lithuanian": "ليتواني",
    "Luxembourger": "لوكسمبورغي",
    "Macedonian": "مقدوني",
    "Malagasy": "مدغشقري",
    "Malawian": "ملاوي",
    "Malaysian": "ماليزي",
    "Maldivian": "مالديفي",
    "Malian": "مالي",
    "Maltese": "مالطي",
    "Mauritanian": "موريتاني",
    "Mauritian": "موريسي",
    "Mexican": "مكسيكي",
    "Micronesian": "ميكرونيزي",
    "Moldovan": "مولدوفي",
    "Monegasque": "موناكوي",
    "Mongolian": "منغولي",
    "Montenegrin": "مونتينيغري",
    "Moroccan": "مغربي",
    "Mozambican": "موزمبيقي",
    "Namibian": "ناميبي",
    "Nauruan": "ناوروني",
    "Nepalese": "نيبالي",
    "New Zealander": "نيوزيلندي",
    "Nicaraguan": "نيكاراغوي",
    "Nigerian": "نيجيري",
    "Nigerien": "نيجري",
    "North Korean": "كوري شمالي",
    "Norwegian": "نرويجي",
    "Omani": "عماني",
    "Pakistani": "باكستاني",
    "Palauan": "بالاوي",
    "Palestinian": "فلسطيني",
    "Panamanian": "بنمي",
    "Papua New Guinean": "بابوا غينيا الجديدة",
    "Paraguayan": "باراغواياني",
    "Peruvian": "بيروفي",
    "Polish": "بولندي",
    "Portuguese": "برتغالي",
    "Qatari": "قطري",
    "Romanian": "روماني",
    "Russian": "روسي",
    "Rwandan": "رواندي",
    "Saint Lucian": "سانت لوسي",
    "Salvadoran": "سلفادوري",
    "Samoan": "ساموائي",
    "San Marinese": "سان مارينو",
    "Sao Tomean": "ساو تومي",
    "Saudi": "سعودي",
    "Senegalese": "سنغالي",
    "Serbian": "صربي",
    "Seychellois": "سيشيل",
    "Sierra Leonean": "سيراليوني",
    "Singaporean": "سنغافوري",
    "Slovak": "سلوفاكي",
    "Slovenian": "سلوفيني",
    "Solomon Islander": "جزر سليمان",
    "Somali": "صومالي",
    "South African": "جنوب أفريقي",
    "South Korean": "كوري جنوبي",
    "South Sudanese": "جنوب سوداني",
    "Spanish": "إسباني",
    "Sri Lankan": "سريلانكي",
    "Sudanese": "سوداني",
    "Surinamese": "سورينامي",
    "Swazi": "سوازي",
    "Swedish": "سويدي",
    "Swiss": "سويسري",
    "Syrian": "سوري",
    "Taiwanese": "تايواني",
    "Tajik": "طاجيكي",
    "Tanzanian": "تنزاني",
    "Thai": "تايلاندي",
    "Togolese": "توغولي",
    "Tongan": "تونغي",
    "Trinidadian": "ترينيدادي",
    "Tunisian": "تونسي",
    "Turkish": "تركي",
    "Turkmen": "تركماني",
    "Tuvaluan": "توفالو",
    "Ugandan": "أوغندي",
    "Ukrainian": "أوكراني",
    "Uruguayan": "أوروغواياني",
    "Uzbek": "أوزبكي",
    "Vanuatuan": "فانواتو",
    "Vatican": "فاتيكاني",
    "Venezuelan": "فنزويلي",
    "Vietnamese": "فيتنامي",
    "Yemeni": "يمني",
    "Zambian": "زامبي",
    "Zimbabwean": "زيمبابوي"
}

# 28 New Cities in Libya
NEW_CITIES = [
    {"name": "Tarhuna", "name_ar": "ترهونة", "latitude": Decimal("32.4350"), "longitude": Decimal("13.6332")},
    {"name": "Msallata", "name_ar": "مسلاتة", "latitude": Decimal("32.5786"), "longitude": Decimal("14.0028")},
    {"name": "Zintan", "name_ar": "الزنتان", "latitude": Decimal("31.9317"), "longitude": Decimal("12.2514")},
    {"name": "Zuwara", "name_ar": "زوارة", "latitude": Decimal("32.9312"), "longitude": Decimal("12.0811")},
    {"name": "Yefren", "name_ar": "يفرن", "latitude": Decimal("32.0625"), "longitude": Decimal("12.5278")},
    {"name": "Jadu", "name_ar": "جادو", "latitude": Decimal("31.9567"), "longitude": Decimal("12.0231")},
    {"name": "Ubari", "name_ar": "أوباري", "latitude": Decimal("26.5898"), "longitude": Decimal("12.7801")},
    {"name": "Brak Al Shati", "name_ar": "براك الشاطئ", "latitude": Decimal("27.5496"), "longitude": Decimal("14.2714")},
    {"name": "Al Kufra", "name_ar": "الكفرة", "latitude": Decimal("24.2916"), "longitude": Decimal("23.2847")},
    {"name": "Qatrun", "name_ar": "القطرون", "latitude": Decimal("24.9358"), "longitude": Decimal("14.6347")},
    {"name": "Jalu", "name_ar": "جالو", "latitude": Decimal("29.0331"), "longitude": Decimal("21.5350")},
    {"name": "Awjila", "name_ar": "أوجلة", "latitude": Decimal("29.1417"), "longitude": Decimal("21.2833")},
    {"name": "Brega", "name_ar": "البريقة", "latitude": Decimal("30.4062"), "longitude": Decimal("19.5686")},
    {"name": "Ras Lanuf", "name_ar": "رأس لانوف", "latitude": Decimal("30.4786"), "longitude": Decimal("18.5639")},
    {"name": "Bin Jawad", "name_ar": "بن جواد", "latitude": Decimal("30.8011"), "longitude": Decimal("18.0853")},
    {"name": "Hun", "name_ar": "هون", "latitude": Decimal("29.1258"), "longitude": Decimal("15.9478")},
    {"name": "Waddan", "name_ar": "ودان", "latitude": Decimal("29.1614"), "longitude": Decimal("16.1408")},
    {"name": "Socna", "name_ar": "سوكنة", "latitude": Decimal("29.0767"), "longitude": Decimal("15.7667")},
    {"name": "Suluq", "name_ar": "سلوق", "latitude": Decimal("31.6682"), "longitude": Decimal("20.2521")},
    {"name": "Qaminis", "name_ar": "قمينس", "latitude": Decimal("31.6631"), "longitude": Decimal("20.0211")},
    {"name": "Tukra", "name_ar": "توكرة", "latitude": Decimal("32.5273"), "longitude": Decimal("20.5750")},
    {"name": "Shahat", "name_ar": "شحات", "latitude": Decimal("32.7167"), "longitude": Decimal("21.8667")},
    {"name": "Susa", "name_ar": "سوسة", "latitude": Decimal("32.9000"), "longitude": Decimal("21.9667")},
    {"name": "Al Qubbah", "name_ar": "القبة", "latitude": Decimal("32.7667"), "longitude": Decimal("22.2417")},
    {"name": "Masaid", "name_ar": "امساعد", "latitude": Decimal("31.5794"), "longitude": Decimal("25.0214")},
    {"name": "Mizdah", "name_ar": "مزدة", "latitude": Decimal("31.4428"), "longitude": Decimal("12.9806")},
    {"name": "Kabaw", "name_ar": "كاباو", "latitude": Decimal("31.7833"), "longitude": Decimal("11.3333")},
    {"name": "Al Abraq", "name_ar": "الأبرق", "latitude": Decimal("32.7833"), "longitude": Decimal("21.9833")}
]

# Existing Cities Arabic Names Mapping
EXISTING_CITIES_AR = {
    "Tripoli": "طرابلس",
    "Benghazi": "بنغازي",
    "Misrata": "مصراتة",
    "Zawiya": "الزاوية",
    "Beida": "البيضاء",
    "Gharyan": "غريان",
    "Tobruk": "طبرق",
    "Ajdabiya": "أجدابيا",
    "Derna": "درنة",
    "Sirte": "سرت",
    "Sabha": "سبها",
    "Zliten": "زليتن",
    "Al Khums": "الخمس",
    "Sabratha": "صبراتة",
    "Surman": "صرمان",
    "Ghadames": "غدامس",
    "Murzuq": "مرزق",
    "Ghat": "غات",
    "Nalut": "نالوت",
    "Bani Walid": "بني وليد",
    "Al Aziziyah": "العزيزية",
    "Al Marj": "المرج"
}

# Sub-areas to define for newly created/unassigned cities
DEFAULT_SUB_AREAS = [
    ("المركز", Decimal("0.002"), Decimal("0.002")),
    ("حي السلام", Decimal("0.012"), Decimal("-0.015")),
    ("المنطقة الشرقية", Decimal("-0.015"), Decimal("0.012")),
]

class Command(BaseCommand):
    help = "Seeds Libyan cities and translates all nationalities to Arabic."

    def handle(self, *args, **options):
        self.stdout.write("Step 1: Translating nationalities...")
        nats_to_update = []
        for name, name_ar in NATIONALITY_TRANSLATIONS.items():
            try:
                nat = Nationality.objects.get(name=name)
                if nat.name_ar != name_ar:
                    nat.name_ar = name_ar
                    nats_to_update.append(nat)
            except Nationality.DoesNotExist:
                # Create nationality if it doesn't exist for some reason
                Nationality.objects.create(name=name, name_ar=name_ar)

        if nats_to_update:
            Nationality.objects.bulk_update(nats_to_update, ['name_ar'])
            self.stdout.write(self.style.SUCCESS(f"Successfully updated {len(nats_to_update)} nationalities with Arabic translations."))
        else:
            self.stdout.write("All nationalities are already translated.")

        self.stdout.write("Step 2: Updating existing cities with Arabic names...")
        cities_to_update = []
        for city in City.objects.all():
            if city.name in EXISTING_CITIES_AR:
                expected_ar = EXISTING_CITIES_AR[city.name]
                if city.name_ar != expected_ar:
                    city.name_ar = expected_ar
                    cities_to_update.append(city)
        if cities_to_update:
            City.objects.bulk_update(cities_to_update, ['name_ar'])
            self.stdout.write(self.style.SUCCESS(f"Updated {len(cities_to_update)} existing cities with Arabic names."))
        else:
            self.stdout.write("All existing cities already have correct Arabic names.")

        self.stdout.write("Step 3: Seeding 28 new Libyan cities...")
        new_cities_created = 0
        for city_data in NEW_CITIES:
            city_obj, created = City.objects.get_or_create(
                name=city_data["name"],
                defaults={
                    "name_ar": city_data["name_ar"],
                    "latitude": city_data["latitude"],
                    "longitude": city_data["longitude"],
                }
            )
            if created:
                new_cities_created += 1
            else:
                # Update coordinates and name_ar in case they were empty or different
                updated = False
                if city_obj.name_ar != city_data["name_ar"]:
                    city_obj.name_ar = city_data["name_ar"]
                    updated = True
                if city_obj.latitude != city_data["latitude"]:
                    city_obj.latitude = city_data["latitude"]
                    updated = True
                if city_obj.longitude != city_data["longitude"]:
                    city_obj.longitude = city_data["longitude"]
                    updated = True
                if updated:
                    city_obj.save()

        self.stdout.write(self.style.SUCCESS(f"Seeded/Updated Libyan cities. Created {new_cities_created} brand new cities."))

        self.stdout.write("Step 4: Redistributing portion of doctors to new cities and assigning sub-areas...")
        # Get all active cities now
        all_cities = list(City.objects.filter(is_deleted=False))
        new_city_objects = [c for c in all_cities if c.name in [nc["name"] for nc in NEW_CITIES]]

        if not new_city_objects:
            self.stdout.write("No new cities found to distribute to.")
            return

        doctors = list(User.objects.filter(user_type='doctor', is_deleted=False))
        self.stdout.write(f"Total doctors available: {len(doctors)}")

        # Update ~15% of the doctors to have their city set to one of the new cities
        # And give them area + area_latitude/longitude
        num_to_redistribute = int(len(doctors) * 0.15)
        doctors_to_update = random.sample(doctors, num_to_redistribute)
        doctors_to_update_set = set(doctors_to_update)
        self.stdout.write(f"Redistributing {num_to_redistribute} doctors to new cities...")

        for doc in doctors_to_update:
            chosen_city = random.choice(new_city_objects)
            chosen_area = random.choice(DEFAULT_SUB_AREAS)
            doc.city = chosen_city
            doc.area = chosen_area[0]
            if chosen_city.latitude and chosen_city.longitude:
                doc.area_latitude = chosen_city.latitude + chosen_area[1]
                doc.area_longitude = chosen_city.longitude + chosen_area[2]

        # Also make sure all other doctors who don't have an area set but do have a city get assigned one
        self.stdout.write("Assigning areas and coordinates to other doctors missing areas...")
        # Define areas for existing cities if not already defined (or fall back to defaults)
        # We can fetch the seed_test_data's CITY_AREAS or just use default areas for any doc missing area
        doctors_missing_area = User.objects.filter(
            user_type='doctor',
            is_deleted=False,
            city__isnull=False
        ).filter(Q(area__isnull=True) | Q(area=''))

        num_missing = doctors_missing_area.count()
        self.stdout.write(f"Doctors missing areas: {num_missing}")

        updated_missing = []
        for doc in doctors_missing_area:
            # Skip if we already marked them for redistribution
            if doc in doctors_to_update_set:
                continue
            chosen_area = random.choice(DEFAULT_SUB_AREAS)
            doc.area = chosen_area[0]
            if doc.city.latitude and doc.city.longitude:
                doc.area_latitude = doc.city.latitude + chosen_area[1]
                doc.area_longitude = doc.city.longitude + chosen_area[2]
            updated_missing.append(doc)

        # Bulk update all modified doctors
        all_updates = doctors_to_update + updated_missing
        if all_updates:
            # Update in batches to avoid SQLite limit or memory exhaustion
            batch_size = 1000
            for offset in range(0, len(all_updates), batch_size):
                batch = all_updates[offset:offset+batch_size]
                User.objects.bulk_update(batch, ['city', 'area', 'area_latitude', 'area_longitude'])
            self.stdout.write(self.style.SUCCESS(f"Successfully bulk updated {len(all_updates)} doctors on the heatmap."))
        else:
            self.stdout.write("No doctor updates required.")

        self.stdout.write(self.style.SUCCESS("All tasks finished successfully!"))
