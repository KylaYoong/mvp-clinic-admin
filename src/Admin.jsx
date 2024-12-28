import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import "./Admin.css";
import SKPLogo from "./SKP-logo.jpg";

function Admin() {
  const [empID, setEmpID] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const patientsRef = collection(db, "queue");
    const q = query(
      patientsRef,
      where("status", "in", ["waiting", "being attended"]),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientList);
    });

    return () => unsubscribe();
  }, []);

  const handleInviteNextPatient = async () => {
    try {
      const currentPatient = patients.find((patient) => patient.status === "being attended");
      const nextPatient = patients.find((patient) => patient.status === "waiting");

      if (currentPatient) {
        await updateDoc(doc(db, "queue", currentPatient.id), { status: "completed" });
        console.log(`Marked as completed: ${currentPatient.queueNumber}`);
      }

      if (nextPatient) {
        await updateDoc(doc(db, "queue", nextPatient.id), { status: "being attended" });
        console.log(`Marked as being attended: ${nextPatient.queueNumber}`);
        alert(`Invited: ${nextPatient.name}`);
      } else {
        alert("No more patients waiting!");
      }
    } catch (error) {
      console.error("Error inviting next patient:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();

    if (!empID.match(/^\d{6}$/)) {
      alert("Employee ID must be exactly 6 digits!");
      return;
    }

    setLoading(true);
    try {
      // Verify if the employee exists in the "employees" collection
      const employeesCollection = collection(db, "employees");
      const employeeSnapshot = await getDocs(query(employeesCollection, where("empID", "==", empID)));

      if (employeeSnapshot.empty) {
        alert("Invalid Employee ID! This employee does not exist in the database.");
        setLoading(false);
        return;
      }

      // Retrieve queue metadata
      const queueCollection = collection(db, "queueMeta");
      const queueSnapshot = await getDocs(queueCollection);

      let queueNumber;
      let lastResetDate;

      if (!queueSnapshot.empty) {
        const queueData = queueSnapshot.docs[0].data();

        lastResetDate =
          queueData.lastResetDate && typeof queueData.lastResetDate.toDate === "function"
            ? queueData.lastResetDate.toDate()
            : new Date(0);

        const today = new Date().setHours(0, 0, 0, 0);
        if (today !== lastResetDate.setHours(0, 0, 0, 0)) {
          // Reset queue number for a new day
          queueNumber = "S5-01";
          await setDoc(queueSnapshot.docs[0].ref, {
            queueNumber,
            lastResetDate: Timestamp.fromDate(new Date()),
          });
        } else {
          // Increment queue number for the current day
          const lastQueueNumber =
            queueData.queueNumber && queueData.queueNumber.startsWith("S5-")
              ? parseInt(queueData.queueNumber.slice(3), 10)
              : 0;

          queueNumber = `S5-${String(lastQueueNumber + 1).padStart(2, "0")}`;
          await setDoc(queueSnapshot.docs[0].ref, {
            ...queueData,
            queueNumber,
          });
        }
      } else {
        // Initialize queue number if none exists
        queueNumber = "S5-01";
        await setDoc(doc(queueCollection, "queueMeta"), {
          queueNumber,
          lastResetDate: Timestamp.fromDate(new Date()),
        });
      }

      // Register the patient with the generated queue number
      const patientRef = doc(collection(db, "queue"), empID);
      await setDoc(patientRef, {
        employeeID: empID,
        queueNumber,
        status: "waiting",
        timestamp: Timestamp.now(),
      });

      alert(`Patient registered successfully! Queue number: ${queueNumber}`);
      setEmpID("");
    } catch (error) {
      console.error("Error during registration:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToTVQueue = () => {
    navigate("/tv-queue-display");
  };

  const handleNavigateToInputEmployeeData = () => {
    navigate("/input-employee-data");
  };

  return (
    <div className="admin-container">
      <div className="header">
        <img src={SKPLogo} alt="SKP Logo" className="logo" />
        <h2 className="header-title">Admin Interface</h2>
      </div>

      <div className="admin-interface">
        <button onClick={handleInviteNextPatient}>Invite Next Patient</button>

        <form onSubmit={handleRegisterPatient} className="register-form">
          <input
            type="text"
            placeholder="Enter Employee ID"
            value={empID}
            onChange={(e) => setEmpID(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register New Patient"}
          </button>
        </form>

        <br />
        <button onClick={handleNavigateToTVQueue}>View Queue on TV</button>
        <br />
        <button onClick={handleNavigateToInputEmployeeData}>Go to Input Employee Data</button>
      </div>
    </div>
  );
}

export default Admin;
