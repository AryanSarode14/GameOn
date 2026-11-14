import "./RequireLogin.css";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useUser } from "../context/UserContext.jsx";

function RequireLogin({ children }) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading)
    return (
      <p className="require-login" role="status">
        Loading…
      </p>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

RequireLogin.propTypes = { children: PropTypes.node.isRequired };

export default RequireLogin;
