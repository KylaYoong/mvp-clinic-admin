import React, { useState, useEffect } from "react";
import { Calendar } from "antd";
import { db } from "./firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import "./Admin.css";

const CalendarWithTransactions = () => {
  const [patients, setPatients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  // useEffect to fetch patients for the selected date
  useEffect(() => {
    const patientsRef = collection(db, "queue");

    const unsubscribe = onSnapshot(
      query(
        patientsRef,
        where("date", "==", selectedDate),
        orderBy("timestamp", "asc")
      ),
      (snapshot) => {
        const fetchedPatients = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(fetchedPatients);
      }
    );

    return () => unsubscribe();
  }, [selectedDate]);

  const handleDateSelect = (value) => {
    setSelectedDate(value.format("YYYY-MM-DD"));
  };

  return (
    <div className="calendar-with-transactions">
      <Calendar onSelect={handleDateSelect} />
      <div className="patients-section">
        <h3>Transactions on {selectedDate}</h3>
        {patients.length > 0 ? (
          <div className="table-wrapper">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Queue No.</th>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.queueNumber}</td>
                    <td>{patient.employeeID}</td>
                    <td>{patient.name || "N/A"}</td>
                    <td>{patient.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No transactions found for this date.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarWithTransactions;
