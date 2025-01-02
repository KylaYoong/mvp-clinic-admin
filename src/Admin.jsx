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
  deleteDoc,
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
    const queueMetaRef = doc(db, "queueMeta", "queueMeta");

    const resetDailyQueue = async () => {
      try {
        // Check if a reset is required
        const queueMetaSnapshot = await getDocs(collection(db, "queueMeta"));
        if (!queueMetaSnapshot.empty) {
          const queueMetaData = queueMetaSnapshot.docs[0].data();
          const lastResetDate =
            queueMetaData.lastResetDate && typeof queueMetaData.lastResetDate.toDate === "function"
              ? queueMetaData.lastResetDate.toDate()
              : new Date(0);

          const today = new Date().setHours(0, 0, 0, 0);
          if (today !== lastResetDate.setHours(0, 0, 0, 0)) {
            // Clear the queue for a new day
            const snapshot = await getDocs(patientsRef);
            const batch = db.batch();

            snapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });

            // Reset queue metadata
            batch.set(queueMetaRef, {
              queueNumber: "S5-01",
              lastResetDate: Timestamp.fromDate(new Date()),
            });

            await batch.commit();
            console.log("Queue reset for the day completed.");
          }
        }
      } catch (error) {
        console.error("Error resetting the queue:", error);
      }
    };

    resetDailyQueue();

    // Monitor patients in the queue
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
        alert(`Invited: ${nextPatient.queueNumber}`);
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
      const employeesCollection = collection(db, "employees");
      const employeeSnapshot = await getDocs(query(employeesCollection, where("empID", "==", empID)));

      if (employeeSnapshot.empty) {
        alert("Invalid Employee ID! This employee does not exist in the database.");
        setLoading(false);
        return;
      }

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
          queueNumber = "S5-01";
          await setDoc(queueSnapshot.docs[0].ref, {
            queueNumber,
            lastResetDate: Timestamp.fromDate(new Date()),
          });
        } else {
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
        queueNumber = "S5-01";
        await setDoc(doc(queueCollection, "queueMeta"), {
          queueNumber,
          lastResetDate: Timestamp.fromDate(new Date()),
        });
      }

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

  // imported in App.jsx
  const handleNavigateToTVQueue = () => {
    navigate("/tv-queue-display");
  };

  const handleNavigateToInputEmployeeData = () => {
    navigate("/input-employee-data");
  };

  const handleNavigateToCalendar = () => {
    navigate("/calendar");
  };

  const handleNavigateToManageOptions = () => {
    navigate("/manage-options");
  };

  return (
    <div className="admin-container">
      <div className="header">
        <img src={SKPLogo} alt="SKP Logo" className="logo" />
        <h2 className="header-title">Admin Interface</h2>
      </div>

      <div className="admin-interface">
        <button onClick={handleInviteNextPatient}>Call Next Patient</button>

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
        <br />

        <button onClick={handleNavigateToCalendar}>Go to Calendar</button>
        <br />

        <button onClick={handleNavigateToManageOptions}>Go to Manage Options</button>
      </div>
    </div>
  );
}

export default Admin;
