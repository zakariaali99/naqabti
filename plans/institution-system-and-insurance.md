# Institution System & Insurance — Implementation Plan

## Overview
Refactor institutions from User-based (`user_type='institution'`) to a proper `Institution` model representing hospitals/clinics with map-location picking, M2M relation to doctors. Then add a lightweight Insurance section placeholder.

---

## Part 1: Institution Model

### Current State
- Institutions are just `User` records with `user_type='institution'`
- Frontend uses `usersApi.getAll({user_type:'institution'})` for CRUD
- No location data, no dedicated model

### Desired State
- Dedicated `Institution` model (hospitals/clinics) with lat/lng
- Doctors M2M → Institution (a doctor works at multiple hospitals)
- Institution login accounts are `User` records linked via OneToOne
- Institution form has a Leaflet map picker for location

---

### Step 1: Model

**New file:** `backend/niqabaty/models/institution.py`

```python
from django.db import models
from .base import BaseModel

class Institution(BaseModel):
    name = models.CharField(max_length=255)
    account = models.OneToOneField(
        'User', on_delete=models.CASCADE,
        null=True, blank=True, related_name='institution_profile'
    )
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    logo = models.ImageField(upload_to='institution_logos/', blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
```

**File:** `backend/niqabaty/models/__init__.py` — add import

**File:** `backend/niqabaty/models/user.py` — add M2M to User:
```python
institutions = models.ManyToManyField(
    'Institution', blank=True, related_name='doctors'
)
```

**Run:** `python manage.py makemigrations && python manage.py migrate`

### Step 2: Data migration — migrate existing institutions

Create `XXXX_migrate_existing_institutions.py`:
```python
def migrate_institutions(apps, schema_editor):
    User = apps.get_model('niqabaty', 'User')
    Institution = apps.get_model('niqabaty', 'Institution')
    for user in User.objects.filter(user_type='institution', is_deleted=False):
        Institution.objects.create(
            name=user.full_name or user.username,
            account=user,
            address=user.address,
            phone=user.phone_number,
            email=user.email,
            is_active=user.is_active,
        )
```

### Step 3: Backend — API

**New file:** `backend/niqabaty/views/institution_viewset.py`

```python
class InstitutionViewSet(viewsets.ModelViewSet):
    queryset = Institution.objects.filter(is_deleted=False)
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]
```

**New file:** `backend/niqabaty/serializers/institution.py`

```python
class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = '__all__'
```

**File:** `backend/backend/urls.py` — register:
```python
router.register(r'institutions', InstitutionViewSet)
```

### Step 4: Frontend — API

**New file:** `frontend/src/api/institutionsApi.ts`

```typescript
class InstitutionsApi extends BaseApiClient<Institution, InstitutionInput, InstitutionInput> {
  constructor() { super("institutions/"); }
}
export const institutionsApi = new InstitutionsApi();
```

**New type** in `frontend/src/models/institution.ts`:
```typescript
export interface Institution {
  id: number;
  name: string;
  account?: number;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Step 5: Frontend — Pages

#### 5a. List page — refactor `institutions/index.tsx`
- Change `usersApi` → `institutionsApi`
- Change `UserEntity` → `Institution` type
- Update columns to show institution-specific fields (name, address, phone instead of username/email)

#### 5b. Detail page — refactor `institutions/detail.tsx`
- Change `usersApi` → `institutionsApi`
- Show lat/lng as map embed (Leaflet static view)
- Show list of linked doctors
- Show login account info if `account` exists

#### 5c. Form page — refactor with map picker
**File:** `institutions/form.tsx`

Add a Leaflet map section for location picking:

```tsx
<div className="h-64 rounded-2xl overflow-hidden border">
  <MapContainer center={[28, 17]} zoom={6}>
    <TileLayer url="..." />
    {formData.latitude && formData.longitude && (
      <Marker position={[formData.latitude, formData.longitude]} />
    )}
  </MapContainer>
</div>
```

Add "Search location" input using OpenStreetMap Nominatim API (free, no API key):
```tsx
<Input
  placeholder="Search for a location..."
  onValueChange={async (query) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=ly`
    );
    const data = await res.json();
    // Show suggestions, on select → set lat/lng + map flyTo
  }}
/>
```

When user clicks on map → `map.on('click', (e) => setLatLng(e.latlng))`

### Step 6: Heatmap Integration
- **Institution layer** uses `Institution.latitude`/`longitude` directly (point heatmap, not city-grouped)
- **Filter by institution** in doctor heatmap → `User.institutions__id`
- Update `DoctorDistributionView` to also support direct institution points when `user_type=institution`

### Step 7: Doctor Form — link institutions
- Add multi-select field in doctor form to select which institutions they work at
- Use an `InstitutionModal` similar to `BranchModal`

---

## Part 2: Insurance Section

### Goal
Simple placeholder that shows "Under Construction" for now, with a sidebar link in Services. Future: doctors can add/manage patient insurance.

### Step 1: Frontend Page

**New file:** `frontend/src/pages/insurance/index.tsx`

```tsx
import DefaultLayout from "@/layouts/default";

export default function InsurancePage() {
  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-3xl font-bold">Insurance</h1>
        <div className="bg-content1 rounded-[32px] p-12 text-center border shadow-sm max-w-lg">
          <div className="text-6xl mb-4">🚧</div>
          <p className="text-xl text-default-500">
            This section is under construction
          </p>
        </div>
      </div>
    </DefaultLayout>
  );
}
```

### Step 2: Nav + Route + i18n

**File:** `frontend/src/config/site.ts` — add under `nav.services`:
```typescript
{ labelKey: "nav.insurance", href: "/insurance", icon: "FiShield" }
```

**File:** `frontend/src/App.tsx`:
```typescript
const InsurancePage = lazy(() => import("@/pages/insurance"));
// ...
<Route element={<InsurancePage />} path="/insurance" />
```

**i18n:**
- `frontend/src/i18n/locales/en/nav.ts`: `insurance: "Insurance"`
- `frontend/src/i18n/locales/ar/nav.ts`: `insurance: "التأمين"`

### Step 3: Backend (prep for future)
Create model and a basic viewset so the API is ready:

**New file:** `backend/niqabaty/models/insurance.py`

```python
class Insurance(BaseModel):
    doctor = models.ForeignKey(User, on_delete=CASCADE, related_name='insurances')
    name = models.CharField(max_length=255)
    policy_number = models.CharField(max_length=100)
    provider = models.CharField(max_length=255)
    coverage_details = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
```

Register a simple ViewSet + URL. Frontend can show a coming-soon message until ready.

---

## Effort

| Step | Time |
|---|---|
| Institution model + migrations | 1h |
| Institution ViewSet + Serializer | 1h |
| Frontend API + types | 30m |
| Refactor list/detail pages | 1.5h |
| Form with map picker | 2h |
| Doctor-institution M2M in doctor form | 1h |
| Heatmap integration (institution layer) | 1h |
| Insurance model + viewset | 1h |
| Insurance page + nav + route | 30m |
| **Total** | **~9h** |
