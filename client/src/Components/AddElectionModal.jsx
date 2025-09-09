import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const AddElectionModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endDateTime, setEndDateTime] = useState(""); // 👈 new state
  const [thumbnail, setThumbnail] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ title, description, date, time, endDateTime, thumbnail });
    }
    // Reset
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setEndDateTime("");
    setThumbnail(null);
    onClose();
  };

  return (
    <section className='modal add-election-modal' role="dialog" aria-modal="true">
      <div className='modal_content'>
        <header className='modal_header'>
          <h4>Create New Election</h4>
          <button className='modal_close' onClick={onClose} aria-label="Close modal">
            <AiOutlineClose />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div>
            <h6>Election Title:</h6>
            <input
              type='text'
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <h6>Description:</h6>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <h6>Start Date:</h6>
            <input
              type='date'
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <h6>Start Time:</h6>
            <input
              type='time'
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div>
            <h6>End Date & Time:</h6>
            <input
              type='datetime-local'
              required
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>

          <div>
            <h6>Thumbnail:</h6>
            <input
              type='file'
              accept="image/*"
              required
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
          </div>

          <div className="modal_footer">
            <button type='button' className='btn' onClick={onClose}>Cancel</button>
            <button type='submit' className='btn primary'>Create Election</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddElectionModal;
