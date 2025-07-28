

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Registration = () => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    password2: ""
  });

  const changeInputHandler = (e) => {
    setUserData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can add validation or backend call here
    console.log("Form submitted", userData);
  };

  return (
    <section className='register'>
      <div className='container register_container'>
        <h2>Sign up</h2>
        <form onSubmit={handleSubmit}>
          <p className='form_error-message'>Any error from the backend</p>

          <input
            type='text'
            placeholder='First Name'
            name='firstName'
            value={userData.firstName}
            onChange={changeInputHandler}
            autoComplete='given-name'
            autoFocus
          />

          <input
            type='text'
            name='lastName'
            placeholder='Last Name'
            value={userData.lastName}
            onChange={changeInputHandler}
            autoComplete='family-name'
          />

          <input
            type='email'
            name='email'
            placeholder='Email'
            value={userData.email}
            onChange={changeInputHandler}
            autoComplete='email'
          />

          <input
            type='password'
            name='password'
            placeholder='Enter Password'
            value={userData.password}
            onChange={changeInputHandler}
            autoComplete='new-password'
          />

          <input
            type='password'
            name='password2'
            placeholder='Confirm Password'
            value={userData.password2}
            onChange={changeInputHandler}
            autoComplete='new-password'
          />

          <p>Already have an account? <Link to='/login'>Sign in</Link></p>

          <button type='submit' className='btn primary'>Register</button>
        </form>
      </div>
    </section>
  );
};

export default Registration;

