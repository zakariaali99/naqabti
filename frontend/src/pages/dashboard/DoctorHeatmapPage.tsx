import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { motion, AnimatePresence } from "framer-motion";

import HeatmapLayer from "@/components/map/HeatmapLayer";
import { dashboardApi } from "@/api/dashboardApi";
import citiesApi from "@/api/citiesApi";
import nationalitiesApi from "@/api/nationalitiesApi";
import doctorSpecialtyApi from "@/api/doctorSpecialtyApi";
import { DoctorDistributionItem } from "@/models/dashboard";
import { City } from "@/models/city";
import { Nationality } from "@/models/nationality";
import { DoctorSpecialty } from "@/models/doctorSpecialty";
import libyaGeoJSON from "@/assets/geojson/libya.json";

import { useLanguageStore } from "@/stores/languageStore";
import { LibyaMapIcon } from "@/components/icons";

import {
  Select,
  SelectItem,
  Input,
  Button,
  Spinner,
} from "@heroui/react";
import {
  FiZoomIn,
  FiZoomOut,
  FiHome,
  FiFilter,
  FiList,
  FiX,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";

const MAP_CENTER: [number, number] = [28, 17];
const MAP_ZOOM = 6;

const USER_TYPES = [
  { value: "doctor", labelKey: "dashboard.heatmap.doctors" },
  { value: "institution", labelKey: "dashboard.heatmap.institutions" },
  { value: "all", labelKey: "dashboard.heatmap.all" },
];

const GENDERS = [
  { value: "", labelKey: "dashboard.heatmap.all" },
  { value: "male", labelKey: "dashboard.heatmap.male" },
  { value: "female", labelKey: "dashboard.heatmap.female" },
];

const MEMBERSHIP_OPTIONS = [
  { value: "", labelKey: "dashboard.heatmap.all" },
  { value: "active", labelKey: "dashboard.heatmap.activeMember" },
  { value: "none", labelKey: "dashboard.heatmap.nonMember" },
];

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const runInvalidate = () => {
      map.invalidateSize();
    };

    // Trigger on initial loads & settling delays (flex layouts, screen rendering)
    runInvalidate();
    const t1 = setTimeout(runInvalidate, 100);
    const t2 = setTimeout(runInvalidate, 500);
    const t3 = setTimeout(runInvalidate, 1000);

    window.addEventListener("resize", runInvalidate);

    // Watch bubbled layout transition completions (like sidebar slides)
    const container = map.getContainer();
    container.addEventListener("transitionend", runInvalidate);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", runInvalidate);
      container.removeEventListener("transitionend", runInvalidate);
    };
  }, [map]);

  return null;
}

function LibyaOutline() {
  return (
    <GeoJSON
      data={libyaGeoJSON as any}
      style={{
        fillColor: "transparent",
        weight: 2,
        color: "#000",
        fillOpacity: 0,
      }}
      interactive={false}
    />
  );
}

function SelectedCityMarker({ city }: { city: City | null }) {
  if (!city || !city.latitude || !city.longitude) return null;
  return (
    <>
      <CircleMarker
        center={[city.latitude, city.longitude]}
        radius={28}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
          weight: 4,
          dashArray: "8 6",
        }}
      />
      <CircleMarker
        center={[city.latitude, city.longitude]}
        radius={20}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 2,
        }}
      />
    </>
  );
}


export default function DoctorHeatmapPage() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguageStore();
  const mapRef = useRef<L.Map | null>(null);

  const [points, setPoints] = useState<[number, number, number][]>([]);
  const [maxVal, setMaxVal] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cities, setCities] = useState<City[]>([]);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [specialties, setSpecialties] = useState<DoctorSpecialty[]>([]);

  const [cityCounts, setCityCounts] = useState<{ cityId: number; name: string; name_ar: string | null; count: number }[]>([]);
  const [rawDistributionData, setRawDistributionData] = useState<DoctorDistributionItem[]>([]);

  const [filters, setFilters] = useState<Record<string, string>>({
    user_type: "doctor",
    gender: "",
    city_id: "",
    nationality_id: "",
    specialty: "",
    age_min: "",
    age_max: "",
    has_membership: "",
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityListSortAsc, setCityListSortAsc] = useState(false);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCityListDrawerOpen, setIsCityListDrawerOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [isCityListPanelOpen, setIsCityListPanelOpen] = useState(true);

  // Debounced input states for age inputs to prevent network flooding
  const [ageMinInput, setAgeMinInput] = useState("");
  const [ageMaxInput, setAgeMaxInput] = useState("");

  // Cancel token / ref for managing request concurrency
  const abortControllerRef = useRef<AbortController | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const lang = i18n.language;

  useEffect(() => {
    citiesApi.getAll().then((res: any) => {
      const list = res.data?.results || res.data || [];
      setCities(list.filter((c: City) => c.latitude && c.longitude));
    }).catch(() => { });

    nationalitiesApi.getAll({}).then((res: any) => {
      const list = res.data?.results || res.data || [];
      setNationalities(list);
    }).catch(() => { });

    doctorSpecialtyApi.getAll({}).then((res: any) => {
      const list = res.data?.results || res.data || [];
      setSpecialties(list);
    }).catch(() => { });
  }, []);

  const fetchData = useCallback(async (currentFilters: Record<string, string>) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(currentFilters)) {
        if (v) params[k] = v;
      }

      const res = await dashboardApi.getDoctorDistribution(params, controller.signal);
      const data: DoctorDistributionItem[] = res.data;

      const max = data.length > 0 ? Math.max(...data.map((d) => isFinite(d.count) ? d.count : 0), 1) : 1;

      // Map coordinates and intensities directly to the real system data from the database.
      const pts: [number, number, number][] = data
        .filter((d) => d.lat != null && d.lng != null && isFinite(d.lat) && isFinite(d.lng) && d.lat !== 0 && d.lng !== 0)
        .map((d) => [d.lat, d.lng, d.count]);

      setPoints(pts);
      setMaxVal(max);
      setRawDistributionData(data);

      const countsMap = new Map<number, { name: string; name_ar: string | null; count: number }>();
      data.forEach((d) => {
        const existing = countsMap.get(d.city_id);
        if (existing) {
          existing.count += d.count;
        } else {
          countsMap.set(d.city_id, { name: d.city_name, name_ar: d.city_name_ar, count: d.count });
        }
      });
      const sorted = Array.from(countsMap.entries())
        .map(([cityId, { name, name_ar, count }]) => ({ cityId, name, name_ar, count }))
        .sort((a, b) => b.count - a.count);
      setCityCounts(sorted);
    } catch (err: any) {
      if (err.name === "AbortError" || err.name === "CanceledError") {
        return; // Request was aborted, ignore error
      }
      console.error("Failed to fetch distribution:", err);
      setError(t("dashboard.heatmap.loadError"));
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  // Force map ref dimension invalidation when loading changes
  useEffect(() => {
    if (!loading && mapRef.current) {
      const runInvalidate = () => {
        mapRef.current?.invalidateSize();
      };
      runInvalidate();
      const t = setTimeout(runInvalidate, 200);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Sync inputs with filters in case they change from outside
  useEffect(() => {
    setAgeMinInput(filters.age_min || "");
  }, [filters.age_min]);

  useEffect(() => {
    setAgeMaxInput(filters.age_max || "");
  }, [filters.age_max]);

  // Debounce age_min input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ageMinInput !== filters.age_min) {
        handleFilterChange("age_min", ageMinInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [ageMinInput, filters.age_min]);

  // Debounce age_max input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ageMaxInput !== filters.age_max) {
        handleFilterChange("age_max", ageMaxInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [ageMaxInput, filters.age_max]);

  const handleCitySelect = (cityId: string) => {
    handleFilterChange("city_id", cityId);
    if (!cityId) {
      setSelectedCity(null);
      mapRef.current?.flyTo(MAP_CENTER, MAP_ZOOM);
      return;
    }
    const city = cities.find((c) => c.id === parseInt(cityId)) || null;
    setSelectedCity(city);
    if (city?.latitude && city?.longitude) {
      mapRef.current?.flyTo([city.latitude, city.longitude], 8, { duration: 1.5 });
    }
  };

  const displayName = (item: { name: string; name_ar?: string | null }) => {
    if (lang === "ar" && item.name_ar) return item.name_ar;
    return item.name;
  };

  // Merge API counts with full city list for zero-count display
  const allCitiesWithCounts = useMemo(() => {
    const countMap = new Map(cityCounts.map(c => [c.cityId, c.count]));
    return cities
      .filter(c => c.latitude && c.longitude)
      .map(c => ({
        cityId: c.id,
        name: c.name,
        name_ar: c.name_ar || null,
        count: countMap.get(c.id) || 0,
      }))
      .sort((a, b) => cityListSortAsc ? a.count - b.count : b.count - a.count);
  }, [cityCounts, cities, cityListSortAsc]);

  // Area-level data when city_id is set
  const areaCounts = useMemo(() => {
    if (!filters.city_id) return [];
    const areas = rawDistributionData
      .filter((d) => d.area)
      .map((d) => ({
        name: d.area!,
        count: d.count,
        lat: d.lat,
        lng: d.lng,
      }))
      .sort((a, b) => cityListSortAsc ? a.count - b.count : b.count - a.count);
    return areas;
  }, [rawDistributionData, filters.city_id, cityListSortAsc]);

  const totalCount = useMemo(() =>
    allCitiesWithCounts.reduce((sum, c) => sum + c.count, 0),
    [allCitiesWithCounts],
  );

  const areaTotal = useMemo(() =>
    areaCounts.reduce((sum, a) => sum + a.count, 0),
    [areaCounts],
  );

  const leftClass = isRTL ? "right-4" : "left-4";
  const rightClass = isRTL ? "left-4" : "right-4";

  const filterContent = (
    <div className="space-y-4">
      <Select
        label={t("dashboard.heatmap.type")}
        labelPlacement="outside"
        placeholder={t("dashboard.heatmap.type")}
        selectedKeys={[filters.user_type || "doctor"]}
        size="sm"
        variant="bordered"
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as string;
          handleFilterChange("user_type", val || "doctor");
        }}
      >
        {USER_TYPES.map((ut) => (
          <SelectItem key={ut.value}>{t(ut.labelKey)}</SelectItem>
        )) as any}
      </Select>

      <Select
        label={t("dashboard.heatmap.gender")}
        labelPlacement="outside"
        placeholder={t("dashboard.heatmap.gender")}
        selectedKeys={[filters.gender || ""]}
        size="sm"
        variant="bordered"
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as string;
          handleFilterChange("gender", val || "");
        }}
      >
        {GENDERS.map((g) => (
          <SelectItem key={g.value}>{t(g.labelKey)}</SelectItem>
        )) as any}
      </Select>

      <Select
        label={t("dashboard.heatmap.city")}
        labelPlacement="outside"
        placeholder={t("dashboard.heatmap.city")}
        selectedKeys={filters.city_id ? [filters.city_id] : []}
        size="sm"
        variant="bordered"
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as string;
          handleCitySelect(val || "");
        }}
      >
        <SelectItem key="">{t("dashboard.heatmap.all")}</SelectItem>
        {cities.map((c) => (
          <SelectItem key={String(c.id)}>{displayName(c)}</SelectItem>
        )) as any}
      </Select>

      <Select
        label={t("dashboard.heatmap.nationality")}
        labelPlacement="outside"
        placeholder={t("dashboard.heatmap.nationality")}
        selectedKeys={filters.nationality_id ? [filters.nationality_id] : []}
        size="sm"
        variant="bordered"
        className="max-h-48"
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as string;
          handleFilterChange("nationality_id", val || "");
        }}
      >
        <SelectItem key="">{t("dashboard.heatmap.all")}</SelectItem>
        {nationalities.map((n) => (
          <SelectItem key={String(n.id)}>{displayName(n)}</SelectItem>
        )) as any}
      </Select>

      <Select
        label={t("dashboard.heatmap.specialty")}
        labelPlacement="outside"
        placeholder={t("dashboard.heatmap.specialty")}
        selectedKeys={filters.specialty ? [filters.specialty] : []}
        size="sm"
        variant="bordered"
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as string;
          handleFilterChange("specialty", val || "");
        }}
      >
        <SelectItem key="">{t("dashboard.heatmap.all")}</SelectItem>
        {specialties.map((s) => (
          <SelectItem key={s.name}>{s.name}</SelectItem>
        )) as any}
      </Select>

      <Select
        label={t("dashboard.heatmap.membership")}
        labelPlacement="outside"
        placeholder={t("dashboard.heatmap.membership")}
        selectedKeys={[filters.has_membership || ""]}
        size="sm"
        variant="bordered"
        onSelectionChange={(keys) => {
          const val = Array.from(keys)[0] as string;
          handleFilterChange("has_membership", val || "");
        }}
      >
        {MEMBERSHIP_OPTIONS.map((m) => (
          <SelectItem key={m.value}>{t(m.labelKey)}</SelectItem>
        )) as any}
      </Select>

      <div>
        <span className="block text-sm text-default-500 mb-1.5">
          {t("dashboard.heatmap.age")}
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            size="sm"
            variant="bordered"
            placeholder={t("dashboard.heatmap.from")}
            min={0}
            max={120}
            value={ageMinInput}
            onValueChange={setAgeMinInput}
            className="flex-1"
          />
          <span className="text-default-400 text-sm">–</span>
          <Input
            type="number"
            size="sm"
            variant="bordered"
            placeholder={t("dashboard.heatmap.to")}
            min={0}
            max={120}
            value={ageMaxInput}
            onValueChange={setAgeMaxInput}
            className="flex-1"
          />
        </div>
      </div>

      {error && (
        <p className="text-danger text-xs">{error}</p>
      )}
    </div>
  );

  const isAreaMode = !!filters.city_id && areaCounts.length > 0;

  const cityListContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {isDesktop && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {isAreaMode ? (selectedCity ? displayName(selectedCity) : t("dashboard.heatmap.areas")) : t("dashboard.heatmap.totalCities")}{" "}
            <span className="text-default-400 font-normal normal-case">
              ({(isAreaMode ? areaTotal : totalCount).toLocaleString(lang === "ar" ? "ar-LY" : "en-US")})
            </span>
          </h4>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("dashboard.heatmap.sort")}
            onPress={() => setCityListSortAsc(!cityListSortAsc)}
          >
            {cityListSortAsc ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
          </Button>
        </div>
      )}

      <div className="overflow-y-auto flex-1 space-y-1">
        {isAreaMode ? (
          areaCounts.length === 0 ? (
            <p className="text-xs text-default-400">{t("dashboard.heatmap.noCities")}</p>
          ) : (
            areaCounts.map((area, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-[12px] hover:bg-default/40 transition-colors cursor-pointer"
                onClick={() => {
                  if (area.lat && area.lng) {
                    mapRef.current?.flyTo([area.lat, area.lng], 10, { duration: 1.5 });
                  }
                }}
              >
                <span className="text-sm text-foreground">{area.name}</span>
                <span className="text-sm font-semibold text-primary">{area.count}</span>
              </div>
            ))
          )
        ) : allCitiesWithCounts.length === 0 ? (
          <p className="text-xs text-default-400">{t("dashboard.heatmap.noCities")}</p>
        ) : (
          allCitiesWithCounts.map((city) => (
            <div
              key={city.cityId}
              className={`flex items-center justify-between p-2 rounded-[12px] transition-colors cursor-pointer ${
                selectedCity?.id === city.cityId
                  ? "border-2 border-primary bg-primary/10"
                  : "hover:bg-default/40 border-2 border-transparent"
              }`}
              onClick={() => {
                const c = cities.find((c2) => c2.id === city.cityId) || null;
                if (c && c.latitude && c.longitude) {
                  setSelectedCity(c);
                  handleFilterChange("city_id", String(city.cityId));
                  mapRef.current?.flyTo([c.latitude, c.longitude], 8, { duration: 1.5 });
                }
              }}
            >
              <span className="text-sm text-foreground">{displayName(city)}</span>
              <span className={`text-sm font-semibold ${city.count > 0 ? "text-primary" : "text-default-300"}`}>
                {city.count}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100dvh-130px)] sm:h-[calc(100dvh-170px)]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 rounded-[24px]">
          <Spinner color="primary" size="lg" />
        </div>
      )}

      {/* Top Controls Toolbar (inline document flow, NOT fixed/absolute) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-content1 border border-default-200 rounded-[24px] shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <LibyaMapIcon className="text-primary" size={18} />
          <h2 className="text-sm font-bold text-foreground px-1">
            {t("dashboard.heatmap.title")}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Zoom / Home Controls */}
          <div className="flex items-center gap-1 bg-default-100 p-1 rounded-xl">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label="Zoom in"
              onPress={() => mapRef.current?.zoomIn()}
            >
              <FiZoomIn size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label="Zoom out"
              onPress={() => mapRef.current?.zoomOut()}
            >
              <FiZoomOut size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label="Reset view"
              onPress={() => mapRef.current?.flyTo(MAP_CENTER, MAP_ZOOM)}
            >
              <FiHome size={16} />
            </Button>
          </div>

          {/* Filter & City Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="flat"
              className="flex items-center gap-1.5 px-3"
              aria-label="Filters"
              startContent={<FiFilter size={16} />}
              onPress={() => {
                if (isDesktop) {
                  setIsFilterPanelOpen((p) => !p);
                } else {
                  setIsFilterDrawerOpen(true);
                }
              }}
            >
              {t("common.filters", "Filters")}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="flex items-center gap-1.5 px-3"
              aria-label="City list"
              startContent={<FiList size={16} />}
              onPress={() => {
                if (isDesktop) {
                  setIsCityListPanelOpen((p) => !p);
                } else {
                  setIsCityListDrawerOpen(true);
                }
              }}
            >
              {t("dashboard.heatmap.cities")}
              <span className="bg-default-200 text-default-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full ltr:ml-1 rtl:mr-1">
                {allCitiesWithCounts.length}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full relative rounded-[24px] overflow-hidden border border-default-200 isolate z-0">
        <MapContainer
          center={MAP_CENTER}
          className="w-full h-full"
          zoom={MAP_ZOOM}
          zoomControl={false}
          attributionControl={false}
          ref={mapRef}
        >
          <MapResizer />
          <TileLayer
            attribution=""
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LibyaOutline />
          <SelectedCityMarker city={selectedCity} />
          <HeatmapLayer points={points} max={maxVal} />
        </MapContainer>

        {/* Copyright overlay - absolute relative to the map container */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-xs text-default-400 bg-content1/60 backdrop-blur-sm px-2 py-0.5 rounded-[8px]"
          style={isRTL ? { right: "50%", left: "auto" } : undefined}
        >
          {t("dashboard.heatmap.copyright")}
        </div>

        {/* Desktop: Filter Panel (animated slide) */}
        <AnimatePresence>
          {isDesktop && isFilterPanelOpen && (
            <motion.div
              initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? 100 : -100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className={`absolute top-4 ${leftClass} z-[1000] bg-content1 border border-default-200 shadow-lg rounded-[24px] p-5 w-80 max-h-[calc(100%-32px)] overflow-y-auto`}
            >
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                {t("common.filters", "Filters")}
              </h3>
              {filterContent}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop: City List Panel (animated slide) */}
        <AnimatePresence>
          {isDesktop && isCityListPanelOpen && (
            <motion.div
              initial={{ x: isRTL ? -100 : 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? -100 : 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className={`absolute top-4 ${rightClass} z-[1000] bg-content1 border border-default-200 shadow-lg rounded-[24px] p-5 w-64 max-h-[calc(100%-32px)] overflow-y-auto`}
            >
              {cityListContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: Filter Drawer */}
      <AnimatePresence>
        {!isDesktop && isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[2000]"
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-[2000] bg-content1 rounded-t-[32px] max-h-[80vh] flex flex-col p-6 pb-8"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  {t("common.filters", "Filters")}
                </h3>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setIsFilterDrawerOpen(false)}
                >
                  <FiX size={18} />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {filterContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile: City List Drawer */}
      <AnimatePresence>
        {!isDesktop && isCityListDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[2000]"
              onClick={() => setIsCityListDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-[2000] bg-content1 rounded-t-[32px] h-[70vh] max-h-[70vh] flex flex-col p-6 pb-8"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {t("dashboard.heatmap.totalCities")}{" "}
                  <span className="text-default-400 font-normal normal-case">
                    ({totalCount.toLocaleString(lang === "ar" ? "ar-LY" : "en-US")})
                  </span>
                </h4>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    aria-label={t("dashboard.heatmap.sort")}
                    onPress={() => setCityListSortAsc(!cityListSortAsc)}
                  >
                    {cityListSortAsc ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsCityListDrawerOpen(false)}
                  >
                    <FiX size={18} />
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {cityListContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
