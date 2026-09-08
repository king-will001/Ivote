import React from 'react';
import { Link } from 'react-router-dom';
import classes from './Footer.module.css';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

function Footer() {
  return (
    <footer className={classes.footer} role='contentinfo'>
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
            <li><Link to='/elections'>Elections</Link></li>
            <li><Link to='/results'>Results</Link></li>
            <li><Link to='/about'>About Us</Link></li>
          </ul>
        </div>
        <div className={classes.footer_section}>
          <h4>Legal</h4>
          <ul>
            <li><Link to='/privacy'>Privacy Policy</Link></li>
            <li><Link to='/terms'>Terms &amp; Conditions</Link></li>
            <li><a href='mailto:contact@ivote.com'>Contact Us</a></li>
          </ul>
          <h4 style={{ marginTop: '0.9rem' }}>Follow Us</h4>
          <div className={classes.social_links}>
            <a href='https://facebook.com' target='_blank' rel='noopener noreferrer' aria-label='Facebook'><FaFacebookF /></a>
            <a href='https://twitter.com' target='_blank' rel='noopener noreferrer' aria-label='Twitter'><FaTwitter /></a>
            <a href='https://instagram.com' target='_blank' rel='noopener noreferrer' aria-label='Instagram'><FaInstagram /></a>
            <a href='https://linkedin.com' target='_blank' rel='noopener noreferrer' aria-label='LinkedIn'><FaLinkedinIn /></a>
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
        <p className={classes.footer_image_notice}>
          Candidate images are placeholders used for demonstration purposes only.
          All rights belong to their respective owners.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
