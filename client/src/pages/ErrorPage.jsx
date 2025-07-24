
import react, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const Navigate = useNavigate()

    // Redirect to the previous page after a delay
    useEffect(() => {
        setTimeout(() => {
            Navigate(-1)
        }, 4000); // Redirects to the previous page after 4 seconds
    })



  return (
    <section className="errorPage">
        <div className='errorPage_container'>
            <img src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/media/0f2b1c6d3a5e8b9f0c6d1e8f3c2a4b5c.gif" alt="Error Page" />

            <h1>404</h1>
            <p>This page does not exist. You will be redirect to the previous page shortly</p>
        </div>
    </section>
  )
}

export default ErrorPage 