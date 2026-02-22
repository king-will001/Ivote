import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, requestOtp, verifyOtp } from '../utils/apiSimulator';

const OTP_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

const formatOtpTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const Registration = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password2: '',
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpRequired, setOtpRequired] = useState(false);
  const [success, setSuccess] = useState(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [otpTimerKey, setOtpTimerKey] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!otpRequired) {
      setOtpSecondsLeft(0);
      setResendSecondsLeft(0);
      setResendMessage(null);
      return undefined;
    }

    const otpExpiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
    const resendAvailableAt = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;

    const tick = () => {
      const now = Date.now();
      const otpRemaining = Math.max(0, Math.ceil((otpExpiresAt - now) / 1000));
      const resendRemaining = Math.max(
        0,
        Math.ceil((resendAvailableAt - now) / 1000)
      );
      setOtpSecondsLeft(otpRemaining);
      setResendSecondsLeft(resendRemaining);
    };

    tick();
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, [otpRequired, otpTimerKey]);

  const changeInputHandler = (e) => {
    setUserData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userData.email.trim()) {
      setError('Email is required.');
      return;
    }

    if (otpRequired) {
      if (!userData.otp.trim()) {
        setError('OTP is required.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await verifyOtp({
          email: userData.email.trim(),
          otp: userData.otp,
          purpose: 'register',
        });

        if (response.success) {
          setSuccess('Account verified. You can now sign in.');
          navigate('/login');
        } else {
          setError(response.message || 'OTP verification failed.');
        }
      } catch (err) {
        setError('OTP verification failed.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!userData.firstName.trim() || !userData.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    if (!userData.password || !userData.password2) {
      setError('Password and confirmation are required.');
      return;
    }

    if (userData.password !== userData.password2) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerUser({
        ...userData,
        email: userData.email.trim(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
      });
      if (!response.success) {
        setError(response.message || 'Registration failed.');
        setIsLoading(false);
        return;
      }

      if (response.data?.requiresOtp) {
        setOtpRequired(true);
        setOtpTimerKey((prev) => prev + 1);
        setSuccess('OTP sent. Check your email to verify.');
      } else if (response.data?.verified) {
        setSuccess('Registration complete. You can now sign in.');
        navigate('/login');
      } else {
        setSuccess('Registration complete. You can now sign in.');
        navigate('/login');
      }
    } catch (err) {
      setError('Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending || resendSecondsLeft > 0) return;
    setError(null);
    setSuccess(null);
    setResendMessage(null);

    const email = userData.email.trim();
    if (!email) {
      setError('Email is required.');
      return;
    }

    setIsResending(true);
    try {
      const response = await requestOtp({ email, purpose: 'register' });
      if (response.success) {
        setResendMessage(response.data?.message || 'A new OTP has been sent.');
        setOtpTimerKey((prev) => prev + 1);
      } else {
        setError(response.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className='register'>
      <div className='auth_shell'>
        <div className='auth_brand'>
          <span className='auth_badge'>IVOTE</span>
          <h1>Secure voting, built for trust.</h1>
          <p>
            Launch verified elections, protect voter identities, and publish results fast.
          </p>
          <div className='auth_points'>
            <span>Verified voter onboarding</span>
            <span>One person, one vote enforcement</span>
            <span>Real-time turnout insights</span>
          </div>
        </div>

        <div className='auth_card'>
          <div className='register_container'>
            <div className='auth_header'>
              <span className='auth_kicker'>{otpRequired ? 'One-time code' : 'Join IVote'}</span>
              <h2>{otpRequired ? 'Verify OTP' : 'Sign up'}</h2>
              <p className='auth_subtitle'>
                {otpRequired
                  ? 'Enter the verification code to finish creating your account.'
                  : 'Create your account to start running trusted elections.'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <p className='form_error-message'>{error}</p>}
              {success && <p className='form_success-message'>{success}</p>}

              {!otpRequired && (
                <>
                  <input
                    type='text'
                    placeholder='First Name'
                    name='firstName'
                    value={userData.firstName}
                    onChange={changeInputHandler}
                    autoComplete='given-name'
                    autoFocus
                    disabled={isLoading}
                  />

                  <input
                    type='text'
                    name='lastName'
                    placeholder='Last Name'
                    value={userData.lastName}
                    onChange={changeInputHandler}
                    autoComplete='family-name'
                    disabled={isLoading}
                  />

                  <input
                    type='email'
                    name='email'
                    placeholder='Email'
                    value={userData.email}
                    onChange={changeInputHandler}
                    autoComplete='email'
                    disabled={isLoading}
                  />

                  <input
                    type='password'
                    name='password'
                    placeholder='Enter Password'
                    value={userData.password}
                    onChange={changeInputHandler}
                    autoComplete='new-password'
                    disabled={isLoading}
                  />

                  <input
                    type='password'
                    name='password2'
                    placeholder='Confirm Password'
                    value={userData.password2}
                    onChange={changeInputHandler}
                    autoComplete='new-password'
                    disabled={isLoading}
                  />

                  <p>
                    Already have an account? <Link to='/login'>Sign in</Link>
                  </p>
                </>
              )}

              {otpRequired && (
                <>
                  <input
                    type='text'
                    name='otp'
                    placeholder='Enter OTP'
                    value={userData.otp}
                    onChange={changeInputHandler}
                    autoComplete='one-time-code'
                    disabled={isLoading}
                  />
                  <p className={`otp_timer${otpSecondsLeft === 0 ? ' expired' : ''}`}>
                    {otpSecondsLeft === 0
                      ? 'Code expired. Use resend to get a new one.'
                      : `Code expires in ${formatOtpTime(otpSecondsLeft)}`}
                  </p>
                  <div className='otp_actions'>
                    <button
                      type='button'
                      className='btn sm'
                      onClick={handleResendOtp}
                      disabled={isResending || resendSecondsLeft > 0}
                    >
                      {isResending
                        ? 'Sending...'
                        : resendSecondsLeft > 0
                          ? `Resend in ${formatOtpTime(resendSecondsLeft)}`
                          : 'Resend code'}
                    </button>
                    {resendMessage && (
                      <span className='otp_action-note'>{resendMessage}</span>
                    )}
                  </div>
                </>
              )}

              <button type='submit' className='btn primary' disabled={isLoading}>
                {isLoading ? 'Please wait...' : otpRequired ? 'Verify OTP' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Registration;
