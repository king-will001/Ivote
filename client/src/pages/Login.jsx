import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser, requestOtp, verifyOtp } from '../utils/apiSimulator';
import { saveAuth } from '../utils/authStorage';
import { authActions } from '../store/authSlice';

const OTP_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

const formatOtpTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const Login = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [otpTimerKey, setOtpTimerKey] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

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
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resolveUser = (data, fallbackEmail) => {
    if (data?.voter) {
      return data.voter;
    }
    return {
      id: data?.id,
      firstName: data?.firstName,
      lastName: data?.lastName,
      email: data?.email || fallbackEmail,
      isAdmin: data?.isAdmin,
      votedElections: data?.votedElections || [],
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!loginData.email.trim()) {
      setError('Email is required.');
      return;
    }

    setIsLoading(true);

    try {
      if (otpRequired) {
        if (!loginData.otp.trim()) {
          setError('OTP is required.');
          setIsLoading(false);
          return;
        }

        const response = await verifyOtp({
          email: (otpEmail || loginData.email).trim(),
          otp: loginData.otp,
          purpose: 'login',
        });

        if (response.success && response.data) {
          const user = resolveUser(response.data, loginData.email);
          if (!user?.id) {
            setError(response.message || 'Login failed.');
            setIsLoading(false);
            return;
          }
          const authPayload = { token: response.data?.token || null, user };
          saveAuth(authPayload);
          dispatch(authActions.setAuth(authPayload));
          navigate(redirectTo, { replace: true });
        } else {
          setError(response.message || 'OTP verification failed.');
        }
        setIsLoading(false);
        return;
      }

      if (!loginData.password.trim()) {
        setError('Password is required.');
        setIsLoading(false);
        return;
      }

      const response = await loginUser(loginData.email.trim(), loginData.password);
      if (!response.success) {
        setError(response.message || 'Login failed.');
        setIsLoading(false);
        return;
      }

      if (response.data?.requiresOtp) {
        setOtpRequired(true);
        setOtpEmail(response.data?.email || loginData.email);
        setOtpTimerKey((prev) => prev + 1);
        setIsLoading(false);
        return;
      }

      if (response.data) {
        const user = resolveUser(response.data, loginData.email);
        if (!user?.id) {
          setError(response.data?.message || 'Login failed.');
          return;
        }
        const authPayload = { token: response.data?.token || null, user };
        saveAuth(authPayload);
        dispatch(authActions.setAuth(authPayload));
        navigate(redirectTo, { replace: true });
      } else {
        setError(response.data?.message || 'Login failed.');
      }
    } catch (err) {
      setError('Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending || resendSecondsLeft > 0) return;
    setError(null);
    setResendMessage(null);
    const email = (otpEmail || loginData.email).trim();
    if (!email) {
      setError('Email is required.');
      return;
    }

    setIsResending(true);
    try {
      const response = await requestOtp({ email, purpose: 'login' });
      if (response.success) {
        setOtpEmail(response.data?.email || email);
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
            Manage elections, verify identities, and vote with confidence from any device.
          </p>
          <div className='auth_points'>
            <span>Two-factor authentication verified</span>
            <span>Transparent results tracking</span>
            <span>Real-time election updates</span>
          </div>
        </div>

        <div className='auth_card'>
          <div className='register_container'>
            <div className='auth_header'>
              <span className='auth_kicker'>{otpRequired ? 'One-time code' : 'Welcome back'}</span>
              <h2>{otpRequired ? 'Verify OTP' : 'Sign in'}</h2>
              <p className='auth_subtitle'>
                {otpRequired
                  ? 'Enter the code sent to your email to continue.'
                  : 'Use your email and password to receive a one-time code.'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <p className='form_error-message'>{error}</p>}

              <input
                type='email'
                name='email'
                placeholder='Email'
                value={loginData.email}
                onChange={changeInputHandler}
                autoComplete='email'
                disabled={isLoading || otpRequired}
              />

              {!otpRequired && (
                <input
                  type='password'
                  name='password'
                  placeholder='Enter Password'
                  value={loginData.password}
                  onChange={changeInputHandler}
                  autoComplete='current-password'
                  disabled={isLoading}
                />
              )}

              {otpRequired && (
                <>
                  <input
                    type='text'
                    name='otp'
                    placeholder='Enter OTP'
                    value={loginData.otp}
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

              {!otpRequired && (
                <>
                  <p className='auth_helper'>
                    <Link to='/forgot-password'>Forgot password?</Link>
                  </p>
                  <p>
                    Don't have an account yet?{' '}
                    <Link to='/register'>Sign up</Link>
                  </p>
                </>
              )}

              <button type='submit' className='btn primary' disabled={isLoading}>
                {isLoading ? 'Please wait...' : otpRequired ? 'Verify OTP' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
