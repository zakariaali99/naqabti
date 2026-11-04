import { useUserStore } from "@/stores/userStore";
import MemberDashboard from "./MemberDashboard";
import ManagerDashboard from "./ManagerDashboard";

const Dashboard = () => {
  const user = useUserStore((state) => state.user);
  const isMember = user?.user_type === "doctor" || user?.user_type === "student";

  if (isMember) {
    return <MemberDashboard />;
  }

  return <ManagerDashboard />;
};

export default Dashboard;
