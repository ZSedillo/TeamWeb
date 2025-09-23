import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FaUser, FaExclamationCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { login, clearUserErrors } from "../_actions/user.actions";
import "./Login.css";
import TeamLogo from "../assets/images/TeamLogo.png";

function Login() {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get state from Redux store
    const { loading, error, isAuthenticated, user } = useSelector(state => state.user);

    useEffect(() => {
        // Clear any previous errors when component mounts
        dispatch(clearUserErrors());
        
        // If already authenticated, redirect to admin homepage
        if (isAuthenticated && user) {
            navigate("/admin-homepage");
        }
    }, [dispatch, isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        
        // Clear errors when user starts typing
        if (error) {
            dispatch(clearUserErrors());
        }
    };
    
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const result = await dispatch(login(formData));
            
            if (result.success) {
                navigate("/admin-homepage");
            }
            // Error handling is done by Redux, no need to handle here
        } catch (error) {
            console.error('Login error:', error);
        }
    };
    
    return (
        <div className="page-container">
            <img src={TeamLogo} alt="Team Logo" className="team-logo" />
            <div className="login-container">
                <div className="form-box">
                    <div className="form-content">
                        <FaUser className="admin-icon" />
                        <div className="title">HI ADMIN!</div>
                        {error && (
                            <div className="error-box">
                                <FaExclamationCircle className="error-icon" />
                                <span>{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="username"
                                placeholder="USERNAME"
                                className="input-field"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="PASSWORD"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                                <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
                                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                                </span>
                            </div>
                            <button 
                                type="submit" 
                                className="btn" 
                                disabled={loading}
                            >
                                {loading ? 'LOGGING IN...' : 'LOGIN'}
                            </button>
                        </form>
                        <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;