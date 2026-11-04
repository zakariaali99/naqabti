import random
from datetime import datetime, timedelta, date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.hashers import make_password

from niqabaty.models import (
    User, City, Nationality, Branch, Institution,
    AcademicDegree, DoctorSpecialty, MembershipType,
    DoctorsMembership,
)

FIRST_NAMES_AR = [
    "محمد", "أحمد", "علي", "عمر", "خالد", "حسن", "حسين", "محمود", "عبدالله", "إبراهيم",
    "سالم", "ناصر", "مصطفى", "فتحي", "عبدالسلام", "عبدالرحمن", "صالح", "رمضان", "الهادي", "المهدي",
    "إسماعيل", "يوسف", "سليمان", "مفتاح", "ميلاد", "الصديق", "الطاهر", "المنصور", "نورالدين", "جمال",
    "كمال", "بشير", "منصور", "عزالدين", "أسامة", "أيمن", "سامي", "عادل", "طارق", "معتز",
    "وائل", "هاني", "علاء", "ياسر", "عماد", "ماجد", "رامي", "زياد", "لطفي", "زهير",
    "فوزي", "مبارك", "جمعة", "السنوسي", "المنجي", "الطيب", "بدر", "توفيق", "جابر",
    "حامد", "حمدي", "خضر", "رجب", "زكريا", "سراج", "شعبان", "طه", "عاطف", "عبدالكريم",
    "عبدالمجيد", "عبدالمنعم", "عزت", "فؤاد", "كامل", "ماهر", "نجيب", "هشام", "وحيد", "يحيى",
    "أكرم", "أنور", "جهاد", "حسام", "رياض", "صلاح", "ضياء", "عاصم", "عرفات", "عدنان",
    "غازي", "مهند", "نواف", "هادي", "وليد", "ياسين", "إياد", "بسام", "تمام", "ثامر",
]

LAST_NAMES_AR = [
    "الطيب", "الأطرش", "الزوي", "المصراتي", "الطبلقي", "القرنفلي", "الجعفري", "السنوسي", "المقريف", "البرغثي",
    "الفيتوري", "الشريف", "الكبير", "الصغير", "الزليتني", "المدني", "الساحلي", "الجبالي", "الورفلي", "المزيني",
    "الهوني", "الغرياني", "السبسي", "الشويهدي", "الفارسي", "المنصوري", "النعاس", "الهدار", "الزنتاني",
    "الشعابي", "الصواني", "الضاوي", "الطوير", "العابد", "العجيلي", "العنيزي", "الغويل", "الفاخري", "الفرجاني",
    "المبروك", "المجذوب", "المحجوب", "المرغني", "المسلاتي", "المشري",
    "المغراوي", "المقوز", "المنتصر", "النفاتي", "النقاز", "الهتاري", "الهرام", "الوادي", "اليونسي",
    "أبوحجر", "أبوشناف", "أبوشويرب", "أبوعجيلة", "أبومدينة", "أبودبوس", "أبودقن", "أبوزيد", "أبوسن", "أبوسماحة",
    "بنصالح", "بن عاشور", "بن عبدالله", "بن عثمان", "بن عمر", "بن قاسم", "بن موسى", "بن يوسف", "بوشناق", "بوبكر",
    "بودية", "بوزريبة", "بوسيف", "بوفطيمة", "بوقرين", "بوكر", "بوليفة", "بومجدوب", "بونعجة", "بوهلال",
    "تبوني", "تومي", "ثابت", "جاب الله", "جبارة", "جرادة", "جريوة", "جلول", "جمعة", "جنات",
]

FIRST_NAMES_EN = [
    "Mohamed", "Ahmed", "Ali", "Omar", "Khaled", "Hassan", "Hussein", "Mahmoud", "Abdallah", "Ibrahim",
    "Salem", "Naser", "Mustafa", "Fathi", "AbdelSalam", "AbdelRahman", "Saleh", "Ramadan", "Al-Hadi", "Al-Mahdi",
    "Ismail", "Yousef", "Sulaiman", "Miftah", "Milad", "Al-Siddiq", "Al-Tahir", "Al-Mansour", "NourEddine", "Jamal",
    "Kamal", "Bashir", "Mansour", "EzzEddine", "Osama", "Ayman", "Sami", "Adel", "Tarek", "Moataz",
    "Wael", "Hani", "Alaa", "Yasser", "Emad", "Majed", "Rami", "Ziyad", "Lotfi", "Zuhair",
    "Fawzi", "Mubarak", "Jumaa", "Al-Senussi", "Al-Munji", "Al-Hadi", "Al-Tayeb", "Badr", "Tawfiq", "Jaber",
]

LAST_NAMES_EN = [
    "Al-Tayeb", "Al-Atresh", "Al-Zawi", "Al-Misrati", "Al-Tabliqi", "Al-Qarnafly", "Al-Jaafari", "Al-Senussi", "Al-Muqaryif", "Al-Barghathy",
    "Al-Fitouri", "Al-Sharif", "Al-Kabir", "Al-Saghir", "Al-Zlitni", "Al-Madani", "Al-Sahli", "Al-Jabali", "Al-Warfalli", "Al-Mazini",
    "Al-Huni", "Al-Ghariani", "Al-Sebsi", "Al-Shuwaidi", "Al-Farsi", "Al-Mansouri", "Al-Naas", "Al-Haddar", "Al-Zintani",
    "Al-Shuabi", "Al-Swani", "Al-Dawi", "Al-Tuwayr", "Al-Abed", "Al-Ajili", "Al-Anizi", "Al-Ghuwayl", "Al-Fakhri", "Al-Farjani",
    "Abu-Hajar", "Abu-Shanaf", "Abu-Shuwayrib", "Abu-Ajila", "Abu-Madina", "Abu-Dabbus", "Abu-Daqin", "Abu-Zaid", "Abu-Senna", "Abu-Samaha",
    "Ben-Saleh", "Ben-Ashour", "Ben-Abdallah", "Ben-Othman", "Ben-Omar", "Ben-Qasim", "Ben-Mousa", "Ben-Youssef", "Boushnak", "Boubaker",
]

UNIVERSITIES = [
    "جامعة طرابلس", "جامعة بنغازي", "جامعة مصراتة", "جامعة الزيتونة",
    "جامعة سبها", "جامعة عمر المختار", "جامعة الجبل الغربي",
    "جامعة طرابلس الأهلية", "جامعة بنغازي الأهلية",
]

INSTITUTION_NAMES = [
    "مستشفى طرابلس المركزي", "مستشفى بنغازي الجامعي", "مستشفى مصراتة العام",
    "مستشفى الزاوية العام", "مستشفى الخمس التعليمي", "مركز طرابلس الطبي",
    "مستشفى الجلاء للولادة", "مستشفى الأطفال بنغازي", "مركز القلب طرابلس",
    "مستشفى سبها العام", "مستشفى طبرق العام", "مركز الأورام طرابلس",
    "مستشفى درنة العام", "مستشفى غريان العام", "مركز الكلى بنغازي",
    "مستشفى العيون طرابلس", "مستشفى المرج العام", "مستشفى سرت العام",
    "مستشفى زليتن العام", "عيادات السلام الطبية",
]

STREET_NAMES = [
    "شارع الجلاء", "شارع الاستقلال", "شارع النصر", "شارع سعدون", "شارع عبد الكريم",
    "شارع عمر المختار", "شارع طرابلس", "شارع الشط", "شارع الجمهورية", "شارع الفاتح",
    "شارع السكة", "شارع الميناء", "شارع الصحافة", "شارع بن عاشور", "شارع ميزران",
]

CITY_DISTRIBUTION = [
    (1, 30), (2, 20), (3, 12), (6, 5), (8, 5), (7, 5), (14, 5),
    (13, 3), (12, 3), (11, 3), (10, 3), (5, 3), (15, 2), (9, 2),
    (4, 2), (16, 1), (17, 1), (18, 1), (19, 1), (20, 1), (21, 1), (22, 1),
]

CITY_AREAS: dict[int, list[tuple[str, float, float]]] = {
    1: [  # Tripoli
        ("وسط المدينة", 0.003, 0.002),
        ("قرقارش", -0.015, 0.025),
        ("الملاحة", 0.020, -0.010),
        ("طريق المطار", 0.035, -0.030),
        ("أبو سليم", 0.045, -0.005),
        ("سوق الجمعة", -0.025, -0.015),
        ("زاوية الدهماني", 0.015, 0.035),
        ("عين زارة", -0.035, 0.010),
        ("تاجوراء", 0.050, 0.040),
        ("الحشان", -0.045, -0.025),
    ],
    2: [  # Benghazi
        ("وسط المدينة", 0.003, 0.002),
        ("قاريونس", -0.020, 0.030),
        ("الكويفية", 0.025, -0.015),
        ("سيدي خليفة", -0.030, -0.020),
        ("الصابري", 0.015, 0.025),
        ("بوهديمة", -0.010, -0.035),
        ("الليثي", 0.035, -0.010),
        ("جليانة", -0.040, 0.020),
    ],
    3: [  # Misrata
        ("المركز", 0.002, 0.003),
        ("طريق السكة", -0.020, 0.015),
        ("القصبات", 0.025, -0.020),
        ("زاوية المحجوب", -0.015, -0.025),
        ("السواوة", -0.030, 0.025),
        ("الزهراء", 0.020, 0.030),
    ],
    4: [  # Zawiya
        ("وسط الزاوية", 0.002, 0.002),
        ("النصر", -0.015, 0.020),
        ("الحشان", 0.020, -0.015),
    ],
    5: [  # Beida
        ("وسط البيضاء", 0.002, 0.003),
        ("الغابة", -0.020, 0.025),
        ("الملعب", 0.015, -0.020),
    ],
    6: [  # Gharyan
        ("وسط غريان", 0.002, 0.002),
        ("الضاحية", -0.020, 0.030),
        ("تالة", 0.025, -0.025),
    ],
    7: [  # Tobruk
        ("وسط طبرق", 0.002, 0.003),
        ("الميناء", -0.015, 0.025),
        ("التميمي", 0.020, -0.030),
    ],
    8: [  # Ajdabiya
        ("وسط أجدابيا", 0.003, 0.002),
        ("حي النصر", -0.020, 0.020),
        ("الزرايب", 0.025, -0.015),
    ],
    9: [  # Derna
        ("وسط درنة", 0.002, 0.003),
        ("السهل", -0.025, 0.020),
        ("وادي درنة", 0.030, -0.025),
    ],
    10: [  # Sirte
        ("وسط سرت", 0.002, 0.002),
        ("قصر أبو هادي", -0.020, 0.025),
        ("الخليج", 0.020, -0.020),
    ],
    11: [  # Sabha
        ("وسط سبها", 0.003, 0.002),
        ("المنطقة الصناعية", -0.025, 0.030),
        ("الجماهيرية", 0.020, -0.025),
    ],
    12: [  # Zliten
        ("وسط زليتن", 0.002, 0.003),
        ("سوق زليتن", -0.015, 0.020),
        ("الوادي", 0.020, -0.015),
    ],
    13: [  # Al Khums
        ("وسط الخمس", 0.002, 0.002),
        ("شاطئ الخمس", -0.020, 0.025),
        ("المنشية", 0.025, -0.020),
    ],
    14: [  # Sabratha
        ("وسط صبراتة", 0.002, 0.003),
        ("الآثار", -0.015, 0.025),
        ("الشاطئ", 0.020, -0.020),
    ],
    15: [  # Surman
        ("وسط صرمان", 0.003, 0.002),
        ("الضواحي", -0.020, 0.020),
    ],
}

CITY_NAMES_AR: dict[int, str] = {
    1: "طرابلس", 2: "بنغازي", 3: "مصراتة", 4: "الزاوية", 5: "البيضاء",
    6: "غريان", 7: "طبرق", 8: "أجدابيا", 9: "درنة", 10: "سرت",
    11: "سبها", 12: "زليتن", 13: "الخمس", 14: "صبراتة", 15: "صرمان",
    16: "غدامس", 17: "مرزق", 18: "غات", 19: "نالوت", 20: "بني وليد",
    21: "العزيزية", 22: "المرج",
}


def weighted_pick(items_with_weights):
    total = sum(w for _, w in items_with_weights)
    r = random.randint(1, total)
    for item, w in items_with_weights:
        r -= w
        if r <= 0:
            return item
    return items_with_weights[-1][0]


def generate_phone():
    prefix = random.choice(["91", "92", "94"])
    suffix = "".join(str(random.randint(0, 9)) for _ in range(7))
    return f"+218{prefix}{suffix}"


def make_arabic_name():
    return random.choice(FIRST_NAMES_AR), random.choice(LAST_NAMES_AR)


def make_english_name():
    return random.choice(FIRST_NAMES_EN), random.choice(LAST_NAMES_EN)


class Command(BaseCommand):
    help = "Seed test users with areas, Arabic names, and varied memberships"

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=50000)
        parser.add_argument("--max-records", type=int, default=30000)

    def handle(self, *args, **options):
        total = options["count"]
        max_records = options["max_records"]
        self.max_records = max_records
        self.records_created = 0
        self.stdout.write(f"Seeding test users (count={total}, max_records={max_records})...")

        cities = {c.id: c for c in City.objects.filter(is_deleted=False)}
        nationalities = list(Nationality.objects.all())
        specialties = list(DoctorSpecialty.objects.all())
        degrees = list(AcademicDegree.objects.all())
        branches = list(Branch.objects.all())
        institutions = list(Institution.objects.all())
        membership_types = list(MembershipType.objects.all())

        self.stdout.write(
            f"  Cities: {len(cities)}, Nationalities: {len(nationalities)}, "
            f"Specialties: {len(specialties)}, Degrees: {len(degrees)}, "
            f"Branches: {len(branches)}, Institutions: {len(institutions)}, "
            f"MembershipTypes: {len(membership_types)}"
        )

        # Auto-create missing reference data
        if not branches:
            b1 = Branch.objects.create(name="النقابة العامة للطب البشري", prefix="GEN_MED", is_active=True)
            b2 = Branch.objects.create(name="النقابة العامة لأطباء الأسنان", prefix="GEN_DEN", is_active=True)
            b3 = Branch.objects.create(name="النقابة العامة للصيادلة", prefix="GEN_PHA", is_active=True)
            branches = [b1, b2, b3]
            self.stdout.write(self.style.WARNING(f"  Created {len(branches)} default branches"))

        if not specialties:
            specialties = [
                DoctorSpecialty.objects.create(name="طب عام"),
                DoctorSpecialty.objects.create(name="طب الأطفال"),
                DoctorSpecialty.objects.create(name="جراحة"),
                DoctorSpecialty.objects.create(name="قلب"),
                DoctorSpecialty.objects.create(name="جلدية"),
            ]
            self.stdout.write(self.style.WARNING(f"  Created {len(specialties)} default specialties"))

        if not degrees:
            degrees = [
                AcademicDegree.objects.create(name="بكالوريوس"),
                AcademicDegree.objects.create(name="ماجستير"),
                AcademicDegree.objects.create(name="دكتوراه"),
            ]
            self.stdout.write(self.style.WARNING(f"  Created {len(degrees)} default degrees"))

        if not membership_types:
            membership_types = [
                MembershipType.objects.create(
                    name="عضوية سنوية",
                    price=Decimal("250.00"), duration_months=12, is_active=True,
                ),
                MembershipType.objects.create(
                    name="عضوية نصف سنوية",
                    price=Decimal("150.00"), duration_months=6, is_active=True,
                ),
            ]
            self.stdout.write(self.style.WARNING(f"  Created {len(membership_types)} default membership types"))

        if not all([cities, nationalities, branches, membership_types]):
            return self.stdout.write(self.style.ERROR("Missing required reference data!"))

        # Ensure Arabic names for all cities
        for cid, ar_name in CITY_NAMES_AR.items():
            city = cities.get(cid)
            if city and not city.name_ar:
                city.name_ar = ar_name
                city.save(update_fields=['name_ar'])

        city_weights = []
        for cid, w in CITY_DISTRIBUTION:
            if cid in cities:
                city_weights.append((cid, w))
        for cid in cities:
            if cid not in {cw[0] for cw in city_weights}:
                city_weights.append((cid, 1))

        # Also ensure Libyan nationality has Arabic name
        try:
            libya = Nationality.objects.get(id=93)
            if not libya.name_ar:
                libya.name_ar = "ليبي"
                libya.save(update_fields=['name_ar'])
        except Nationality.DoesNotExist:
            pass

        doctor_n = int(total * 0.75)
        student_n = int(total * 0.15)
        institution_n = int(total * 0.075)
        manager_n = total - doctor_n - student_n - institution_n

        pw_hash = make_password("test123456")
        today = date.today()
        now = timezone.now()

        batch_size = 500
        user_batch = []
        existing_count = User.objects.count()

        for i in range(total):
            idx = existing_count + i + 1

            if i < doctor_n:
                user_type = "doctor"
                gender = random.choices(["male", "female"], weights=[70, 30])[0]
            elif i < doctor_n + student_n:
                user_type = "student"
                gender = random.choices(["male", "female"], weights=[50, 50])[0]
            elif i < doctor_n + student_n + institution_n:
                user_type = "institution"
                gender = None
            else:
                user_type = "manager"
                gender = random.choices(["male", "female"], weights=[80, 20])[0]

            first_ar, last_ar = make_arabic_name()
            first_en, last_en = make_english_name()
            father_ar = random.choice(FIRST_NAMES_AR)
            grandfather_ar = random.choice(FIRST_NAMES_AR)
            father_en = random.choice(FIRST_NAMES_EN)
            grandfather_en = random.choice(FIRST_NAMES_EN)
            full_name = f"{first_ar} {father_ar} {grandfather_ar} {last_ar}"
            phone = generate_phone()
            city_id = weighted_pick(city_weights)
            city = cities[city_id]

            # Assign area with specific coordinates
            area_name = None
            area_lat = None
            area_lng = None
            city_areas = CITY_AREAS.get(city_id, [])
            if city_areas and user_type != "institution":
                chosen_area = random.choice(city_areas)
                area_name = chosen_area[0]
                if city.latitude and city.longitude:
                    area_lat = float(city.latitude) + chosen_area[1]
                    area_lng = float(city.longitude) + chosen_area[2]

            # Only set Libyan nationality for most users
            nationality = None
            libya_obj = Nationality.objects.filter(id=93).first()
            if libya_obj and random.random() < 0.95:
                nationality = libya_obj
            elif nationalities:
                nationality = random.choice(nationalities)

            address = f"{random.choice(STREET_NAMES)}، {city.name_ar or city.name}"
            username = f"{user_type}_{idx}"
            email = f"{username}@example.com"

            user = User(
                username=username,
                email=email,
                password=pw_hash,
                phone_number=phone,
                user_type=user_type,
                gender=gender,
                is_active=True,
                is_staff=False,
                city=city,
                area=area_name,
                area_latitude=area_lat,
                area_longitude=area_lng,
                nationality=nationality,
                address=address,
                language="ar",
                first_name_field=first_ar,
                father_name=father_ar,
                grandfather_name=grandfather_ar,
                family_name=last_ar,
                first_name_en=first_en,
                father_name_en=father_en,
                grandfather_name_en=grandfather_en,
                family_name_en=last_en,
                full_name=full_name,
                created_at=now,
                updated_at=now,
            )

            if user_type == "doctor":
                user.specialty = random.choice(specialties).name if specialties else ""
                user.current_degree = random.choice(degrees) if degrees else None
                user.doctor_number = str(random.randint(10001, 99999))
                user.bio = f"طبيب {user.specialty} في {city.name_ar or city.name}"
                if area_name:
                    user.bio += f" - منطقة {area_name}"
                user.membership_number = f"DR{idx:07d}"

            elif user_type == "student":
                user.current_degree = random.choice(degrees) if degrees else None
                user.university_name = random.choice(UNIVERSITIES)
                user.graduation_year = random.choice([2025, 2026, 2027, 2028, 2029])

            elif user_type == "institution":
                inst_name = random.choice(INSTITUTION_NAMES)
                user.full_name = inst_name
                user.first_name_field = inst_name
                user.father_name = ""
                user.grandfather_name = ""
                user.family_name = ""
                user.bio = f"{inst_name} - {city.name_ar or city.name}"

            if user_type != "institution":
                age = random.randint(22, 65)
                user.birthdate = today - timedelta(days=age * 365 + random.randint(0, 365))

            user_batch.append(user)

            if len(user_batch) >= batch_size or i == total - 1:
                # Estimate how many records this batch would create
                doctor_count = len([u for u in user_batch if u.user_type == "doctor"])
                predicted = len(user_batch) + doctor_count + doctor_count  # users + branch-throughs + extra (institutions/memberships)
                if self.records_created + predicted >= self.max_records:
                    remaining = self.max_records - self.records_created
                    # Truncate the batch to stay within limit
                    user_batch = user_batch[:max(1, remaining // 5)]
                    self.stdout.write(self.style.WARNING(
                        f"  Truncating batch to {len(user_batch)} users to stay under max_records limit"
                    ))
                    if not user_batch:
                        break
                
                extra_count = self._process_batch(
                    user_batch, branches, institutions, membership_types, today,
                )
                self.records_created += len(user_batch) + extra_count
                user_batch = []
                self.stdout.write(f"  Progress: {i + 1}/{total} (Created ~{self.records_created} total records)")
                
                if self.records_created >= self.max_records:
                    self.stdout.write(self.style.WARNING(f"Reached max records limit of {self.max_records}. Stopping."))
                    break

        self.stdout.write(self.style.SUCCESS(f"Done! {total} users seeded."))

    def _process_batch(self, users, branches, institutions, membership_types, today):
        created = User.objects.bulk_create(users, ignore_conflicts=True)

        usernames = [u.username for u in users]
        user_map = {
            u.username: u
            for u in User.objects.filter(username__in=usernames)
        }

        branch_throughs = []
        institution_throughs = []
        doctor_ids = []

        for u in created:
            db_user = user_map.get(u.username)
            if not db_user:
                continue
            uid = db_user.id

            if db_user.user_type in ("doctor", "student", "manager", "institution"):
                branch = random.choice(branches)
                branch_throughs.append(
                    User.branches.through(user_id=uid, branch_id=branch.id)
                )

            if db_user.user_type == "doctor":
                if institutions:
                    inst = random.choice(institutions)
                    institution_throughs.append(
                        User.institutions.through(user_id=uid, institution_id=inst.id)
                    )
                doctor_ids.append(uid)

        if branch_throughs:
            User.branches.through.objects.bulk_create(branch_throughs, ignore_conflicts=True)

        if institution_throughs:
            User.institutions.through.objects.bulk_create(institution_throughs, ignore_conflicts=True)

        institution_objs = []
        for u in created:
            db_user = user_map.get(u.username)
            if db_user and db_user.user_type == "institution":
                institution_objs.append(Institution(
                    name=db_user.full_name or db_user.first_name_field,
                    account=db_user,
                    address=db_user.address,
                    phone=db_user.phone_number,
                    email=db_user.email,
                    is_active=True,
                ))

        if institution_objs:
            Institution.objects.bulk_create(institution_objs, ignore_conflicts=True)

        # Only ~80% of doctors get memberships; 20% have none
        if doctor_ids and membership_types:
            # Filter to ~80% who should have memberships
            member_doctor_ids = [did for did in doctor_ids if random.random() < 0.8]

            memberships = []
            for doc_id in member_doctor_ids:
                mt = random.choice(membership_types)
                branch = random.choice(branches) if branches else None
                start = today - timedelta(days=random.randint(1, 730))
                has_end = random.random() < 0.7
                duration = random.choices([6, 12, 12, 24, 36], weights=[10, 40, 20, 20, 10])[0]
                end = start + timedelta(days=duration * 30) if has_end else None
                if end and end < today:
                    status = "expired"
                elif random.random() < 0.1:
                    status = "pending"
                else:
                    status = "active"
                total_amount = float(mt.price) if mt.price else random.uniform(100, 500)
                paid_ratio = random.choices([1.0, 0.5, 0.0], weights=[70, 15, 15])[0]
                paid = Decimal(str(round(total_amount * paid_ratio, 2)))
                pay_status = "paid" if paid >= Decimal(str(total_amount)) else ("partial" if paid > 0 else "unpaid")

                memberships.append(DoctorsMembership(
                    doctor_id=doc_id,
                    membership_type=mt,
                    branch=branch,
                    start_date=start,
                    end_date=end,
                    status=status,
                    is_active=status == "active",
                    total_amount=Decimal(str(total_amount)),
                    paid_amount=paid,
                    payment_status=pay_status,
                ))

            if memberships:
                DoctorsMembership.objects.bulk_create(memberships, ignore_conflicts=True)
            
            return len(institution_objs) + len(memberships)
        
        return len(institution_objs)
