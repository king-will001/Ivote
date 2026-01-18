

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Registration = () => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirm: ""
  });

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const navigate = useNavigate();

  const changeInputHandler = (e) => {
    setUserData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/voters/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      if (data?.requiresOtp) {
        setOtpStage(true);
        setOtpEmail(data.email || userData.email);
        setInfo(data.message || "OTP sent to your email.");
        return;
      }

      setInfo("Registration completed. Please sign in.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/voters/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpEmail || userData.email,
          otp,
          purpose: "register",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "OTP verification failed");
        return;
      }

      setInfo("Account verified. Please sign in.");
      setUserData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        passwordConfirm: ""
      });
      setOtp("");
      setOtpStage(false);
      setOtpEmail("");
      navigate("/login");
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError("");
    setInfo("");
    try {
      const response = await fetch("http://localhost:5000/api/voters/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpEmail || userData.email,
          purpose: "register",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to resend OTP");
        return;
      }
      setInfo(data.message || "OTP sent.");
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (otpStage) {
      await handleVerifyOtp();
      return;
    }
    await handleRegister();
  };

  return (
    <section className='register auth'>
      <div className='auth_shell'>
        <div className='auth_brand'>
          <span className='auth_badge'>IvoTe</span>
          <h1>Join the next generation of voting.</h1>
          <p>
            Create your account to access secure elections, candidate profiles, and live results.
          </p>
          <div className='auth_points'>
            <span>Verified by email OTP</span>
            <span>One account across elections</span>
            <span>Safe, transparent participation</span>
          </div>
        </div>

        <div className='register_container auth_card'>
          <div className='auth_header'>
            <p className='auth_kicker'>Create account</p>
            <h2>Sign up</h2>
            <p className='auth_subtitle'>Complete your details and verify with an OTP.</p>
          </div>
        <form onSubmit={handleSubmit}>
          {error && <p className='form_error-message'>{error}</p>}
          {info && <p className='form_success-message'>{info}</p>}

          {!otpStage && (
            <>
              <input
                type='text'
                placeholder='First Name'
                name='firstName'
                value={userData.firstName}
                onChange={changeInputHandler}
                autoComplete='given-name'
                autoFocus
                required
              />

              <input
                type='text'
                name='lastName'
                placeholder='Last Name'
                value={userData.lastName}
                onChange={changeInputHandler}
                autoComplete='family-name'
                required
              />

              <input
                type='email'
                name='email'
                placeholder='Email'
                value={userData.email}
                onChange={changeInputHandler}
                autoComplete='email'
                required
              />

              <input
                type='password'
                name='password'
                placeholder='Enter Password'
                value={userData.password}
                onChange={changeInputHandler}
                autoComplete='new-password'
                required
              />

              <input
                type='password'
                name='passwordConfirm'
                placeholder='Confirm Password'
                value={userData.passwordConfirm}
                onChange={changeInputHandler}
                autoComplete='new-password'
                required
              />

              <p>Already have an account? <Link to='/login'>Sign in</Link></p>

              <button type='submit' className='btn primary' disabled={isLoading}>
                {isLoading ? "Registering..." : "Register"}
              </button>
            </>
          )}

          {otpStage && (
            <>
              <p>Enter the code sent to <strong>{otpEmail || userData.email}</strong>.</p>
              <input
                type='text'
                name='otp'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete='one-time-code'
                required
              />

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type='submit' className='btn primary' disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button type='button' className='btn' onClick={handleResendOtp} disabled={isLoading}>
                  Resend OTP
                </button>
              </div>
            </>
          )}
        </form>
        </div>
      </div>
    </section>
  );
};

export default Registration;

