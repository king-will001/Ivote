import React, { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const AddElectionModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [thumbnail, setThumbnail] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass form data to parent
    if (onSubmit) {
      onSubmit({ title, description, date, time, thumbnail });
    }
  };

  return (
    <section className='modal add-election-modal'>
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
              placeholder='Enter election title'
              required
              name='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <h6>Election Description:</h6>
            <textarea
              placeholder='Enter election description'
              required
              name='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div>
            <h6>Election Date:</h6>
            <input
              type='date'
              required
              name='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <h6>Election Time:</h6>
            <input
              type='time'
              required
              name='time'
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <h6>Election Thumbnail:</h6>
            <input
              type='file'
              accept="image/png, image/jpg, image/jpeg, image/webp, image/avif"
              required
              name='thumbnail'
              onChange={(e) => setThumbnail(e.target.files[0])}
            />
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button type='button' className='btn' onClick={onClose}>
              Cancel
            </button>
            <button type='submit' className='btn primary' style={{ marginLeft: '1rem' }}>
              Create Election
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddElectionModal;