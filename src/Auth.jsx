import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, getDoc, doc } from "firebase/firestore";
import './Auth.css';
import SKPLogo from "./SKP-logo.jpg";

const Auth = ({ setRole }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRoleState] = useState("Doctor");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          email,
        });

        alert("Registration successful! Please log in.");
        setIsRegister(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const roleDoc = doc(db, "users", user.uid);
        const userRole = (await getDoc(roleDoc)).data()?.role;
        
        navigate("/admin");

      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="auth-page">
      <div className="header">
        <img src={SKPLogo} alt="SKP Logo" className="logo" />
        <h2 className="header-title">{isRegister ? "Staff Register" : "Staff Login"}</h2>
      </div>

      <div className="auth-container">
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit">{isRegister ? "Register" : "Log In"}</button>
        </form>

        <button className="switch-button" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Switch to Log In" : "Switch to Register"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
