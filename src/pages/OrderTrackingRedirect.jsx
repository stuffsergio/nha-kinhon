import { Navigate, useParams } from "react-router-dom";

/** Deep link from push notifications (mobile/web): /pedido/:id */
export default function OrderTrackingRedirect() {
  const { id } = useParams();
  if (!id) return <Navigate to="/perfil?tab=orders" replace />;
  return <Navigate to={`/perfil?tab=orders&orderId=${id}`} replace />;
}
