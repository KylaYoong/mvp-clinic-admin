import React, { useState } from "react";
import { db } from "./firebase"; // Import Firebase Firestore
import { collection, addDoc } from "firebase/firestore"; // Firestore functions
import "./InputEmployeeDataForm.css";
import SKPLogo from "./SKP-logo.jpg"; // Import the logo

function InputEmployeeData() {
  const [empID, setEmpID] = useState("");
  const [name, setName] = useState("");
  // const [dob, setDOB] = useState("");
  const [gender, setGender] = useState("");
  const [department, setDepartment] = useState("");
  const [mobile, setMobile] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate mandatory fields
    if (!empID || !name || !gender || !department) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    // Employee data to be submitted
    const employeeData = {
      empID,
      name,
      // dob: dob || "Not provided",
      gender,
      department,
      mobile: mobile || "Not provided",
    };

    try {
      // Add document to Firestore
      const docRef = await addDoc(collection(db, "employees"), employeeData);
      console.log("Document written with ID: ", docRef.id);
      alert("Employee data submitted successfully!");

      // Reset form fields
      setEmpID("");
      setName("");
      // setDOB("");
      setGender("");
      setDepartment("");
      setMobile("");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error submitting data. Please try again.");
    }
  };

  return (
    <div className="admin-container">
      {/* Logo and Header */}
      <div className="header">
        <img src={SKPLogo} alt="SKP Logo" className="logo" />
        <h2 className="header-title">Input Employee Data</h2>
      </div>

      <div className="admin-interface">
        <form onSubmit={handleSubmit} className="register-form">
          {/* Employee ID Field */}
          <div className="form-row">
            <label>
              Employee ID<span style={{ color: "red" }}>*</span>:
            </label>
            <input
              type="text"
              placeholder="Enter Employee ID"
              value={empID}
              onChange={(e) => setEmpID(e.target.value)}
              required
            />
          </div>

          {/* Name Field */}
          <div className="form-row">
            <label>
              Full Name<span style={{ color: "red" }}>*</span>:
            </label>
            <input
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Date of Birth Field */}
          {/* <div className="form-row">
            <label>Date of Birth:</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDOB(e.target.value)}
            />
          </div> */}

          {/* Gender Field */}
          <div className="form-row">
            <label>
              Gender<span style={{ color: "red" }}>*</span>:
            </label>
            <div className="gender-options">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={gender === "Female"}
                  onChange={(e) => setGender(e.target.value)}
                  required
                />
                Female
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={gender === "Male"}
                  onChange={(e) => setGender(e.target.value)}
                  required
                />
                Male
              </label>
            </div>
          </div>

          {/* Department Field */}
          <div className="form-row">
            <label>
              Department<span style={{ color: "red" }}>*</span>:
            </label>
            <input
              type="text"
              placeholder="Enter Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>

          {/* Mobile Number Field */}
          <div className="form-row">
            <label>Mobile Number:</label>
            <input
              type="tel"
              placeholder="Enter Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          {/* Form Buttons */}
          <div className="form-buttons">
            <button type="submit">Submit</button>
            <button type="button" onClick={() => window.history.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputEmployeeData;
