import React from 'react';
import classes from './Footer.module.css';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={classes.footer_container}>
        <div className={classes.footer_section}>
          <h4>About IVote</h4>
          <p>
            IVote is a secure and reliable online voting platform designed to streamline the election process.
            We ensure transparency, accuracy, and accessibility for all participants.
          </p>
        </div>
        <div className={classes.footer_section}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/elections">Elections</a></li>
            <li><a href="/results">Results</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div className={classes.footer_section}>
          <h4>Follow Us</h4>
          <div className={classes.social_links}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
          </div>
        </div>
        <div className={classes.footer_section}>
          <h4>Contact Us</h4>
          <p>Email: info@ivote.com</p>
          <p>Phone: +123 456 7890</p>
          <p>Address: 123 Voting Lane, Election City, EC 12345</p>
        </div>
      </div>
      <div className={classes.footer_bottom}>
        <p>&copy; {new Date().getFullYear()} IVote. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
