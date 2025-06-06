import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStarOfLife } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [mobileNum, setMobileNum] = useState("");
  const [password, setPassword] = useState("");
  const [mail, setMail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [radio, setRadio] = useState("");

  const isFormValid =
    name.trim() !== "" &&
    mobileNum.trim() !== "" &&
    password.trim() !== "" &&
    mail.trim() !== "" &&
    radio.trim() !== "";

  const handleSignUp = async () => {
    if (!isFormValid) return;

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          number: mobileNum.trim(),
          email: mail.trim(),
          company: companyName.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful! Redirecting to login.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to register. Please try again later.");
    }
  };

  return (
    <div className="sign-up-container">
      <ToastContainer position="top-center" />
      <div className="form-main-container">
        <h1>Create your PopX account</h1>
        <div className="form-container">
          <div className="input-group">
            <label className="input-label">
              Full Name <FaStarOfLife className="star" />
            </label>
            <input
              type="text"
              placeholder="Enter full name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">
              Phone Number <FaStarOfLife className="star" />
            </label>
            <input
              type="text"
              placeholder="Enter phone number"
              className="input-field"
              value={mobileNum}
              onChange={(e) => setMobileNum(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">
              Email <FaStarOfLife className="star" />
            </label>
            <input
              type="email"
              placeholder="Enter email address"
              className="input-field"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">
              Password <FaStarOfLife className="star" />
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Company name</label>
            <input
              type="text"
              placeholder="Enter company name"
              className="input-field"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="radio-main-container">
            <p>
              Are you an agency? <FaStarOfLife className="star" />
            </p>
            <div className="radio-group">
              <label className="radio-container">
                Yes
                <input
                  type="radio"
                  name="choice"
                  value="yes"
                  onChange={() => setRadio("yes")}
                />
                <span className="checkmark"></span>
              </label>
              <label className="radio-container">
                No
                <input
                  type="radio"
                  name="choice"
                  value="no"
                  onChange={() => setRadio("no")}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <button
        className={`sign-up-btn ${isFormValid ? "active" : "inactive"}`}
        onClick={handleSignUp}
      >
        Create Account
      </button>
    </div>
  );
};

export default SignUp;