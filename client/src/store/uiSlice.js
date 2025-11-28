import { createSlice } from '@reduxjs/toolkit';

/* const initialState = {addCandidateModalShowing: false, voteCandidateModalShowing: false, electionModalShowing: false, updateElectionModalShowing: false
} */


const initialState = {
   addCandidateModalShowing: false,
   updateElectionModalShowing: false,
   voteCandidateModalShowing: false,
   selectedElection: null,
};


const uiSlice = createSlice({
   name: 'ui',
   initialState,
   reducers: {
      openAddCandidateModal(state) {
         state.addCandidateModalShowing = true
      },
      closeAddCandidateModal(state) {
         state.addCandidateModalShowing = false
      },
      openVoteCandidateModal(state) {
         state.voteCandidateModalShowing = true
      },
      closeVoteCandidateModal(state) {
         state.voteCandidateModalShowing = false
      },
      openElectionModal(state) {
         state.electionModalShowing = true
      },
      closeElectionModal(state) {
         state.electionModalShowing = false
      },
      openUpdateElectionModal(state, action) {
         state.updateElectionModalShowing = true;
         if (action.payload) {
            state.selectedElection = action.payload;
         }
      },
      closeUpdateElectionModal(state) {
         state.updateElectionModalShowing = false;
         state.selectedElection = null;
      },
   }
})

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;