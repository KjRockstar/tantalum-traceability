import React, { useState } from 'react';

function App() {
  const [batchId, setBatchId] = useState('');
  const [batch, setBatch] = useState(null);
  const [contaminationScore, setContaminationScore] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    batchId: '',
    actorId: 'Mine-01',
    weight: '',
  });

  const [createMessage, setCreateMessage] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [mergeForm, setMergeForm] = useState({
    newBatchId: '',
    actorId: 'SMELTER001',
    parent1: '',
    weight1: '',
    parent2: '',
    weight2: '',
  });

  const [mergeMessage, setMergeMessage] = useState('');
  const [mergeError, setMergeError] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);

  const [splitForm, setSplitForm] = useState({
    parentBatchId: '',
    child1: '',
    weight1: '',
    child2: '',
    weight2: '',
  });

  const [splitMessage, setSplitMessage] = useState('');
  const [splitError, setSplitError] = useState('');
  const [splitLoading, setSplitLoading] = useState(false);

  const [receiptForm, setReceiptForm] = useState({
    batchId: '',
  });

  const [receiptMessage, setReceiptMessage] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);

  const [flagForm, setFlagForm] = useState({
    batchId: '',
    flagType: 'conflict-risk',
    severity: '80',
    dilutable: 'true',
  });

  const [flagMessage, setFlagMessage] = useState('');
  const [flagError, setFlagError] = useState('');
  const [flagLoading, setFlagLoading] = useState(false);

  const verifyBatch = async () => {
    if (!batchId.trim()) {
      setError('Please enter a Batch ID.');
      return;
    }

    setLoading(true);
    setError('');
    setBatch(null);
    setContaminationScore(null);

    try {
      const id = encodeURIComponent(batchId.trim());

      const [batchResponse, contaminationResponse] = await Promise.all([
        fetch(`/api/batches/${id}`),
        fetch(`/api/batches/${id}/contamination`)
      ]);

      const batchData = await batchResponse.json();
      const contaminationData = await contaminationResponse.json();

      if (!batchResponse.ok) {
        throw new Error(batchData.error || 'Batch not found');
      }

      if (!contaminationResponse.ok) {
        throw new Error(
          contaminationData.error || 'Could not calculate contamination score'
        );
      }

      setBatch(batchData);
      setContaminationScore(contaminationData.contaminationScore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();

    if (!createForm.batchId.trim() || !createForm.weight) {
      setCreateError('Batch ID and weight are required.');
      setCreateMessage('');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    setCreateMessage('');

    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: createForm.batchId.trim(),
          actorId: createForm.actorId.trim(),
          weight: Number(createForm.weight),
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not create batch');
      }

      setCreateMessage(
        `Batch ${data.batchId} was successfully recorded on the ledger.`
      );

      setCreateForm({
        batchId: '',
        actorId: 'Mine-01',
        weight: '',
      });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const mergeBatches = async (e) => {
    e.preventDefault();

    if (
      !mergeForm.newBatchId.trim() ||
      !mergeForm.parent1.trim() ||
      !mergeForm.parent2.trim() ||
      !mergeForm.weight1 ||
      !mergeForm.weight2
    ) {
      setMergeError('New Batch ID, both parent IDs, and both weights are required.');
      setMergeMessage('');
      return;
    }

    const weight1 = Number(mergeForm.weight1);
    const weight2 = Number(mergeForm.weight2);
    const totalWeight = weight1 + weight2;

    setMergeLoading(true);
    setMergeError('');
    setMergeMessage('');

    try {
      const response = await fetch('/api/batches/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newBatchId: mergeForm.newBatchId.trim(),
          actorId: mergeForm.actorId.trim(),
          totalWeight,
          parents: [
            {
              parentBatchId: mergeForm.parent1.trim(),
              weightContributed: weight1,
            },
            {
              parentBatchId: mergeForm.parent2.trim(),
              weightContributed: weight2,
            },
          ],
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not merge batches');
      }

      setMergeMessage(
        `Batch ${data.batchId} was successfully created from ${data.parents.length} parent batches.`
      );

      setMergeForm({
        newBatchId: '',
        actorId: 'SMELTER001',
        parent1: '',
        weight1: '',
        parent2: '',
        weight2: '',
      });
    } catch (err) {
      setMergeError(err.message);
    } finally {
      setMergeLoading(false);
    }
  };

  const splitBatch = async (e) => {
    e.preventDefault();

    if (
      !splitForm.parentBatchId.trim() ||
      !splitForm.child1.trim() ||
      !splitForm.child2.trim() ||
      !splitForm.weight1 ||
      !splitForm.weight2
    ) {
      setSplitError('Parent ID, both child IDs, and both weights are required.');
      setSplitMessage('');
      return;
    }

    const weight1 = Number(splitForm.weight1);
    const weight2 = Number(splitForm.weight2);

    setSplitLoading(true);
    setSplitError('');
    setSplitMessage('');

    try {
      const response = await fetch('/api/batches/split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentBatchId: splitForm.parentBatchId.trim(),
          children: [
            {
              batchId: splitForm.child1.trim(),
              weight: weight1,
              actorId: 'SMELTER001',
            },
            {
              batchId: splitForm.child2.trim(),
              weight: weight2,
              actorId: 'SMELTER001',
            },
          ],
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not split batch');
      }

      setSplitMessage(
        `Batch ${splitForm.parentBatchId.trim()} was successfully split into ${data.length} child batches.`
      );

      setSplitForm({
        parentBatchId: '',
        child1: '',
        weight1: '',
        child2: '',
        weight2: '',
      });
    } catch (err) {
      setSplitError(err.message);
    } finally {
      setSplitLoading(false);
    }
  };

  const recordReceipt = async (e) => {
    e.preventDefault();

    if (!receiptForm.batchId.trim()) {
      setReceiptError('Batch ID is required.');
      setReceiptMessage('');
      return;
    }

    setReceiptLoading(true);
    setReceiptError('');
    setReceiptMessage('');

    try {
      const response = await fetch('/api/batches/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: receiptForm.batchId.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not record receipt');
      }

      setReceiptMessage(
        `Batch ${data.batchId} was successfully received by the manufacturer.`
      );

      setReceiptForm({
        batchId: '',
      });
    } catch (err) {
      setReceiptError(err.message);
    } finally {
      setReceiptLoading(false);
    }
  };

  const flagBatch = async (e) => {
    e.preventDefault();

    if (!flagForm.batchId.trim() || !flagForm.severity) {
      setFlagError('Batch ID and severity are required.');
      setFlagMessage('');
      return;
    }

    const severity = Number(flagForm.severity);

    if (severity < 0 || severity > 100) {
      setFlagError('Severity must be between 0 and 100.');
      setFlagMessage('');
      return;
    }

    setFlagLoading(true);
    setFlagError('');
    setFlagMessage('');

    try {
      const response = await fetch('/api/batches/flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: flagForm.batchId.trim(),
          flagType: flagForm.flagType,
          severity,
          dilutable: flagForm.dilutable === 'true',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not flag batch');
      }

      setFlagMessage(
        `Batch ${data.batchId} was successfully flagged by the auditor.`
      );

      setFlagForm({
        batchId: '',
        flagType: 'conflict-risk',
        severity: '80',
        dilutable: 'true',
      });
    } catch (err) {
      setFlagError(err.message);
    } finally {
      setFlagLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Tantalum Traceability</h1>
          <p>Blockchain-Based Chain-of-Custody Verification System</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          Fabric Network Connected
        </div>
      </header>

      <main className="dashboard">
        <section className="hero">
          <div>
            <span className="eyebrow">SUPPLY CHAIN VERIFICATION</span>
            <h2>Mineral Chain of Custody</h2>
            <p>
              Track tantalum batches from extraction to manufacturing
              with tamper-evident blockchain records.
            </p>
          </div>

          <div className="hero-badge">
            <strong>Hyperledger Fabric</strong>
            <span>Permissioned Network</span>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span>Total Batches</span>
            <strong>5</strong>
            <small>Recorded on ledger</small>
          </div>

          <div className="stat-card">
            <span>Supply Chain Stages</span>
            <strong>3</strong>
            <small>Mine → Smelter → Manufacturer</small>
          </div>

          <div className="stat-card">
            <span>Flagged Batches</span>
            <strong>2</strong>
            <small>Risk records detected</small>
          </div>

          <div className="stat-card">
            <span>Network Status</span>
            <strong className="online">ONLINE</strong>
            <small>mychannel</small>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">TRACEABILITY</span>
                <h3>Supply Chain Flow</h3>
              </div>
            </div>

            <div className="flow">
              <div className="flow-step">
                <div className="flow-number">01</div>
                <div>
                  <strong>Mine</strong>
                  <p>Extraction</p>
                </div>
              </div>

              <div className="flow-line"></div>

              <div className="flow-step">
                <div className="flow-number">02</div>
                <div>
                  <strong>Smelter</strong>
                  <p>Merge / Split</p>
                </div>
              </div>

              <div className="flow-line"></div>

              <div className="flow-step">
                <div className="flow-number">03</div>
                <div>
                  <strong>Manufacturer</strong>
                  <p>Receipt</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">QUICK ACCESS</span>
                <h3>Batch Verification</h3>
              </div>
            </div>

            <div className="search-box">
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') verifyBatch();
                }}
                placeholder="Enter Batch ID (e.g. TB100)"
              />
              <button onClick={verifyBatch}>
                {loading ? 'Checking...' : 'Verify Batch'}
              </button>
            </div>

            <p className="helper">
              Query the blockchain ledger to verify batch history and
              contamination risk.
            </p>

            {error && (
              <div className="result error">
                <strong>Verification failed</strong>
                <p>{error}</p>
              </div>
            )}

            {batch && (
              <div className="result">
                <div className="result-header">
                  <strong>{batch.batchId}</strong>
                  <span className="tag verified">Found on Ledger</span>
                </div>

                <div className="risk-score">
                  <span>Contamination Risk Score</span>
                  <strong>{contaminationScore}</strong>
                  <small>
                    {contaminationScore >= 70
                      ? 'High Risk'
                      : contaminationScore >= 30
                      ? 'Moderate Risk'
                      : 'Low Risk'}
                  </small>
                </div>

                <div className="result-grid">
                  <div>
                    <span>Action</span>
                    <strong>{batch.action}</strong>
                  </div>

                  <div>
                    <span>Weight</span>
                    <strong>{batch.weight} kg</strong>
                  </div>

                  <div>
                    <span>Actor</span>
                    <strong>{batch.actorId}</strong>
                  </div>

                  <div>
                    <span>Parents</span>
                    <strong>{batch.parents?.length || 0}</strong>
                  </div>
                </div>

                {batch.receivedAt && (
                  <div className="receipt">
                    <span>Manufacturer Receipt</span>
                    <strong>Received</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="panel operations-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">MINE ROLE</span>
              <h3>Create Extraction Batch</h3>
            </div>

            <span className="ledger-label">ROLE: MINE</span>
          </div>

          <form className="operation-form" onSubmit={createBatch}>
            <div className="form-field">
              <label>Batch ID</label>
              <input
                type="text"
                placeholder="e.g. TB200"
                value={createForm.batchId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    batchId: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Actor ID</label>
              <input
                type="text"
                value={createForm.actorId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    actorId: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100"
                value={createForm.weight}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    weight: e.target.value,
                  })
                }
              />
            </div>

            <button className="operation-button" type="submit">
              {createLoading ? 'Recording...' : 'Create Batch'}
            </button>
          </form>

          {createMessage && (
            <div className="operation-success">
              {createMessage}
            </div>
          )}

          {createError && (
            <div className="operation-error">
              {createError}
            </div>
          )}
        </section>

        <section className="panel operations-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">SMELTER ROLE</span>
              <h3>Merge Batches</h3>
            </div>

            <span className="ledger-label">ROLE: SMELTER</span>
          </div>

          <form className="merge-form" onSubmit={mergeBatches}>
            <div className="form-field">
              <label>New Batch ID</label>
              <input
                type="text"
                placeholder="e.g. TB300"
                value={mergeForm.newBatchId}
                onChange={(e) =>
                  setMergeForm({
                    ...mergeForm,
                    newBatchId: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Actor ID</label>
              <input
                type="text"
                value={mergeForm.actorId}
                onChange={(e) =>
                  setMergeForm({
                    ...mergeForm,
                    actorId: e.target.value,
                  })
                }
              />
            </div>

            <div className="parent-heading">Parent Batch 1</div>

            <div className="form-field">
              <label>Batch ID</label>
              <input
                type="text"
                placeholder="e.g. TB001"
                value={mergeForm.parent1}
                onChange={(e) =>
                  setMergeForm({
                    ...mergeForm,
                    parent1: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Weight Contributed (kg)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100"
                value={mergeForm.weight1}
                onChange={(e) =>
                  setMergeForm({
                    ...mergeForm,
                    weight1: e.target.value,
                  })
                }
              />
            </div>

            <div className="parent-heading">Parent Batch 2</div>

            <div className="form-field">
              <label>Batch ID</label>
              <input
                type="text"
                placeholder="e.g. TB002"
                value={mergeForm.parent2}
                onChange={(e) =>
                  setMergeForm({
                    ...mergeForm,
                    parent2: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Weight Contributed (kg)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100"
                value={mergeForm.weight2}
                onChange={(e) =>
                  setMergeForm({
                    ...mergeForm,
                    weight2: e.target.value,
                  })
                }
              />
            </div>

            <button className="operation-button" type="submit">
              {mergeLoading ? 'Merging...' : 'Merge Batches'}
            </button>
          </form>

          {mergeMessage && (
            <div className="operation-success">
              {mergeMessage}
            </div>
          )}

          {mergeError && (
            <div className="operation-error">
              {mergeError}
            </div>
          )}
        </section>

        <section className="panel operations-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">SMELTER ROLE</span>
              <h3>Split Batch</h3>
            </div>

            <span className="ledger-label">ROLE: SMELTER</span>
          </div>

          <form className="split-form" onSubmit={splitBatch}>
            <div className="form-field">
              <label>Parent Batch ID</label>
              <input
                type="text"
                placeholder="e.g. TB300"
                value={splitForm.parentBatchId}
                onChange={(e) =>
                  setSplitForm({
                    ...splitForm,
                    parentBatchId: e.target.value,
                  })
                }
              />
            </div>

            <div className="split-children">
              <div className="parent-heading">Child Batch 1</div>

              <div className="form-field">
                <label>Batch ID</label>
                <input
                  type="text"
                  placeholder="e.g. TB301"
                  value={splitForm.child1}
                  onChange={(e) =>
                    setSplitForm({
                      ...splitForm,
                      child1: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={splitForm.weight1}
                  onChange={(e) =>
                    setSplitForm({
                      ...splitForm,
                      weight1: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="split-children">
              <div className="parent-heading">Child Batch 2</div>

              <div className="form-field">
                <label>Batch ID</label>
                <input
                  type="text"
                  placeholder="e.g. TB302"
                  value={splitForm.child2}
                  onChange={(e) =>
                    setSplitForm({
                      ...splitForm,
                      child2: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={splitForm.weight2}
                  onChange={(e) =>
                    setSplitForm({
                      ...splitForm,
                      weight2: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button className="operation-button" type="submit">
              {splitLoading ? 'Splitting...' : 'Split Batch'}
            </button>
          </form>

          {splitMessage && (
            <div className="operation-success">
              {splitMessage}
            </div>
          )}

          {splitError && (
            <div className="operation-error">
              {splitError}
            </div>
          )}
        </section>

        <section className="panel operations-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">MANUFACTURER ROLE</span>
              <h3>Record Batch Receipt</h3>
            </div>

            <span className="ledger-label">ROLE: MANUFACTURER</span>
          </div>

          <form className="operation-form" onSubmit={recordReceipt}>
            <div className="form-field">
              <label>Batch ID</label>
              <input
                type="text"
                placeholder="e.g. TB301"
                value={receiptForm.batchId}
                onChange={(e) =>
                  setReceiptForm({
                    ...receiptForm,
                    batchId: e.target.value,
                  })
                }
              />
            </div>

            <button className="operation-button" type="submit">
              {receiptLoading ? 'Recording...' : 'Record Receipt'}
            </button>
          </form>

          {receiptMessage && (
            <div className="operation-success">
              {receiptMessage}
            </div>
          )}

          {receiptError && (
            <div className="operation-error">
              {receiptError}
            </div>
          )}
        </section>

        <section className="panel operations-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">AUDITOR ROLE</span>
              <h3>Flag Batch</h3>
            </div>

            <span className="ledger-label">ROLE: AUDITOR</span>
          </div>

          <form className="flag-form" onSubmit={flagBatch}>
            <div className="form-field">
              <label>Batch ID</label>
              <input
                type="text"
                placeholder="e.g. TB200"
                value={flagForm.batchId}
                onChange={(e) =>
                  setFlagForm({
                    ...flagForm,
                    batchId: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Flag Type</label>
              <select
                value={flagForm.flagType}
                onChange={(e) =>
                  setFlagForm({
                    ...flagForm,
                    flagType: e.target.value,
                  })
                }
              >
                <option value="conflict-risk">Conflict Risk</option>
                <option value="critical-origin-risk">
                  Critical Origin Risk
                </option>
                <option value="supply-chain-risk">
                  Supply Chain Risk
                </option>
                <option value="compliance-risk">
                  Compliance Risk
                </option>
              </select>
            </div>

            <div className="form-field">
              <label>Severity (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={flagForm.severity}
                onChange={(e) =>
                  setFlagForm({
                    ...flagForm,
                    severity: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Dilutable</label>
              <select
                value={flagForm.dilutable}
                onChange={(e) =>
                  setFlagForm({
                    ...flagForm,
                    dilutable: e.target.value,
                  })
                }
              >
                <option value="true">Yes</option>
                <option value="false">No — Critical</option>
              </select>
            </div>

            <button className="operation-button" type="submit">
              {flagLoading ? 'Flagging...' : 'Flag Batch'}
            </button>
          </form>

          {flagMessage && (
            <div className="operation-success">
              {flagMessage}
            </div>
          )}

          {flagError && (
            <div className="operation-error">
              {flagError}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h3>Blockchain Records</h3>
            </div>

            <span className="ledger-label">IMMUTABLE LEDGER</span>
          </div>

          <div className="table">
            <div className="table-row table-heading">
              <span>Batch ID</span>
              <span>Action</span>
              <span>Actor</span>
              <span>Weight</span>
              <span>Status</span>
            </div>

            <div className="table-row">
              <span className="batch-id">TB101</span>
              <span>Split</span>
              <span>SMELTER001</span>
              <span>100 kg</span>
              <span className="tag verified">Verified</span>
            </div>

            <div className="table-row">
              <span className="batch-id">TB100</span>
              <span>Merge</span>
              <span>SMELTER001</span>
              <span>200 kg</span>
              <span className="tag risk">Risk: 45</span>
            </div>

            <div className="table-row">
              <span className="batch-id">TB002</span>
              <span>Extract</span>
              <span>Mine-01</span>
              <span>100 kg</span>
              <span className="tag risk">Flagged</span>
            </div>

            <div className="table-row">
              <span className="batch-id">TB001</span>
              <span>Extract</span>
              <span>Mine-01</span>
              <span>100 kg</span>
              <span className="tag risk">Flagged</span>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>Tantalum Traceability System</span>
        <span>Hyperledger Fabric • mychannel</span>
      </footer>
    </div>
  );
}

export default App;
