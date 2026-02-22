import React from 'react';
import { Link } from 'react-router-dom';
import congrat1 from '../assets/congrat1.gif';

const feedbackEmail =
  process.env.REACT_APP_FEEDBACK_EMAIL || 'nbanmbosehprincewill@gmail.com';
const feedbackSubject = encodeURIComponent('IVote feedback');
const feedbackBody = encodeURIComponent(
  'Hi IVote team,\n\nI just completed a vote and wanted to share my thoughts:\n\n- What I liked:\n- What could be better:\n\nThanks!'
);
const feedbackLink = `mailto:${feedbackEmail}?subject=${feedbackSubject}&body=${feedbackBody}`;

function Congrates() {
  return (
    <section className='congrats'>
      <div className='container congrats_container'>
        <div className='congrats_copy'>
          <span className='congrats_kicker'>Vote confirmed</span>
          <h2>Thanks for participating.</h2>
          <p>
            Your ballot is safely recorded and will be counted once the election closes.
            You can review live standings or explore other elections available to you.
          </p>
          <div className='congrats_actions'>
            <Link to='/results' className='btn primary'>
              View results
            </Link>
            <Link to='/elections' className='btn'>
              Browse elections
            </Link>
            <a className='btn' href={feedbackLink}>
              Send feedback
            </a>
          </div>
        </div>

        <div className='congrats_media'>
          <div className='congrats_media-frame'>
            <img src={congrat1} alt='Vote confirmed' />
          </div>
          <p className='congrats_media-caption'>
            Thank you for helping keep elections transparent and secure.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Congrates;
