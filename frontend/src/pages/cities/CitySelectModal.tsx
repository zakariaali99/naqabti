import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { FiSearch, FiMapPin } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import citiesApi from "@/api/citiesApi";
import { City } from "@/models/city";

interface CitySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  selectedCityId?: number | null;
}

const CitySelectModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedCityId,
}: CitySelectModalProps) => {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCities = async () => {
      try {
        setLoading(true);
        const res = await citiesApi.getAll({ search: searchQuery || undefined, page_size: 100 });
        setCities(res.data.results);
      } catch (err) {
        console.error("Failed to fetch cities", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchCities, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedCity(null);
    }
  }, [isOpen]);

  const handleSelect = (city: City) => {
    setSelectedCity(city);
  };

  const handleConfirm = () => {
    if (selectedCity) {
      onSelect(selectedCity);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-primary" />
            <h3 className="text-lg font-semibold">
              {t("cities.selectCity", "Select City")}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <Input
            className="mb-3"
            placeholder={t("cities.searchPlaceholder", "Search cities...")}
            startContent={<FiSearch className="text-default-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner label={t("common.loading", "Loading...")} size="lg" />
            </div>
          ) : (
            <Table
              aria-label={t("cities.title", "Cities")}
              classNames={{ wrapper: "shadow-none p-0" }}
              selectionMode="single"
              selectedKeys={selectedCity ? new Set([String(selectedCity.id)]) : selectedCityId ? new Set([String(selectedCityId)]) : new Set()}
              onSelectionChange={(keys) => {
                const id = Array.from(keys)[0];
                const city = cities.find((c) => String(c.id) === String(id));
                if (city) handleSelect(city);
              }}
            >
              <TableHeader>
                <TableColumn>{t("cities.table.name", "Name")}</TableColumn>
                <TableColumn>{t("cities.table.region", "Region")}</TableColumn>
                <TableColumn>{t("cities.table.prefix", "Prefix")}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={t("cities.noRecords", "No cities found")}>
                {cities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell>{city.name}</TableCell>
                    <TableCell>{city.region || "—"}</TableCell>
                    <TableCell>{city.prefix || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedCity}
            onPress={handleConfirm}
          >
            {t("common.select", "Select")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CitySelectModal;
