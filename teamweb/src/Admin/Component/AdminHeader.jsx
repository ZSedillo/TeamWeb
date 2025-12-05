import { useState, useEffect } from "react";
import { FaUser, FaSignOutAlt, FaTimes, FaBars } from "react-icons/fa";
import { useNavigate, useLocation, Link } from "react-router-dom"; // ✅ Added useLocation and Link
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../_actions/user.actions"; 
import "./AdminHeader.css";
import TeamLogo from "../../assets/images/TeamLogo.png";

const AdminHeader = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // ✅ Use this hook to track URL changes
  const dispatch = useDispatch();

  // Get username from Redux store
  const { user } = useSelector((state) => state.user);
  const username = user?.username || "Admin";

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set active tab based on current URL
  useEffect(() => {
    const path = location.pathname; // ✅ Uses React Router location
    if (path === "/manage-announcement") setActiveTab("manageannouncement");
    else if (path === "/manage-calendar") setActiveTab("managecalendar");
    else if (path === "/manage-preregistration") setActiveTab("managepreregistration");
    else if (path === "/manage-schoolinfo") setActiveTab("manageschoolinfo");
    else if (path === "/manage-account") setActiveTab("manageaccount");
    else if (path === "/view-report") setActiveTab("viewreport");
    else if (path === "/admin-homepage") setActiveTab("home");
    else setActiveTab("home");
  }, [location.pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  // Toggle the dropdown
  const handleUserClick = () => setShowLogout(!showLogout);

  // ✅ FIXED LOGOUT HANDLER
  const handleLogout = async (e) => {
    e.stopPropagation(); // 🛑 This stops the click from closing the menu immediately
    e.preventDefault();

    const result = await dispatch(logout());
    if (result.success) {
      navigate("/login");
    } else {
      console.error("Logout failed:", result.error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if we clicked outside the profile container AND the logout button wasn't the target
      if (showLogout && !event.target.closest(".user-profile-container")) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLogout]);

  return (
    <header className="admin-header">
      {/* Top Section */}
      <div className="admin-top-bar">
        <div className="admin-logo-container">
          <img src={TeamLogo} alt="School Logo" className="admin-logo" />
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>

        <div className="admin-controls">
          {/* User Profile Container */}
          <div className="user-profile-container" onClick={handleUserClick}>
            <div className="user-profile">
              <div className="user-avatar"><FaUser /></div>
              <span className="username">{username}</span>
            </div>
            
            {showLogout && (
              <div className="logout-dropdown">
                {/* ✅ Added stopPropagation to button as well just in case */}
                <button className="logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>

          <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle navigation menu">
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Navigation Menu - ✅ Replaced <a> with <Link> to prevent page reloads */}
      <nav className={`admin-nav ${menuOpen ? "show" : ""}`}>
        <div className="admin-nav-container">
          <Link 
            to="/admin-homepage" 
            className={activeTab === "home" ? "active" : ""} 
            onClick={() => setMenuOpen(false)}
          >
            Manage Home
          </Link>
          <Link 
            to="/manage-announcement" 
            className={activeTab === "manageannouncement" ? "active" : ""} 
            onClick={() => setMenuOpen(false)}
          >
            Manage Announcements
          </Link>
          <Link 
            to="/manage-calendar" 
            className={activeTab === "managecalendar" ? "active" : ""} 
            onClick={() => setMenuOpen(false)}
          >
            Manage School Calendar
          </Link>
          <Link 
            to="/manage-preregistration" 
            className={activeTab === "managepreregistration" ? "active" : ""} 
            onClick={() => setMenuOpen(false)}
          >
            Manage Pre-Registration
          </Link>
          <Link 
            to="/manage-account" 
            className={activeTab === "manageaccount" ? "active" : ""} 
            onClick={() => setMenuOpen(false)}
          >
            Manage Accounts
          </Link>
          <Link 
            to="/view-report" 
            className={activeTab === "viewreport" ? "active" : ""} 
            onClick={() => setMenuOpen(false)}
          >
            Admin Logs
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default AdminHeader;