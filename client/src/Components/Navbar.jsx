import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { IoIosMoon } from "react-icons/io";
import { HiOutlineBars4 } from "react-icons/hi2";
import { AiOutlineClose } from "react-icons/ai";
import { IoMdSunny } from "react-icons/io";

const Navbar = () => {
  const [showNav, setShowNav] = useState(window.innerWidth < 600 ? false : true);
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('IvoTe theme') || '');

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

  return (
    <nav>
      <div className="container nav_container">
        <Link to="/" className='nav_logo'>IvoTe</Link>
        <div className="nav_right">
          <div className={`nav_menu ${showNav ? 'show' : ''}`}>
            <NavLink to="/elections" onClick={closeNavManu}>Elections</NavLink>
            <NavLink to="/results" onClick={closeNavManu}>Results</NavLink>
            <NavLink to="/about" onClick={closeNavManu}>About</NavLink>
            <NavLink to="/logout" onClick={closeNavManu}>Logout</NavLink>
          </div>

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
