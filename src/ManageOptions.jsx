import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./ManageOptions.css";

const ManageOptions = () => {
  const [sickConditions, setSickConditions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [newCondition, setNewCondition] = useState("");
  const [newMedicine, setNewMedicine] = useState("");
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const conditionsSnapshot = await getDocs(collection(db, "sickConditions"));
      const medicinesSnapshot = await getDocs(collection(db, "medicines"));

      setSickConditions(
        conditionsSnapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name }))
      );
      setMedicines(
        medicinesSnapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name }))
      );
    };

    fetchData();
  }, []);

  const handleAddCondition = async () => {
    if (newCondition.trim() === "") return;
    const newDoc = await addDoc(collection(db, "sickConditions"), { name: newCondition });
    setSickConditions([...sickConditions, { id: newDoc.id, name: newCondition }]);
    setNewCondition("");
  };

  const handleAddMedicine = async () => {
    if (newMedicine.trim() === "") return;
    const newDoc = await addDoc(collection(db, "medicines"), { name: newMedicine });
    setMedicines([...medicines, { id: newDoc.id, name: newMedicine }]);
    setNewMedicine("");
  };

  const handleDeleteSelected = async () => {
    // Delete selected sick conditions
    for (const id of selectedConditions) {
      await deleteDoc(doc(db, "sickConditions", id));
    }
    setSickConditions(sickConditions.filter((condition) => !selectedConditions.includes(condition.id)));
    setSelectedConditions([]);

    // Delete selected medicines
    for (const id of selectedMedicines) {
      await deleteDoc(doc(db, "medicines", id));
    }
    setMedicines(medicines.filter((medicine) => !selectedMedicines.includes(medicine.id)));
    setSelectedMedicines([]);
  };

  const handleToggleConditionSelection = (id) => {
    setSelectedConditions((prev) =>
      prev.includes(id) ? prev.filter((conditionId) => conditionId !== id) : [...prev, id]
    );
  };

  const handleToggleMedicineSelection = (id) => {
    setSelectedMedicines((prev) =>
      prev.includes(id) ? prev.filter((medicineId) => medicineId !== id) : [...prev, id]
    );
  };

  return (
    <div className="manage-options-container">
      <div>
        <h3>Sick Conditions</h3>
        <ul>
          {sickConditions.map((condition) => (
            <li key={condition.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(condition.id)}
                  onChange={() => handleToggleConditionSelection(condition.id)}
                />
                {condition.name}
              </label>
            </li>
          ))}
        </ul>
        <input
          type="text"
          placeholder="Add new condition"
          value={newCondition}
          onChange={(e) => setNewCondition(e.target.value)}
        />
        <button onClick={handleAddCondition}>Add Condition</button>
      </div>

      <div>
        <h3>Medicines</h3>
        <ul>
          {medicines.map((medicine) => (
            <li key={medicine.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedMedicines.includes(medicine.id)}
                  onChange={() => handleToggleMedicineSelection(medicine.id)}
                />
                {medicine.name}
              </label>
            </li>
          ))}
        </ul>
        <input
          type="text"
          placeholder="Add new medicine"
          value={newMedicine}
          onChange={(e) => setNewMedicine(e.target.value)}
        />
        <button onClick={handleAddMedicine}>Add Medicine</button>
      </div>

      <button className="delete-selected" onClick={handleDeleteSelected}>
        Delete Selected
      </button>
    </div>
  );
};

export default ManageOptions;
