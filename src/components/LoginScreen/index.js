import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

const LoginScreen = () => {
  const [name, setName] = useState(""); // backend expects name for login, not email
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const isFormValid = name !== "" && password !== "";

  const handleSubmit = async () => {
  try {
    const response = await fetch("http://localhost:3001/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, password }),
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");

    const data = isJson ? await response.json() : await response.text();

    console.log("Status:", response.status);
    console.log("Raw response:", data);

    if (response.ok) {
      toast.success(data.message);
      localStorage.setItem("token", data.token);
      setTimeout(() => navigate("/profile"), 1500);
    } else {
      toast.error(data.message || data || "Login failed");
    }
  } catch (error) {
    console.error("Network error:", error);
    toast.error("Login failed, try again.");
  }
};


  return (
    <div className="signin-container">
      <ToastContainer position="top-center" />
      <div className="signin-box">
        <h1 className="signin-heading">Signin to your PopX account</h1>
        <p className="signin-subtext">
          Lorem ipsum dolor sit amet,
          <br /> consectetur adipiscing elit,
        </p>

        <div className="input-group">
          <label className="input-label">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`signin-button ${isFormValid ? "active" : "disabled"}`}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;