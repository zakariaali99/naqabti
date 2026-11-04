# Doctor Heatmap — Implementation Plan

## Overview
Interactive Libya-wide 2D heatmap showing doctor/institution distribution with gradient colors (blue→green→yellow→orange→red) and live database filtering.

## Tech Stack
- **Map:** Leaflet + react-leaflet v4 (React 18 compatible)
- **Heatmap:** leaflet.heat (L.heatLayer with custom gradient)
- **Backend:** DRF APIView with DB aggregation
- **GeoJSON:** Libya boundary from simplemaps.com

---

## Phase A: Backend — City Coordinates

### A1. City model migration
**File:** `backend/niqabaty/models/city.py`

Add:
```python
latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
```

**Run:** `python manage.py makemigrations`

### A2. Data migration — seed coordinates
Create data migration `XXXX_seed_city_coordinates.py`:

```python
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
    dependencies = [('niqabaty', 'XXXX_previous_migration')]
    operations = [migrations.RunPython(seed_coords)]
```

### A3. Update serializers + frontend types
- `CitySerializer` — add `latitude`, `longitude`
- `frontend/src/models/city.ts` — add `latitude?: number; longitude?: number`

---

## Phase B: Backend — Distribution API

### B1. New view
**File:** `backend/niqabaty/views/doctor_distribution_view.py`

```python
class DoctorDistributionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Base queryset
        base_qs = User.objects.filter(
            is_deleted=False, is_active=True, city__isnull=False
        )

        # 2. User type filter (default='doctor', or 'institution', or 'all')
        user_type = request.query_params.get('user_type', 'doctor')
        if user_type != 'all':
            base_qs = base_qs.filter(user_type=user_type)

        # 3. Scoping (branch managers see only their branch users)
        #    Follows same pattern as DashboardSummaryView._scoped_querysets

        # 4. Optional filters:
        #    specialty=    → User.specialty__icontains
        #    city_id=      → User.city_id
        #    region=       → User.city__region__icontains
        #    branch_id=    → User.branches__id
        #    parent_branch_id= → User.branches__parent_id
        #    degree_id=    → User.current_degree_id
        #    gender=       → User.gender
        #    institution_id= → User.institutions__id  (M2M to Institution)

        # 5. Group by city
        distribution = (
            base_qs
            .values('city_id', 'city__name', 'city__region',
                    'city__latitude', 'city__longitude')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response([
            {
                'city_id': d['city_id'],
                'city_name': d['city__name'],
                'region': d['city__region'],
                'lat': float(d['city__latitude']),
                'lng': float(d['city__longitude']),
                'count': d['count'],
            }
            for d in distribution
        ])
```

### B2. Register URL
**File:** `backend/backend/urls.py`

```python
path('api/dashboard/doctor-distribution/', DoctorDistributionView.as_view()),
```

### B3. Frontend API method
**File:** `frontend/src/api/dashboardApi.ts`

```typescript
async getDoctorDistribution(filters?: Record<string, string>) {
  return apiClient.get<DoctorDistributionItem[]>(
    'dashboard/doctor-distribution/', { params: filters }
  );
}
```

### B4. Frontend type
**File:** `frontend/src/models/dashboard.ts`

```typescript
export interface DoctorDistributionItem {
  city_id: number;
  city_name: string;
  region: string | null;
  lat: number;
  lng: number;
  count: number;
}
```

---

## Phase C: Frontend — Map Components

### C1. Install dependencies
```bash
npm i leaflet react-leaflet@4 leaflet.heat
npm i -D @types/leaflet @types/leaflet.heat
```

### C2. Libya GeoJSON
- Download from `https://simplemaps.com/gis/country/ly` (or Natural Earth)
- Save to `frontend/src/assets/geojson/libya.json`

### C3. HeatmapLayer component
**New file:** `frontend/src/components/map/HeatmapLayer.tsx`

```typescript
interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, normalized_intensity]
  radius?: number;
  blur?: number;
  max?: number;
  gradient?: Record<number, string>;
}

// Uses useMap() react-leaflet hook
// Creates L.heatLayer() on mount, calls setLatLngs() on points change
// Default gradient: {0.0:'blue', 0.25:'green', 0.5:'yellow', 0.75:'orange', 1.0:'red'}
```

### C4. DoctorHeatmapPage
**New file:** `frontend/src/pages/dashboard/DoctorHeatmapPage.tsx`

Layout: Full viewport map with floating filter panels

```
┌──────────────────────────────────────────────────────────────┐
│  ┌─── Left Panel (w-72, floating) ──┐                       │
│  │  User Type Tabs [Doctor|Institution|All]  │               │
│  │  Specialty dropdown               │     Map (Leaflet)    │
│  │  Main Branch dropdown             │  ┌───────────────┐   │
│  │  Sub Branch dropdown              │  │  Heat overlay  │   │
│  │  Area/Region dropdown             │  │  + Libya       │   │
│  │  City dropdown (cascades)         │  │  boundary      │   │
│  └───────────────────────────────────┘  └───────────────┘   │
│                       ┌─── Right Panel (w-64, floating) ──┐  │
│                       │  Degree dropdown                  │  │
│                       │  Gender radios                    │  │
│                       └───────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Fetch distribution on mount → `setPoints(normalize(counts))` → heatmap renders
2. Filter change → refetch → `heatLayerRef.current.setLatLngs(newPoints)`
3. City selected → `map.flyTo({center: [lat, lng], zoom: 12})`
4. Normalize: `count / max(count)` → intensity 0–1

**Styles:**
- Map: `h-[calc(100vh-64px)] w-full` (below sidebar header)
- Panels: `absolute top-4 z-[1000] bg-content1/90 backdrop-blur-md rounded-[24px] shadow-lg border p-4`

### C5. Route + Nav

**File:** `frontend/src/App.tsx`
```typescript
const DoctorHeatmapPage = lazy(() => import("@/pages/dashboard/DoctorHeatmapPage"));
// ...
<Route element={<DoctorHeatmapPage />} path="/doctor-map" />
```

**File:** `frontend/src/config/site.ts` — add to `nav.dashboard` section:
```typescript
{ labelKey: "nav.doctorMap", href: "/doctor-map", icon: "FiMap" }
```

**i18n:** `frontend/src/i18n/locales/{ar,en}/nav.ts`
- EN: `doctorMap: "Doctor Map"`
- AR: `doctorMap: "خريطة الأطباء"`

---

## Effort

| Step | Time |
|---|---|
| City lat/lng migration + seed | 1h |
| Distribution API view | 1.5h |
| Install deps + GeoJSON + types | 30m |
| HeatmapLayer component | 1h |
| DoctorHeatmapPage + filters | 3h |
| Route + nav + i18n | 30m |
| **Total** | **~7.5h** |
