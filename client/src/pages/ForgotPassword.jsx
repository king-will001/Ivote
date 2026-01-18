import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('request');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const requestOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/voters/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          purpose: "reset",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to send OTP.");
        return;
      }

      setInfo(data.message || "OTP sent. Please check your email.");
      setStage('reset');
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }
    if (!password.trim() || !passwordConfirm.trim()) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/voters/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          password,
          passwordConfirm,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to reset password.");
        return;
      }
      setInfo("Password reset successful. You can now sign in.");
      setOtp('');
      setPassword('');
      setPasswordConfirm('');
      setStage('request');
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (stage === 'request') {
      await requestOtp();
      return;
    }

    await resetPassword();
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    await requestOtp();
  };

  return (
    <section className='register auth'>
      <div className='auth_shell'>
        <div className='auth_brand'>
          <span className='auth_badge'>IvoTe</span>
          <h1>Reset access in minutes.</h1>
          <p>
            Request an OTP to reset your password and continue participating in elections.
          </p>
          <div className='auth_points'>
            <span>Secure OTP verification</span>
            <span>Fast account recovery</span>
            <span>Protected voter identity</span>
          </div>
        </div>

        <div className='register_container auth_card'>
          <div className='auth_header'>
            <p className='auth_kicker'>Account recovery</p>
            <h2>Forgot password</h2>
            <p className='auth_subtitle'>We will email you an OTP to reset your password.</p>
          </div>
        <form onSubmit={handleSubmit}>
          {error && <p className='form_error-message'>{error}</p>}
          {info && <p className='form_success-message'>{info}</p>}

          <input
            type='email'
            name='email'
            placeholder='Email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete='email'
            required
          />

          {stage === 'reset' && (
            <>
              <input
                type='text'
                name='otp'
                placeholder='Enter OTP'
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                autoComplete='one-time-code'
                required
              />
              <input
                type='password'
                name='password'
                placeholder='New password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete='new-password'
                required
              />
              <input
                type='password'
                name='passwordConfirm'
                placeholder='Confirm new password'
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                autoComplete='new-password'
                required
              />
            </>
          )}

          <p>
            Remembered your password? <Link to='/login'>Sign in</Link>
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading
                ? stage === 'request'
                  ? 'Sending OTP...'
                  : 'Resetting...'
                : stage === 'request'
                  ? 'Send OTP'
                  : 'Reset password'}
            </button>
            {stage === 'reset' && (
              <button type='button' className='btn' onClick={handleResend} disabled={isLoading}>
                Resend OTP
              </button>
            )}
          </div>
        </form>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
