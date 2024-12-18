import React, { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [patients, setPatients] = useState([]);
  const [currentPatientIndex, setCurrentPatientIndex] = useState(null);
  const [doctorStatus, setDoctorStatus] = useState('idle'); // 'idle', 'busy'
  const [patientNumber, setPatientNumber] = useState(1);

  const [regForm, setRegForm] = useState({
    number: '',
    name: '',
    recordNumber: '',
    phone: '',
  });

  const maxNumber = patients.length > 0 ? patients[patients.length - 1].number : 0;

  const handleAddPatient = () => {
    if (regForm.name.trim() === '') {
      alert('病人姓名為必填');
      return;
    }
    const newPatient = {
      number: regForm.number ? parseInt(regForm.number) : patientNumber,
      name: regForm.name,
      recordNumber: regForm.recordNumber,
      phone: regForm.phone,
      status: 'waiting', // 'waiting', 'beingSeen', 'missed', 'completed'
      arrivalTime: null, // For missed patients
      isMissed: false,
      waitAfterArrival: 0, // For managing waiting after arrival
    };
    setPatients([...patients, newPatient]);
    setRegForm({ number: '', name: '', recordNumber: '', phone: '' });
    setPatientNumber(patientNumber + 1);
  };

  const handleStartConsultation = () => {
    // Finish the current patient if any
    if (currentPatientIndex !== null) {
      const updatedPatients = [...patients];
      updatedPatients[currentPatientIndex].status = 'completed';
      setPatients(updatedPatients);
      setCurrentPatientIndex(null);
    }

    // Start consultation with next patient
    const nextPatientIndex = getNextPatientIndex();
    if (nextPatientIndex !== null) {
      const updatedPatients = [...patients];
      updatedPatients[nextPatientIndex].status = 'beingSeen';
      setPatients(updatedPatients);
      setCurrentPatientIndex(nextPatientIndex);
      setDoctorStatus('busy');
    } else {
      alert('沒有候診中的病人');
      setDoctorStatus('idle');
    }
  };

  const handleMissedPatient = () => {
    if (currentPatientIndex !== null) {
      const updatedPatients = [...patients];
      updatedPatients[currentPatientIndex].status = 'missed';
      updatedPatients[currentPatientIndex].isMissed = true;
      updatedPatients[currentPatientIndex].arrivalTime = null;
      updatedPatients[currentPatientIndex].waitAfterArrival = 0;
      setPatients(updatedPatients);
      setCurrentPatientIndex(null);
      setDoctorStatus('idle');
    }
  };

  const handleMissedPatientArrival = (number) => {
    const updatedPatients = patients.map((patient) => {
      if (patient.number === number) {
        return {
          ...patient,
          arrivalTime: new Date(),
          status: 'waiting',
          waitAfterArrival: 0,
          // 保持 isMissed 為 true
        };
      }
      return patient;
    });
    setPatients(updatedPatients);
  };

  const getNextPatientIndex = () => {
    // Implement the logic to get the next patient index according to the rules

    // 1. If there are waiting patients who are not missed, call them first
    const waitingPatients = patients.filter(
      (p) => p.status === 'waiting' && !p.isMissed
    );

    if (waitingPatients.length > 0) {
      const nextPatient = waitingPatients[0];
      return patients.findIndex((p) => p.number === nextPatient.number);
    }

    // 2. Then check for missed patients who have arrived and waited long enough
    const arrivedMissedPatients = patients
      .filter(
        (p) =>
          p.isMissed &&
          p.arrivalTime &&
          p.status === 'waiting' &&
          p.waitAfterArrival >= 1
      )
      .sort((a, b) => a.arrivalTime - b.arrivalTime);

    if (arrivedMissedPatients.length > 0) {
      const nextMissedPatient = arrivedMissedPatients[0];
      return patients.findIndex((p) => p.number === nextMissedPatient.number);
    }

    // 3. If no eligible patients, return null
    return null;
  };

  const incrementWaitAfterArrival = () => {
    // Increment the waitAfterArrival for all arrived missed patients who are waiting
    const updatedPatients = patients.map((patient) => {
      if (patient.isMissed && patient.arrivalTime && patient.status === 'waiting') {
        return { ...patient, waitAfterArrival: patient.waitAfterArrival + 1 };
      }
      return patient;
    });
    setPatients(updatedPatients);
  };

  const getExpectedSequence = () => {
    const sequence = [];
    const queue = [...patients];

    // Get waiting patients who are not missed
    const waitingPatients = queue.filter(
      (p) => p.status === 'waiting' && !p.isMissed
    );

    // Get missed patients who have arrived and waited long enough
    const arrivedMissedPatients = queue
      .filter(
        (p) =>
          p.isMissed &&
          p.arrivalTime &&
          p.status === 'waiting' &&
          p.waitAfterArrival >= 1
      )
      .sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Build the expected sequence
    let waitingIndex = 0;
    let missedIndex = 0;

    while (sequence.length < 6) {
      if (waitingIndex < waitingPatients.length) {
        sequence.push(waitingPatients[waitingIndex]);
        waitingIndex++;
      } else if (missedIndex < arrivedMissedPatients.length) {
        sequence.push(arrivedMissedPatients[missedIndex]);
        missedIndex++;
      } else {
        break;
      }
    }

    return sequence;
  };

  const anonymizeName = (name) => {
    if (name.length <= 2) {
      return name[0] + '○';
    } else {
      return name[0] + '○' + name.slice(2);
    }
  };

  return (
    <div className="p-4">
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 ${
            activeTab === 'public' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('public')}
        >
          一般民眾查詢看診進度
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'staff' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('staff')}
        >
          掛號人員
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'doctor' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('doctor')}
        >
          醫師
        </button>
      </div>

      {activeTab === 'public' && (
        <div>
          <h2 className="text-xl font-bold mb-4">看診進度</h2>
          <ul>
            {patients.map((patient) => (
              <li key={patient.number}>
                {patient.number} 號 - {anonymizeName(patient.name)} -{' '}
                {patient.status === 'beingSeen'
                  ? '看診中'
                  : patient.status === 'waiting'
                  ? '候診中'
                  : patient.status === 'missed'
                  ? '過號'
                  : '完診'}
              </li>
            ))}
          </ul>
          <h3 className="text-lg font-bold mt-4">過號病人</h3>
          <ul>
            {patients
              .filter((p) => p.status === 'missed' || (p.isMissed && p.status === 'waiting'))
              .map((patient) => (
                <li key={patient.number}>
                  {patient.number} 號 - {anonymizeName(patient.name)} -{' '}
                  {patient.status === 'waiting' ? '候診中' : '過號'}
                </li>
              ))}
          </ul>
          <h3 className="text-lg font-bold mt-4">預計看診順序（最多顯示6位）</h3>
          <ul>
            {getExpectedSequence().map((patient) => (
              <li key={patient.number}>{patient.number} 號</li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'staff' && (
        <div>
          <h2 className="text-xl font-bold mb-4">掛號人員介面</h2>
          <div className="mb-4">
            <label className="block">
              看診號（選填，目前最大號：{maxNumber}）
              <input
                type="number"
                className="border px-2 py-1 w-full"
                value={regForm.number}
                onChange={(e) => setRegForm({ ...regForm, number: e.target.value })}
              />
            </label>
            <label className="block">
              病人姓名（必填）
              <input
                type="text"
                className="border px-2 py-1 w-full"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />
            </label>
            <label className="block">
              病歷號（選填）
              <input
                type="text"
                className="border px-2 py-1 w-full"
                value={regForm.recordNumber}
                onChange={(e) => setRegForm({ ...regForm, recordNumber: e.target.value })}
              />
            </label>
            <label className="block">
              電話（選填）
              <input
                type="text"
                className="border px-2 py-1 w-full"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
              />
            </label>
            <button
              className="bg-green-500 text-white px-4 py-2 mt-2"
              onClick={handleAddPatient}
            >
              新增病人
            </button>
          </div>
          <h3 className="text-lg font-bold mt-4">過號管理</h3>
          <ul>
            {patients
              .filter((p) => p.status === 'missed')
              .map((patient) => (
                <li key={patient.number} className="flex items-center">
                  {patient.number} 號 - {patient.name}
                  <button
                    className="ml-2 bg-blue-500 text-white px-2 py-1"
                    onClick={() => handleMissedPatientArrival(patient.number)}
                  >
                    到場
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {activeTab === 'doctor' && (
        <div>
          <h2 className="text-xl font-bold mb-4">醫師介面</h2>
          <p>
            目前候診人數：
            {patients.filter((p) => p.status === 'waiting' && !p.isMissed).length}
          </p>
          <p>
            過號候診人數：
            {patients.filter(
              (p) => p.isMissed && p.arrivalTime && p.status === 'waiting'
            ).length}
          </p>
          <p>
            病人狀態：
            {currentPatientIndex !== null
              ? `看診中 - ${patients[currentPatientIndex].number} 號 - ${
                  patients[currentPatientIndex].name
                }`
              : '無'}
          </p>
          <button
            className="bg-blue-500 text-white px-4 py-2 mt-2"
            onClick={() => {
              handleStartConsultation();
              incrementWaitAfterArrival();
            }}
          >
            {doctorStatus === 'idle' ? '開始看診' : '結束看診，下一位'}
          </button>
          {doctorStatus === 'busy' && (
            <button
              className="bg-red-500 text-white px-4 py-2 mt-2 ml-2"
              onClick={handleMissedPatient}
            >
              過號
            </button>
          )}
          <h3 className="text-lg font-bold mt-4">預計看診順序（最多顯示6位）</h3>
          <ul>
            {getExpectedSequence().map((patient) => (
              <li key={patient.number}>{patient.number} 號</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;