import React from 'react';
import { Link } from 'react-router-dom';
import congrat1 from '../assets/congrat1.gif'; // Adjust the path if needed

function Congrates() {
  return (
    <section className='congrats'>
      <div className='container congrats_container'>
        <div className='congrats_copy'>
          <span className='congrats_kicker'>Vote submitted</span>
          <h2>Thank you for voting</h2>
          <p>
            Your ballot has been recorded successfully. You can now view the live
            results or return to explore other elections.
          </p>
          <div className='congrats_actions'>
            <Link to='/results' className='btn primary'>View Results</Link>
            <Link to='/elections' className='btn'>Back to Elections</Link>
          </div>
        </div>

        <div className='congrats_media'>
          <div className='congrats_media-frame'>
            <img src={congrat1} alt="Vote submitted" />
          </div>
          <p className='congrats_media-caption'>Ballot confirmation complete.</p>
        </div>
      </div>
    </section>
  );
}

export default Congrates;
