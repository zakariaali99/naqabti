import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Chip,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  FiArrowLeft,
  FiEdit,
  FiEye,
  FiUsers,
  FiBarChart2,
  FiClock,
} from "react-icons/fi";

import adsApi from "@/api/adsApi";
import { Ad } from "@/models/ad";

export default function AdDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [ad, setAd] = useState<Ad | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  useEffect(() => {
    if (id) {
      const fetchAdDetails = async () => {
        try {
          setLoading(true);
          const resAd = await adsApi.getById(Number(id));
          setAd(resAd.data);
        } catch (err) {
          console.error("Failed to load ad campaign:", err);
        } finally {
          setLoading(false);
        }
      };

      const fetchAdStats = async () => {
        try {
          setStatsLoading(true);
          const resStats = await adsApi.getStats(Number(id));
          setStats(resStats.data);
        } catch (err) {
          console.error("Failed to load campaign analytics:", err);
        } finally {
          setStatsLoading(false);
        }
      };

      fetchAdDetails();
      fetchAdStats();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-danger">Campaign Not Found</h2>
        <p className="text-default-500">The requested advertising campaign does not exist or has been deleted.</p>
        <Button color="primary" onPress={() => navigate("/ads")}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button isIconOnly variant="light" onPress={() => navigate("/ads")}>
              <FiArrowLeft />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{ad.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Chip size="sm" variant="flat" color={ad.status === "published" ? "success" : "default"}>
                  {ad.status_display}
                </Chip>
                <span className="text-xs text-default-500">
                  Created on {formatDate(ad.created_at)}
                </span>
              </div>
            </div>
          </div>
          <Button
            color="primary"
            startContent={<FiEdit />}
            onPress={() => navigate(`/ads/${ad.id}/edit`)}
          >
            Edit Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Campaign Details Column */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Campaign Content</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {ad.featured_image && (
                  <img
                    alt={ad.title}
                    className="w-full max-h-72 object-cover rounded-lg border border-default-100"
                    src={ad.featured_image as string}
                  />
                )}
                <div className="p-2">
                  <p className="whitespace-pre-line text-default-700 text-sm leading-relaxed">
                    {ad.content}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Audience Targeting Filters</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-default-100 p-3 rounded-lg bg-default-50">
                    <div className="text-xs font-semibold text-default-400 uppercase">Target Branches</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ad.target_branches_detail && ad.target_branches_detail.length > 0 ? (
                        ad.target_branches_detail.map((b) => (
                          <Chip key={b.id} size="sm" variant="flat">{b.name}</Chip>
                        ))
                      ) : (
                        <span className="text-xs text-default-400 italic">All branches targeted</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-default-100 p-3 rounded-lg bg-default-50">
                    <div className="text-xs font-semibold text-default-400 uppercase">Target Cities</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ad.target_cities_detail && ad.target_cities_detail.length > 0 ? (
                        ad.target_cities_detail.map((c) => (
                          <Chip key={c.id} size="sm" variant="flat">{c.name}</Chip>
                        ))
                      ) : (
                        <span className="text-xs text-default-400 italic">All cities targeted</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-default-100 p-3 rounded-lg bg-default-50">
                    <div className="text-xs font-semibold text-default-400 uppercase">Target Specialties</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ad.target_specialties_detail && ad.target_specialties_detail.length > 0 ? (
                        ad.target_specialties_detail.map((s) => (
                          <Chip key={s.id} size="sm" variant="flat">{s.name}</Chip>
                        ))
                      ) : (
                        <span className="text-xs text-default-400 italic">All specialties targeted</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Quick Metrics Column */}
          <div className="space-y-6">
            <Card className="bg-primary/5 border border-primary/10">
              <CardBody className="p-6 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <FiUsers className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-default-400 uppercase">Projected Reach</h3>
                    <p className="text-2xl font-extrabold text-primary">
                      {ad.expected_audience_count.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-secondary/5 border border-secondary/10">
              <CardBody className="p-6 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                    <FiEye className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-default-400 uppercase">Actual Impressions</h3>
                    <p className="text-2xl font-extrabold text-secondary">
                      {ad.views_count.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FiBarChart2 className="text-default-500" />
                  <h3 className="font-semibold text-sm">Impressions Breakdown</h3>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {statsLoading ? (
                  <div className="flex justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    {/* Branch breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-default-400 uppercase">Top Viewing Branches</h4>
                      {stats.breakdown?.by_branch?.length > 0 ? (
                        stats.breakdown.by_branch.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{item.name}</span>
                              <span>{item.count}</span>
                            </div>
                            <Progress color="primary" size="sm" value={(item.count / (stats.views_count || 1)) * 100} />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-default-400 italic">No views recorded yet</p>
                      )}
                    </div>

                    {/* City breakdown */}
                    <div className="space-y-2 pt-2 border-t border-default-100">
                      <h4 className="text-xs font-semibold text-default-400 uppercase">Top Viewing Cities</h4>
                      {stats.breakdown?.by_city?.length > 0 ? (
                        stats.breakdown.by_city.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{item.name}</span>
                              <span>{item.count}</span>
                            </div>
                            <Progress color="secondary" size="sm" value={(item.count / (stats.views_count || 1)) * 100} />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-default-400 italic">No views recorded yet</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-default-400 italic">Analytics details unavailable</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Viewers Log Table */}
        <Card>
          <CardHeader className="flex items-center gap-2">
            <FiClock className="text-default-500" />
            <h2 className="text-lg font-bold">Impressions Log</h2>
          </CardHeader>
          <CardBody>
            {statsLoading ? (
              <div className="flex justify-center p-4">
                <Spinner size="sm" />
              </div>
            ) : stats?.viewers?.length > 0 ? (
              <Table aria-label="Viewer log table">
                <TableHeader>
                  <TableColumn>User</TableColumn>
                  <TableColumn>Full Name</TableColumn>
                  <TableColumn>Viewed At</TableColumn>
                </TableHeader>
                <TableBody>
                  {stats.viewers.map((viewer: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{viewer.username}</TableCell>
                      <TableCell>{viewer.full_name || "-"}</TableCell>
                      <TableCell className="text-xs text-default-500">
                        {formatDate(viewer.viewed_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-6 text-sm text-default-400 italic">
                No impressions logged for this campaign yet.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
