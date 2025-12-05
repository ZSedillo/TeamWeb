import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUser, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router";
import { forgotPassword, clearUserErrors } from "../_actions/user.actions";
import './ForgotPassword.css';
import TeamLogo from "../assets/images/TeamLogo.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error } = useSelector(state => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    dispatch(clearUserErrors());

    try {
      const result = await dispatch(forgotPassword(email));

      if (result.success) {
        // 🛑 CRITICAL FIX: Clear the "User verified successfully" message 
        // BEFORE navigating. This prevents the ResetPassword page from 
        // seeing "success" and immediately redirecting to login.
        dispatch(clearUserErrors());

        navigate('/reset-password', { 
          state: { 
            resetToken: result.resetToken, 
            userId: result.userId 
          } 
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      dispatch(clearUserErrors());
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
                value={email}
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