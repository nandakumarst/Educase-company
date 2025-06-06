import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CiCamera } from "react-icons/ci";
import "./index.css";

const Details = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login-screen");
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          localStorage.removeItem("token");
          navigate("/login-screen");
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem("token");
        navigate("/login-screen");
      }
    };

    fetchProfile();
  }, [navigate]);

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="main-profile-container">
      <h1 className="main-heading">Account Settings</h1>
      <div className="main-content-container">
        <div className="main-profile-details-container">
          <div className="profile-container">
            <img
              src="https://res.cloudinary.com/djhabesmv/image/upload/v1735483686/DSC_0112_b0gege.jpg"
              alt="Profile"
              className="profile-pic"
            />
            <div className="camera-icon">
              <CiCamera />
            </div>
          </div>
          <div className="profile-details">
            <h1>{profile.name}</h1>
            <p>{profile.email}</p>
            <p>Phone: {profile.number}</p>
            <p>Company: {profile.company}</p>
          </div>
        </div>
        <div className="profile-description">
          <p>
            Lorem Ipsum Dolor Sit Amet, Consetetur Sadipscing Elitr, Sed Diam Nonumy
            Eirmod Tempor Invidunt Ut Labore Et Dolore Magna Aliquyam Erat, Sed Diam
          </p>
        </div>
      </div>
    </div>
  );
};

export default Details;