import React, { useState } from 'react';
import { elections as dummyElections } from '../Data';
import ResultElection from '../Components/ResultElection';

const Results = () => {
  const [elections, setElections] = useState(dummyElections);

  return (
    <section className='results'>
      <div className='container results_container'>
        {elections.map((election) => (
          <ResultElection key={election.id} {...election} />
        ))}
      </div>
    </section>
  );
};

export default Results;
