import React, { useState, useEffect, useContext, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { IoIosMoon } from "react-icons/io";
import { HiOutlineBars4, HiChevronDown } from "react-icons/hi2";
import { AiOutlineClose } from "react-icons/ai";
import { IoMdSunny } from "react-icons/io";
import { UserContext } from '../context/userContext';

const Navbar = () => {
  const [showNav, setShowNav] = useState(window.innerWidth >= 880);
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('IvoTe theme') || '');
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const { currentUser } = useContext(UserContext);

  const closeNavMenu = () => {
    if (window.innerWidth < 880) {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
  };

  const changeThemeHandler = () => {
    const newTheme = darkTheme === 'dark' ? '' : 'dark';
    localStorage.setItem('IvoTe theme', newTheme);
    setDarkTheme(newTheme);
  };

  useEffect(() => {
    document.body.classList.remove('dark');
    if (darkTheme === 'dark') {
      document.body.classList.add('dark');
    }
  }, [darkTheme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 880) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!showProfile) return;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showProfile]);

  useEffect(() => {
    setShowProfile(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) => (
    isActive ? 'nav_link active' : 'nav_link'
  );

  const profileFirstName =
    currentUser?.firstName ||
    currentUser?.voter?.firstName ||
    "";
  const profileLastName =
    currentUser?.lastName ||
    currentUser?.voter?.lastName ||
    "";
  const profileEmail =
    currentUser?.email ||
    currentUser?.voter?.email ||
    "";
  const profileName = `${profileFirstName} ${profileLastName}`.trim() || "User";
  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <nav>
      <div className="container nav_container">
        <Link to="/elections" className='nav_logo' onClick={closeNavMenu}>IvoTe</Link>
        <div className="nav_right">
          <div className={`nav_menu ${showNav ? 'show' : ''}`} id="primary-navigation">
            <NavLink to="/" onClick={closeNavMenu} className={navLinkClass}>News</NavLink>
            <NavLink to="/elections" onClick={closeNavMenu} className={navLinkClass}>Elections</NavLink>
            <NavLink to="/results" onClick={closeNavMenu} className={navLinkClass}>Results</NavLink>
            <NavLink to="/about" onClick={closeNavMenu} className={navLinkClass}>About</NavLink>
          </div>

          {currentUser && (
            <div className="nav_profile" ref={profileRef}>
              <button
                type="button"
                className="profile_btn"
                onClick={() => {
                  setShowProfile((prev) => !prev);
                  if (window.innerWidth < 880) {
                    setShowNav(false);
                  }
                }}
                aria-expanded={showProfile}
                aria-haspopup="true"
              >
                <span className="profile_avatar" aria-hidden="true">
                  {initials || "U"}
                </span>
                <span className="profile_name">{profileFirstName || "User"}</span>
                <HiChevronDown className={`profile_chevron ${showProfile ? 'open' : ''}`} />
              </button>

              <div className={`profile_menu ${showProfile ? 'show' : ''}`}>
                <div className="profile_meta">
                  <span className="profile_meta-name">{profileName}</span>
                  <span className="profile_meta-email">{profileEmail || " "}</span>
                </div>
                <div className="profile_actions">
                  <Link to="/logout" className="profile_link" onClick={closeNavMenu}>
                    Logout
                  </Link>
                </div>
              </div>
            </div>
          )}

          <button className="theme_toggle-btn" onClick={changeThemeHandler} aria-label="Toggle theme">
            {darkTheme === 'dark' ? <IoMdSunny size={20} color="gold" /> : <IoIosMoon size={20} />}
          </button>

          <button
            className="nav_toggle-btn"
            onClick={() => setShowNav(!showNav)}
            aria-expanded={showNav}
            aria-controls="primary-navigation"
            aria-label="Toggle navigation menu"
          >
            {showNav ? <AiOutlineClose /> : <HiOutlineBars4 />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
