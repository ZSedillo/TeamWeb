import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { checkAuth } from "../_actions/user.actions";
import TeamLogo from "../assets/images/TeamLogo.png";

function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, checked } = useSelector((state) => state.user);

  // Run checkAuth only once (on first mount)
  useEffect(() => {
    if (!checked) {
      dispatch(checkAuth());
    }
  }, [dispatch, checked]);

  // ⛔ Don't render or redirect until auth check is done
  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-6 p-8">
          {/* Team Logo */}
          <div className="mb-2">
            <img 
              src={TeamLogo} 
              alt="Team Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Loading Spinner */}
          <div className="relative w-8 h-8">
            <div className="absolute w-full h-full border-3 border-gray-300 rounded-full"></div>
            <div className="absolute w-full h-full border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

          {/* Loading Text */}
          <p className="text-gray-700 text-base font-medium">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  // ✅ Only decide after we know the result
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
