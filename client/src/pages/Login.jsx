
import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/userContext';

const Login = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [otp, setOtp] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState("login");
  const [otpEmail, setOtpEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0); // OTP expiration countdown in seconds
  const [otpAttempts, setOtpAttempts] = useState(0); // Track failed attempts
  const [otpMaxAttempts] = useState(5); // Max 5 attempts before OTP expires
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useContext(UserContext);
  const from = location.state?.from?.pathname || '/';

  // Countdown timer effect
  useEffect(() => {
    let interval;
    if (otpStage && otpTimeLeft > 0) {
      interval = setInterval(() => {
        setOtpTimeLeft(prev => {
          if (prev <= 1) {
            setError("OTP has expired. Please request a new code.");
            setOtpStage(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStage, otpTimeLeft]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const changeInputHandler = (e) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/voters/login`, loginData);
      const data = response.data;

      if (data?.requiresOtp) {
        setOtpStage(true);
        setOtpPurpose(data.otpPurpose || "login");
        setOtpEmail(data.email || loginData.email);
        setInfo(data.message || "OTP sent to your email.");
        setOtp("");
        setOtpTimeLeft(600); // 10 minutes = 600 seconds
        setOtpAttempts(0); // Reset attempts when new OTP is sent
        return;
      }

      if (data?.token) {
        setCurrentUser(data);
        navigate(from, { replace: true });
        return;
      }

      setError("Unexpected login response. Please try again.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (otpTimeLeft <= 0) {
      setError("OTP has expired. Please request a new code.");
      setOtpStage(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/voters/verify-otp`, {
        email: otpEmail || loginData.email,
        otp,
        purpose: otpPurpose
      });

      const data = response.data;

      if (data?.token) {
        setCurrentUser(data);
        navigate(from, { replace: true });
        return;
      }

      if (data?.verified) {
        setInfo("Account verified. Please sign in.");
        setOtpStage(false);
        setOtp("");
        setOtpPurpose("login");
        setOtpEmail("");
        setOtpTimeLeft(0);
        setOtpAttempts(0);
        return;
      }

      setError("OTP verified, but login could not be completed.");
    } catch (err) {
      // Increment failed attempts
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      
      // Check if max attempts reached
      if (newAttempts >= otpMaxAttempts) {
        setError("Maximum verification attempts exceeded. Please request a new OTP.");
        setOtpStage(false);
        setOtp("");
        setOtpTimeLeft(0);
        setOtpAttempts(0);
        return;
      }

      const attemptsRemaining = otpMaxAttempts - newAttempts;
      const errorMessage = err.response?.data?.message || "OTP verification failed.";
      setError(`${errorMessage} (${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining)`);
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
    await handleLogin();
  };

  const handleResendOtp = async () => {
    setError("");
    setInfo("");
    if (!loginData.email.trim() || !loginData.password.trim()) {
      setError("Enter your email and password to resend the OTP.");
      return;
    }
    await handleLogin();
  };

  return (
    <section className='register auth'>
      <div className='auth_shell'>
        <div className='auth_brand'>
          <span className='auth_badge'>IvoTe</span>
          <h1>Secure voting, built for trust.</h1>
          <p>
            Manage elections, verify identities, and vote with confidence from any device.
          </p>
          <div className='auth_points'>
            <span>Two-factor authentication verified</span>
            <span>Transparent results tracking</span>
            <span>Real-time election updates</span>
          </div>
        </div>

        <div className='register_container auth_card'>
          <div className='auth_header'>
            <p className='auth_kicker'>Welcome back</p>
            <h2>Sign in</h2>
            <p className='auth_subtitle'>Use your email and password to receive a one-time code.</p>
          </div>
        <form onSubmit={handleSubmit}>
          {error && <p className='form_error-message'>{error}</p>}
          {info && <p className='form_success-message'>{info}</p>}

          {!otpStage && (
            <>
              <input
                type='email'
                name='email'
                placeholder='Email'
                value={loginData.email}
                onChange={changeInputHandler}
                autoComplete='email'
                required
              />

              <input
                type='password'
                name='password'
                placeholder='Enter Password'
                value={loginData.password}
                onChange={changeInputHandler}
                autoComplete='current-password'
                required
              />

              <p>
                <Link to='/forgot-password'>Forgot password?</Link>
              </p>

              <p>
                Don't have an account yet?{" "}
                <Link to='/register'>Sign up</Link>
              </p>

              <button type='submit' className='btn primary' disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : 'Login'}
              </button>
            </>
          )}

          {otpStage && (
            <>
              <p>Enter the code sent to <strong>{otpEmail || loginData.email}</strong>.</p>
              <input
                type='text'
                name='otp'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete='one-time-code'
                required
              />

              {/* OTP Countdown Timer */}
              <div style={{ 
                padding: '0.75rem',
                marginBottom: '1rem',
                backgroundColor: otpTimeLeft <= 60 ? '#fff3cd' : '#e7f3ff',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <span style={{ color: otpTimeLeft <= 60 ? '#856404' : '#0056b3' }}>
                  ⏱️ Code expires in: {formatTime(otpTimeLeft)}
                </span>
                {otpTimeLeft <= 60 && (
                  <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                    Request a new code if it expires
                  </span>
                )}
              </div>

              {/* OTP Attempts Tracker */}
              {otpAttempts > 0 && (
                <div style={{ 
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  backgroundColor: '#f8d7da',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  color: '#721c24'
                }}>
                  ⚠️ Verification attempts: {otpAttempts} / {otpMaxAttempts}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type='submit' className='btn primary' disabled={isLoading || otpTimeLeft <= 0}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button type='button' className='btn' onClick={handleResendOtp} disabled={isLoading}>
                  Resend OTP
                </button>
              </div>

              <p>
                <button
                  type='button'
                  className='btn'
                  onClick={() => {
                    setOtpStage(false);
                    setOtp("");
                    setOtpPurpose("login");
                    setOtpEmail("");
                    setInfo("");
                    setOtpTimeLeft(0);
                    setOtpAttempts(0);
                  }}
                  disabled={isLoading}
                >
                  Use different account
                </button>
              </p>
            </>
          )}
        </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
