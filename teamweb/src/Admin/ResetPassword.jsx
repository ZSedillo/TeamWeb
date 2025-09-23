import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword, clearUserErrors } from "../_actions/user.actions";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import TeamLogo from "../assets/images/TeamLogo.png";
import "./ResetPassword.css";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redux state
  const { loading, error, message } = useSelector((state) => state.user);

  // Token + userId from ForgotPassword redirect
  const { resetToken, userId } = location.state || {};

  // Redirect if no token (user accessed directly)
  useEffect(() => {
    if (!resetToken || !userId) {
      navigate("/forgot-password");
    }
  }, [resetToken, userId, navigate]);

  // Auto-redirect after success
  useEffect(() => {
    if (message && message.toLowerCase().includes("success")) {
      const timer = setTimeout(() => navigate("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [message, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    dispatch(clearUserErrors());
    dispatch(resetPassword(newPassword, resetToken));
  };

  return (
    <>
      <img src={TeamLogo} alt="Team Logo" className="team-logo" />
      <div className="reset-password-container">
        <div className="form-box">
          <div className="form-content">
            <FaLock className="admin-icon" />
            <div className="title">RESET PASSWORD</div>

            {/* Show error */}
            {error && <p className="error-message">{error}</p>}

            {/* Show success */}
            {message && message.toLowerCase().includes("success") ? (
              <div className="success-message">
                <p>{message}</p>
                <p>Redirecting to login page...</p>
              </div>
            ) : (
              <>
                <p className="description">
                  Please enter your new password below.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      className="input-field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <span
                      className="password-toggle-icon"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                  </div>

                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      className="input-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <span
                      className="password-toggle-icon"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn"
                    disabled={loading || !newPassword || !confirmPassword}
                  >
                    {loading ? "PROCESSING..." : "RESET PASSWORD"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;
