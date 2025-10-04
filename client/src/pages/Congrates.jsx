import React from 'react';
import { Link } from 'react-router-dom';
import congrat1 from '../assets/congrat1.gif'; // Adjust the path if needed

function Congrates() {
  return (
    <section className='congrats'>
      <div className='container congrats_container'>
        <img src={congrat1} alt="Congratulation" />
        <h2>Thanks for your vote!</h2>
        <p>Your vote is now added to your candidate's vote count. You can now vote for another candidate in a different post.</p>
        <Link to='/results' className='btn sm primary'>See Results</Link>
      </div>
    </section>
  );
}

export default Congrates;
