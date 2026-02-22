import { createSlice } from '@reduxjs/toolkit';


const currentVoter = { id: 'v1', isAdmin: true };
const initialState = {
  selectedVoteCandidate: '',
  currentVoter,
  selectedElection: '',
  idOfElectionToUpdate: '',
  addCandidateElectionId: ''
};

const voteSlice = createSlice({
  name: 'vote',
  initialState,
  reducers: {
    changeSelectedVoteCandidate(state, action) {
      state.selectedVoteCandidate = action.payload;
    },
    changeSelectedElection(state, action) {
      state.selectedElection = action.payload;
    },
    // set the id of the election to update
    changeIdOfCandidateElectionId(state, action) {
      state.idOfElectionToUpdate = action.payload;
    },
    changeAddCandidateElectionId(state, action) {
      state.addCandidateElectionId = action.payload;
    }
  }
});

export const voteActions = voteSlice.actions;

export default voteSlice.reducer;
