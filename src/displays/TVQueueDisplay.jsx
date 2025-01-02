import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct
import "./TVQueueDisplay.css";

const TVQueueDisplay = () => {
  const [currentServing, setCurrentServing] = useState(null);
  const [upcomingPatients, setUpcomingPatients] = useState([]);
  const [completedPatients, setCompletedPatients] = useState([]);
  const [currentTime, setCurrentTime] = useState("");

  const formatQueueNumber = (queueNumber) => {
    return queueNumber
      .replace(/0/g, " zero ")
      .replace(/([A-Z])/, "$1 ");
  };

  const announceQueueNumber = (queueNumber) => {
    if ("speechSynthesis" in window) {
      const formattedNumber = formatQueueNumber(queueNumber);
      const utterance = new SpeechSynthesisUtterance(`Now serving ${formattedNumber}`);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const date = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(`${date} ${time}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const queueRef = collection(db, "queue");
    const q = query(queueRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const nextServing = patients.find((patient) => patient.status === "being attended");
      if (nextServing && nextServing.queueNumber !== (currentServing?.queueNumber || null)) {
        announceQueueNumber(nextServing.queueNumber);
      }
      setCurrentServing(nextServing || null);

      const upcoming = patients.filter((patient) => patient.status === "waiting");
      setUpcomingPatients(upcoming);

      const completed = patients
        .filter((patient) => patient.status === "completed")
        .sort((a, b) => b.timestamp - a.timestamp);
      setCompletedPatients(completed);
    });

    return () => unsubscribe();
  }, [currentServing]);

  return (
    <div className="tv-display">
      <div className="header">
        <div className="date">{currentTime.split(" ")[0]}</div>
        <div className="time">{currentTime.split(" ").slice(1).join(" ")}</div>
      </div>

      <div className="main-container">
        {/* Horizontal Now Serving Section */}
        <div className="horizontal-section">
          <div className="now-serving-horizontal">
            <h2>Now Serving</h2>
            <div className="queue-number">
              {currentServing ? currentServing.queueNumber : "None"}
            </div>
          </div>
        </div>

        {/* Vertical Waiting and Completed Sections */}
        <div className="waiting-completed">
          <div className="waiting-left-side">
            <div className="section">
              <h2>Waiting</h2>
              {upcomingPatients.length > 0 ? (
                upcomingPatients.map((patient) => (
                  <div key={patient.id} className="queue-item">
                    <div className="queue">{patient.queueNumber}</div>
                    <div className="name">{patient.name}</div>
                  </div>
                ))
              ) : (
                <p>No waiting patients</p>
              )}
            </div>
          </div>

          <div className="completed-section">
            <h2>Completed</h2>
            {completedPatients.length > 0 ? (
              completedPatients.map((patient) => (
                <div key={patient.id} className="completed-item">
                  {patient.queueNumber}
                </div>
              ))
            ) : (
              <p>No completed patients</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVQueueDisplay;
