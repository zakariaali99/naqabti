import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Spinner, Chip, Button } from "@heroui/react";
import { FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "@/stores/languageStore";
import adsApi from "@/api/adsApi";
import { Ad } from "@/models/ad";

const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, "")
  : "http://localhost:8000";

export const AdBanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isRTL } = useLanguageStore();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await adsApi.getAll({ status: "published", page_size: 10 });
        const data = response.data;
        const results = data?.results || (Array.isArray(data) ? data : []);
        setAds(results);
      } catch (error) {
        console.error("Failed to fetch ads for banner:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 8000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ads.length]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const childWidth = container.children[0]?.getBoundingClientRect().width || 0;
      container.scrollTo({
        left: isRTL ? -(currentIndex * childWidth) : currentIndex * childWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex, isRTL]);

  const recordView = useCallback(
    (adId: number) => {
      adsApi.recordView(adId).catch(() => {});
    },
    [],
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const adId = entry.target.getAttribute("data-ad-id");
            if (adId) recordView(Number(adId));
          }
        });
      },
      { threshold: 0.5 },
    );

    return () => observerRef.current?.disconnect();
  }, [recordView]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      document.querySelectorAll("[data-ad-id]").forEach((el) => {
        observerRef.current?.observe(el);
      });
    }
  }, [ads]);

  const scrollTo = (index: number) => {
    setCurrentIndex(index);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 8000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{t("ads.banner.title", "Advertisements")}</h3>
      </div>

      <div className="relative">
        {ads.length > 1 && (
          <Button
            isIconOnly
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md"
            size="sm"
            variant="flat"
            onPress={() => scrollTo(currentIndex === 0 ? ads.length - 1 : currentIndex - 1)}
          >
            <FiChevronLeft className={isRTL ? "rotate-180" : ""} />
          </Button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-1 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {ads.map((ad) => (
            <div
              key={ad.id}
              data-ad-id={ad.id}
              className="snap-start shrink-0 w-full max-w-[400px]"
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onPress={() => navigate(`/ads/${ad.id}`)}
              >
                <CardBody className="p-0">
                  {ad.featured_image && (
                    <img
                      alt={ad.title}
                      className="w-full h-36 object-cover rounded-t-lg"
                      src={
                        typeof ad.featured_image === "string"
                          ? ad.featured_image.startsWith("http")
                            ? ad.featured_image
                            : `${BASE_URL}${ad.featured_image}`
                          : ""
                      }
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{ad.title}</h4>
                      <Chip
                        color="primary"
                        size="sm"
                        variant="flat"
                        startContent={<FiEye size={12} />}
                      >
                        {ad.views_count}
                      </Chip>
                    </div>
                    <p className="text-xs text-default-500 mt-1 line-clamp-2">{ad.content}</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        {ads.length > 1 && (
          <Button
            isIconOnly
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 shadow-md"
            size="sm"
            variant="flat"
            onPress={() => scrollTo((currentIndex + 1) % ads.length)}
          >
            <FiChevronRight className={isRTL ? "rotate-180" : ""} />
          </Button>
        )}
      </div>

      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {ads.map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? "bg-primary w-4" : "bg-default-300"
              }`}
              onClick={() => scrollTo(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdBanner;
