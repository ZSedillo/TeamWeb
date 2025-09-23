import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUser, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router";
import { forgotPassword, clearUserErrors } from "../_actions/user.actions";
import './ForgotPassword.css';
import TeamLogo from "../assets/images/TeamLogo.png";

function ForgotPassword() {
  const [email, setEmail] = useState(""); // ✅ Use email instead of username
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get state from Redux store
  const { loading, error } = useSelector(state => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Clear any existing errors
    dispatch(clearUserErrors());

    try {
      const result = await dispatch(forgotPassword(email)); // ✅ Pass email

      if (result.success) {
        // Navigate to reset-password with resetToken and userId
        navigate('/reset-password', { 
          state: { 
            resetToken: result.resetToken, 
            userId: result.userId 
          } 
        });
      }
      // Error handling is done by Redux
    } catch (error) {
      console.error("Forgot password error:", error);
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value); // ✅ Update email state
    if (error) {
      dispatch(clearUserErrors()); // Clear errors when typing
    }
  };

  return (
    <>
      <img src={TeamLogo} alt="Team Logo" className="team-logo" />
      <div className="forgot-container">
        <div className="form-box">
          <div className="form-content">
            <FaUser className="admin-icon" />
            <div className="title">FORGOT PASSWORD?</div>
            <p className="description">
              Please enter your registered email to reset your password.
            </p>
            
            {error && (
              <div className="error-container">
                <FaExclamationTriangle className="error-icon" />
                <span className="error-text">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <input 
                type="email" 
                placeholder="Email" 
                className="input-field" 
                value={email} // ✅ Bind to email
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <button type="submit" className="btn" disabled={loading || !email}>
                {loading ? "PROCESSING..." : "SUBMIT"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;
