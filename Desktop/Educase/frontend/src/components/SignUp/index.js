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
  const [submitting, setSubmitting] = useState(false);

  const isFormValid =
    name.trim() &&
    mobileNum.trim() &&
    password.trim() &&
    mail.trim() &&
    radio.trim();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    const payload = {
      name: name.trim(),
      number: mobileNum.trim(),
      email: mail.trim(),
      company: companyName.trim(),
      password: password.trim(),
    };

    const doRegister = async () => {
      const res = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      return data;
    };

    setSubmitting(true);

    toast
      .promise(doRegister(), {
        pending: "Registering your account…",
        success: "Registration successful! Redirecting…",
        error: {
          render({ data }) {
            return data?.message || data || "Registration failed!";
          },
        },
      })
      .then(() => setTimeout(() => navigate("/login"), 1500))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="sign-up-container">
      <ToastContainer position="top-center" />
      <div className="form-main-container">
        <h1>Create your PopX account</h1>
        <form className="form-container" onSubmit={handleSignUp}>
          {/* Full Name */}
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

          {/* Phone Number */}
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

          {/* Email */}
          <div className="input-group">
            <label className="input-label">
              Email <FaStarOfLife className="star" />
            </label>
            <input
              type="email"
              placeholder="Enter email"
              className="input-field"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
            />
          </div>

          {/* Password */}
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

          {/* Company */}
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

          {/* Agency Radio */}
          <div className="radio-main-container">
            <p>
              Are you an agency? <FaStarOfLife className="star" />
            </p>
            <div className="radio-group">
              <label className="radio-container">Yes
                <input type="radio" value="yes" name="choice" onChange={() => setRadio("yes")} />
                <span className="checkmark"></span>
              </label>
              <label className="radio-container">No
                <input type="radio" value="no" name="choice" onChange={() => setRadio("no")} />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`sign-up-btn ${isFormValid && !submitting ? "active" : "inactive"}`}
            disabled={!isFormValid || submitting}
          >
            {submitting ? "Registering…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
