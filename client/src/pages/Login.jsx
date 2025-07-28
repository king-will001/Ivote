
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const changeInputHandler = (e) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Form submitted", loginData);
  };

  return (
    <section className='register'>
      <div className='container register_container'>
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit}>
          <p className='form_error-message'>Any error from the backend</p>

          <input
            type='email'
            name='email'
            placeholder='Email'
            value={loginData.email}
            onChange={changeInputHandler}
            autoComplete='email'
          />

          <input
            type='password'
            name='password'
            placeholder='Enter Password'
            value={loginData.password}
            onChange={changeInputHandler}
            autoComplete='current-password'
          />

          <p>
            Don't have an account yet?{" "}
            <Link to='/register'>Sign up</Link>
          </p>

          <button type='submit' className='btn primary'>Login</button>
        </form>
      </div>
    </section>
  );
};

export default Login;
