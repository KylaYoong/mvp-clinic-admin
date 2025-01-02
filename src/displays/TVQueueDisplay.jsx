import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct
import "./TVQueueDisplay.css";

const TVQueueDisplay = () => {
  const [currentServing, setCurrentServing] = useState(null);
  const [upcomingPatients, setUpcomingPatients] = useState([]);
  const [completedPatients, setCompletedPatients] = useState([]);
  const [currentTime, setCurrentTime] = useState("");

  /**
   * Format the queue number for better pronunciation by the Web Speech API.
   * @param {string} queueNumber - The raw queue number (e.g., "A001").
   * @returns {string} - The formatted queue number for pronunciation (e.g., "A zero zero one").
   */
  const formatQueueNumber = (queueNumber) => {
    return queueNumber
      .replace(/0/g, " zero ") // Replace all zeros with "zero"
      .replace(/([A-Z])/, "$1 "); // Add a space after the letter for clarity
  };

  /**
   * Announce the queue number using the Web Speech API.
   * @param {string} queueNumber - The queue number to announce.
   */
  const announceQueueNumber = (queueNumber) => {
    if ("speechSynthesis" in window) {
      const formattedNumber = formatQueueNumber(queueNumber); // Format for proper pronunciation
      console.log(`Announcing: ${formattedNumber}`); // Log for debugging
      const utterance = new SpeechSynthesisUtterance(`Now serving ${formattedNumber}`);
      utterance.lang = "en-US"; // Set language for the announcement
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("SpeechSynthesis not supported in this browser.");
    }
  };

  // Update current time every second
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
        hour12: true, // Ensure AM/PM is included
      });

      setCurrentTime(`${date} ${time}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real-time data from Firestore
  useEffect(() => {
    const queueRef = collection(db, "queue");
    const q = query(queueRef, orderBy("timestamp", "asc")); // Fetch all patients ordered by timestamp

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Find the patient currently being served
      const nextServing = patients.find((patient) => patient.status === "being attended");

      // Announce the queue number if it changes
      if (nextServing && nextServing.queueNumber !== (currentServing?.queueNumber || null)) {
        console.log(`Sound trigger condition met for: ${nextServing.queueNumber}`); // Log before calling announce
        announceQueueNumber(nextServing.queueNumber);
      }

      setCurrentServing(nextServing || null);

      // Update the list of upcoming patients
      const upcoming = patients.filter((patient) => patient.status === "waiting");
      setUpcomingPatients(upcoming);

      // Update the list of completed patients in descending order
      const completed = patients
        .filter((patient) => patient.status === "completed")
        .sort((a, b) => b.timestamp - a.timestamp); // Sort in descending order
      setCompletedPatients(completed);
    });

    return () => unsubscribe();
  }, [currentServing]); // Dependency includes currentServing to track changes

  return (
    <div className="tv-display">
      <div className="header">
        <div className="date">{currentTime.split(" ")[0]}</div> {/* Date */}
        <div className="time">{currentTime.split(" ").slice(1).join(" ")}</div> {/* Time */}
      </div>

      <div className="main-container">
        {/* Left Side: Waiting */}
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

        {/* Right Side */}
        <div className="now-serving-right-side">
          {/* Now Serving */}
          <div className="section">
            <h2>Now Serving</h2>
            <div className="queue-number">
              {currentServing ? currentServing.queueNumber : "None"}
            </div>
          </div>

          {/* Completed */}
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
