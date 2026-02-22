import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IoIosMoon, IoIosArrowDown } from "react-icons/io";
import { HiOutlineBars4 } from "react-icons/hi2";
import { AiOutlineClose } from "react-icons/ai";
import { IoMdSunny } from "react-icons/io";

const Navbar = () => {
  const [showNav, setShowNav] = useState(window.innerWidth < 600 ? false : true);
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('IvoTe theme') || '');
  const [profileOpen, setProfileOpen] = useState(false);
  const user = useSelector((state) => state.auth?.user);

  const closeNavManu = () => {
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

  const navLinkClass = ({ isActive }) => `nav_link${isActive ? ' active' : ''}`;

  const initials = useMemo(() => {
    if (!user) return '';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    const fallback = user.email?.[0] || '';
    return `${first}${last}`.trim() || fallback.toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return '';
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.email?.split('@')[0] || 'Account';
  }, [user]);

  return (
    <nav>
      <div className="container nav_container">
        <Link to="/elections" className='nav_logo' onClick={closeNavManu}>IvoTe</Link>
        <div className="nav_right">
          <div className={`nav_menu ${showNav ? 'show' : ''}`}>
            <NavLink to="/" className={navLinkClass} onClick={closeNavManu}>News</NavLink>
            <NavLink to="/elections" className={navLinkClass} onClick={closeNavManu}>Elections</NavLink>
            <NavLink to="/results" className={navLinkClass} onClick={closeNavManu}>Results</NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={closeNavManu}>About</NavLink>
            {!user && (
              <>
                <NavLink to="/login" className={navLinkClass} onClick={closeNavManu}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClass} onClick={closeNavManu}>
                  Sign up
                </NavLink>
              </>
            )}
          </div>

          {user && (
            <div className="nav_profile">
              <button
                type="button"
                className="profile_btn"
                onClick={() => setProfileOpen((prev) => !prev)}
              >
                <span className="profile_avatar">{initials || 'IV'}</span>
                <span className="profile_name">{displayName}</span>
                <span className={`profile_chevron${profileOpen ? ' open' : ''}`}>
                  <IoIosArrowDown />
                </span>
              </button>
              <div className={`profile_menu${profileOpen ? ' show' : ''}`}>
                <div className="profile_meta">
                  <span className="profile_meta-name">{displayName}</span>
                  <span className="profile_meta-email">{user?.email}</span>
                </div>
                <div className="profile_actions">
                  <Link className="profile_link" to="/logout" onClick={closeNavManu}>
                    Logout
                  </Link>
                </div>
              </div>
            </div>
          )}

          <button className="theme_toggle-btn" onClick={changeThemeHandler}>
            {darkTheme === 'dark' ? <IoMdSunny size={20} color="gold" /> : <IoIosMoon size={20} />}
          </button>

          <button className="nav_toggle-btn" onClick={() => setShowNav(!showNav)}>
            {showNav ? <AiOutlineClose /> : <HiOutlineBars4 />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
