import { useState, useEffect } from "react";

const initialStudents = [
  { id: 1, name: "Aarav Sharma", room: "A-101", course: "JEE Advanced", phone: "9876543210", email: "aarav@email.com", joiningDate: "2024-07-15", exitDate: null, feeStatus: "paid", feeAmount: 12000, feeDueDate: "2025-03-10", lastPaid: "2025-02-10", leaveHistory: [{ from: "2025-01-10", to: "2025-01-15", reason: "Family function", status: "approved" }], currentLeave: null, photo: "AS" },
  { id: 2, name: "Priya Verma", room: "B-205", course: "NEET", phone: "9765432109", email: "priya@email.com", joiningDate: "2024-08-01", exitDate: null, feeStatus: "overdue", feeAmount: 10500, feeDueDate: "2025-02-28", lastPaid: "2025-01-28", leaveHistory: [], currentLeave: { from: "2025-03-01", to: "2025-03-07", reason: "Medical", status: "approved" }, photo: "PV" },
  { id: 3, name: "Rohan Gupta", room: "A-102", course: "JEE Mains", phone: "9654321098", email: "rohan@email.com", joiningDate: "2024-09-10", exitDate: null, feeStatus: "pending", feeAmount: 11000, feeDueDate: "2025-03-15", lastPaid: "2025-02-15", leaveHistory: [{ from: "2024-12-20", to: "2024-12-31", reason: "Winter break", status: "approved" }], currentLeave: null, photo: "RG" },
  { id: 4, name: "Sneha Patel", room: "C-301", course: "NEET", phone: "9543210987", email: "sneha@email.com", joiningDate: "2024-07-20", exitDate: null, feeStatus: "paid", feeAmount: 10500, feeDueDate: "2025-04-01", lastPaid: "2025-03-01", leaveHistory: [], currentLeave: null, photo: "SP" },
  { id: 5, name: "Vikram Singh", room: "B-206", course: "JEE Advanced", phone: "9432109876", email: "vikram@email.com", joiningDate: "2024-06-01", exitDate: "2025-02-28", feeStatus: "paid", feeAmount: 12000, feeDueDate: null, lastPaid: "2025-02-01", leaveHistory: [], currentLeave: null, photo: "VS" },
  { id: 6, name: "Anjali Mehta", room: "C-302", course: "Foundation", phone: "9321098765", email: "anjali@email.com", joiningDate: "2024-10-05", exitDate: null, feeStatus: "overdue", feeAmount: 9000, feeDueDate: "2025-02-20", lastPaid: "2025-01-20", leaveHistory: [], currentLeave: null, photo: "AM" },
];

const COLORS = {
  paid: { bg: "#e8f5e9", text: "#2e7d32", dot: "#43a047" },
  pending: { bg: "#fff8e1", text: "#f57f17", dot: "#ffb300" },
  overdue: { bg: "#fce4ec", text: "#c62828", dot: "#e53935" },
};

const avatarColors = ["#1565c0","#6a1b9a","#00695c","#e65100","#4527a0","#283593"];

export default function HostelDashboard() {
  const [students, setStudents] = useState(initialStudents);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newStudent, setNewStudent] = useState({ name:"", room:"", course:"", phone:"", email:"", joiningDate:"", feeAmount:"", feeDueDate:"" });
  const [leaveForm, setLeaveForm] = useState({ from:"", to:"", reason:"" });
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const notifs = [];
    students.forEach(s => {
      if (s.feeStatus === "overdue") notifs.push({ id: s.id+"_overdue", type:"overdue", msg: `${s.name} — fee overdue since ${s.feeDueDate}`, student: s.name });
      if (s.feeStatus === "pending") notifs.push({ id: s.id+"_pending", type:"pending", msg: `${s.name} — fee due on ${s.feeDueDate}`, student: s.name });
      if (s.currentLeave) notifs.push({ id: s.id+"_leave", type:"leave", msg: `${s.name} — on leave till ${s.currentLeave.to}`, student: s.name });
    });
    setNotifications(notifs);
  }, [students]);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  const activeStudents = students.filter(s => !s.exitDate);
  const overdueCount = students.filter(s => s.feeStatus === "overdue").length;
  const onLeaveCount = students.filter(s => s.currentLeave).length;
  const totalFeeCollected = students.filter(s=>s.feeStatus==="paid").reduce((a,s)=>a+s.feeAmount,0);

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.room.toLowerCase().includes(searchQuery.toLowerCase()) || s.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === "all" || s.feeStatus === filterStatus || (filterStatus === "active" && !s.exitDate) || (filterStatus === "exited" && s.exitDate);
    return matchSearch && matchFilter;
  });

  const handleAddStudent = () => {
    const s = { ...newStudent, id: Date.now(), feeStatus:"pending", leaveHistory:[], currentLeave:null, exitDate:null, photo: newStudent.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(), feeAmount: Number(newStudent.feeAmount) };
    setStudents([...students, s]);
    setShowAddModal(false);
    setNewStudent({ name:"", room:"", course:"", phone:"", email:"", joiningDate:"", feeAmount:"", feeDueDate:"" });
    showToast("Student added successfully!");
  };

  const handleMarkPaid = (id) => {
    setStudents(students.map(s => s.id===id ? {...s, feeStatus:"paid", lastPaid: new Date().toISOString().split("T")[0]} : s));
    showToast("Fee marked as paid!");
  };

  const handleApproveLeave = (id) => {
    setStudents(students.map(s => s.id===id ? {...s, currentLeave:{...leaveForm, status:"approved"}} : s));
    setShowLeaveModal(false);
    setLeaveForm({ from:"", to:"", reason:"" });
    showToast("Leave approved!");
  };

  const handleExitStudent = (id) => {
    setStudents(students.map(s => s.id===id ? {...s, exitDate: new Date().toISOString().split("T")[0]} : s));
    setSelectedStudent(null);
    showToast("Student exit recorded.");
  };

  const tabs = [
    { id:"dashboard", label:"Dashboard", icon:"⊞" },
    { id:"students", label:"Students", icon:"👤" },
    { id:"fees", label:"Fee Management", icon:"₹" },
    { id:"leave", label:"Leave Tracker", icon:"📋" },
  ];

  return (
    <div style={{ fontFamily:"'Lato', 'Segoe UI', sans-serif", background:"#f0f4f8", minHeight:"100vh", color:"#1a2332" }}>
      {/* Sidebar */}
      <div style={{ position:"fixed", left:0, top:0, bottom:0, width:220, background:"#0d1b2a", display:"flex", flexDirection:"column", zIndex:100 }}>
        <div style={{ padding:"28px 20px 20px", borderBottom:"1px solid #1e3a5f" }}>
          <div style={{ fontSize:11, color:"#5b8db8", letterSpacing:3, textTransform:"uppercase", marginBottom:6 }}>Institute</div>
          <div style={{ fontSize:17, fontWeight:700, color:"#fff", lineHeight:1.3 }}>Hostel & Fee<br/>Management</div>
        </div>
        <nav style={{ padding:"16px 0", flex:1 }}>
          {tabs.map(t => (
            <div key={t.id} onClick={()=>{ setActiveTab(t.id); setSelectedStudent(null); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", cursor:"pointer", background: activeTab===t.id ? "#1565c0" : "transparent", color: activeTab===t.id ? "#fff" : "#8aadcc", fontWeight: activeTab===t.id ? 600 : 400, fontSize:14, borderLeft: activeTab===t.id ? "3px solid #42a5f5" : "3px solid transparent", transition:"all 0.2s" }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>{t.label}
            </div>
          ))}
        </nav>
        <div style={{ padding:"16px 20px", borderTop:"1px solid #1e3a5f" }}>
          <div style={{ fontSize:11, color:"#5b8db8" }}>Logged in as</div>
          <div style={{ fontSize:13, color:"#fff", fontWeight:600, marginTop:2 }}>Admin</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft:220, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        {/* Topbar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#1a2332" }}>
            {tabs.find(t=>t.id===activeTab)?.label}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ position:"relative" }}>
              <button onClick={()=>setShowNotifPanel(!showNotifPanel)} style={{ background:"#f0f4f8", border:"none", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", gap:6 }}>
                🔔 <span style={{ background:"#e53935", color:"#fff", borderRadius:10, fontSize:11, padding:"1px 6px", fontWeight:700 }}>{notifications.length}</span>
              </button>
              {showNotifPanel && (
                <div style={{ position:"absolute", right:0, top:46, width:320, background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:200, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:14 }}>Notifications</div>
                  {notifications.length===0 && <div style={{ padding:18, color:"#94a3b8", fontSize:13 }}>No notifications</div>}
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding:"12px 18px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:18 }}>{n.type==="overdue"?"🔴":n.type==="pending"?"🟡":"🟢"}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{n.type==="overdue"?"Fee Overdue":n.type==="pending"?"Fee Due Soon":"On Leave"}</div>
                        <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{n.msg}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={()=>setShowAddModal(true)} style={{ background:"#1565c0", color:"#fff", border:"none", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontWeight:600, fontSize:14 }}>+ Add Student</button>
          </div>
        </div>

        <div style={{ padding:32, flex:1 }}>

          {/* DASHBOARD TAB */}
          {activeTab==="dashboard" && (
            <div>
              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:28 }}>
                {[
                  { label:"Total Students", value: students.length, sub:`${activeStudents.length} currently active`, icon:"👥", color:"#1565c0" },
                  { label:"Fee Overdue", value: overdueCount, sub:"Requires immediate action", icon:"⚠️", color:"#c62828" },
                  { label:"On Leave", value: onLeaveCount, sub:"Students away right now", icon:"🏠", color:"#f57f17" },
                  { label:"Fee Collected", value:`₹${(totalFeeCollected/1000).toFixed(0)}K`, sub:"This cycle", icon:"✅", color:"#2e7d32" },
                ].map((stat,i) => (
                  <div key={i} style={{ background:"#fff", borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", borderLeft:`4px solid ${stat.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontSize:12, color:"#64748b", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:6 }}>{stat.label}</div>
                        <div style={{ fontSize:28, fontWeight:800, color:"#1a2332" }}>{stat.value}</div>
                        <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{stat.sub}</div>
                      </div>
                      <span style={{ fontSize:28 }}>{stat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent activity + overdue */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Fee Status Overview</div>
                  {["paid","pending","overdue"].map(status => {
                    const count = students.filter(s=>s.feeStatus===status).length;
                    const pct = Math.round((count/students.length)*100);
                    return (
                      <div key={status} style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <span style={{ fontSize:13, fontWeight:600, textTransform:"capitalize", color: COLORS[status].text }}>{status}</span>
                          <span style={{ fontSize:13, color:"#64748b" }}>{count} students ({pct}%)</span>
                        </div>
                        <div style={{ background:"#f1f5f9", borderRadius:6, height:8, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background: COLORS[status].dot, borderRadius:6, transition:"width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Overdue Alerts</div>
                  {students.filter(s=>s.feeStatus==="overdue").length === 0
                    ? <div style={{ color:"#94a3b8", fontSize:13 }}>No overdue fees 🎉</div>
                    : students.filter(s=>s.feeStatus==="overdue").map(s => (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <div style={{ width:38, height:38, borderRadius:"50%", background: avatarColors[s.id%avatarColors.length], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13 }}>{s.photo}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{s.name}</div>
                        <div style={{ fontSize:12, color:"#94a3b8" }}>Due: {s.feeDueDate} · ₹{s.feeAmount.toLocaleString()}</div>
                      </div>
                      <button onClick={()=>handleMarkPaid(s.id)} style={{ background:"#e8f5e9", color:"#2e7d32", border:"none", borderRadius:6, padding:"5px 10px", fontSize:12, cursor:"pointer", fontWeight:600 }}>Mark Paid</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent joinings */}
              <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", marginTop:20 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Recent Joinings</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ color:"#64748b", borderBottom:"2px solid #f1f5f9" }}>
                      {["Student","Room","Course","Joining Date","Fee Status"].map(h=>(
                        <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...students].sort((a,b)=>new Date(b.joiningDate)-new Date(a.joiningDate)).slice(0,5).map(s=>(
                      <tr key={s.id} style={{ borderBottom:"1px solid #f8fafc", cursor:"pointer" }} onClick={()=>{ setSelectedStudent(s); setActiveTab("students"); }}>
                        <td style={{ padding:"10px 12px" }}><div style={{ display:"flex", alignItems:"center", gap:10 }}><div style={{ width:32, height:32, borderRadius:"50%", background: avatarColors[s.id%avatarColors.length], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:12 }}>{s.photo}</div><span style={{ fontWeight:600 }}>{s.name}</span></div></td>
                        <td style={{ padding:"10px 12px", color:"#475569" }}>{s.room}</td>
                        <td style={{ padding:"10px 12px", color:"#475569" }}>{s.course}</td>
                        <td style={{ padding:"10px 12px", color:"#475569" }}>{s.joiningDate}</td>
                        <td style={{ padding:"10px 12px" }}><span style={{ background: COLORS[s.feeStatus].bg, color: COLORS[s.feeStatus].text, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, textTransform:"capitalize" }}>{s.feeStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab==="students" && !selectedStudent && (
            <div>
              <div style={{ display:"flex", gap:12, marginBottom:20 }}>
                <input placeholder="Search by name, room or course..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ flex:1, padding:"10px 16px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, outline:"none" }} />
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, background:"#fff", outline:"none" }}>
                  <option value="all">All Students</option>
                  <option value="active">Active</option>
                  <option value="exited">Exited</option>
                  <option value="paid">Fee Paid</option>
                  <option value="pending">Fee Pending</option>
                  <option value="overdue">Fee Overdue</option>
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {filteredStudents.map(s => (
                  <div key={s.id} onClick={()=>setSelectedStudent(s)} style={{ background:"#fff", borderRadius:12, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", cursor:"pointer", transition:"box-shadow 0.2s", border:"1px solid #f1f5f9" }}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(21,101,192,0.12)"}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.07)"}>
                    <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:14 }}>
                      <div style={{ width:48, height:48, borderRadius:"50%", background: avatarColors[s.id%avatarColors.length], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:16 }}>{s.photo}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>{s.name}</div>
                        <div style={{ fontSize:12, color:"#64748b" }}>Room {s.room} · {s.course}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>Joined {s.joiningDate}</div>
                        {s.exitDate && <div style={{ fontSize:11, color:"#e53935", marginTop:2 }}>Exited {s.exitDate}</div>}
                        {s.currentLeave && <div style={{ fontSize:11, color:"#f57f17", marginTop:2 }}>On leave till {s.currentLeave.to}</div>}
                      </div>
                      <span style={{ background: s.exitDate ? "#f1f5f9" : COLORS[s.feeStatus].bg, color: s.exitDate ? "#94a3b8" : COLORS[s.feeStatus].text, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, textTransform:"capitalize" }}>
                        {s.exitDate ? "Exited" : s.feeStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STUDENT DETAIL */}
          {activeTab==="students" && selectedStudent && (
            <div>
              <button onClick={()=>setSelectedStudent(null)} style={{ background:"none", border:"none", color:"#1565c0", cursor:"pointer", fontSize:14, fontWeight:600, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>← Back to Students</button>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {/* Profile */}
                <div style={{ background:"#fff", borderRadius:12, padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ display:"flex", gap:18, alignItems:"center", marginBottom:24, paddingBottom:20, borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ width:64, height:64, borderRadius:"50%", background: avatarColors[selectedStudent.id%avatarColors.length], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:22 }}>{selectedStudent.photo}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:20 }}>{selectedStudent.name}</div>
                      <div style={{ color:"#64748b", fontSize:13, marginTop:2 }}>Room {selectedStudent.room} · {selectedStudent.course}</div>
                      {selectedStudent.exitDate && <div style={{ fontSize:12, color:"#e53935", marginTop:4, fontWeight:600 }}>EXITED</div>}
                    </div>
                  </div>
                  {[["📞 Phone", selectedStudent.phone], ["📧 Email", selectedStudent.email], ["📅 Joining Date", selectedStudent.joiningDate], ["🚪 Exit Date", selectedStudent.exitDate || "—"]].map(([l,v])=>(
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f8fafc", fontSize:14 }}>
                      <span style={{ color:"#64748b" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  {!selectedStudent.exitDate && (
                    <button onClick={()=>handleExitStudent(selectedStudent.id)} style={{ marginTop:20, background:"#fce4ec", color:"#c62828", border:"none", borderRadius:8, padding:"10px 18px", cursor:"pointer", fontWeight:600, fontSize:13, width:"100%" }}>Record Student Exit</button>
                  )}
                </div>

                {/* Fee info */}
                <div style={{ background:"#fff", borderRadius:12, padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Fee Information</div>
                  <div style={{ background: COLORS[selectedStudent.feeStatus].bg, borderRadius:10, padding:16, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:12, color: COLORS[selectedStudent.feeStatus].text, fontWeight:600, textTransform:"uppercase" }}>Fee Status</div>
                      <div style={{ fontSize:22, fontWeight:800, color: COLORS[selectedStudent.feeStatus].text, marginTop:2, textTransform:"capitalize" }}>{selectedStudent.feeStatus}</div>
                    </div>
                    <div style={{ fontSize:28, fontWeight:800, color: COLORS[selectedStudent.feeStatus].text }}>₹{selectedStudent.feeAmount.toLocaleString()}</div>
                  </div>
                  {[["Due Date", selectedStudent.feeDueDate || "—"], ["Last Paid", selectedStudent.lastPaid || "—"]].map(([l,v])=>(
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f8fafc", fontSize:14 }}>
                      <span style={{ color:"#64748b" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  {selectedStudent.feeStatus !== "paid" && (
                    <button onClick={()=>handleMarkPaid(selectedStudent.id)} style={{ marginTop:20, background:"#1565c0", color:"#fff", border:"none", borderRadius:8, padding:"10px 18px", cursor:"pointer", fontWeight:600, fontSize:13, width:"100%" }}>✓ Mark Fee as Paid</button>
                  )}
                </div>

                {/* Leave info */}
                <div style={{ background:"#fff", borderRadius:12, padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", gridColumn:"1/-1" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>Leave Records</div>
                    {!selectedStudent.exitDate && (
                      <button onClick={()=>setShowLeaveModal(true)} style={{ background:"#e3f2fd", color:"#1565c0", border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontWeight:600, fontSize:13 }}>+ Grant Leave</button>
                    )}
                  </div>
                  {selectedStudent.currentLeave && (
                    <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:10, padding:14, marginBottom:14, fontSize:13 }}>
                      <div style={{ fontWeight:700, color:"#f57f17", marginBottom:4 }}>Currently On Leave</div>
                      <div>{selectedStudent.currentLeave.from} → {selectedStudent.currentLeave.to} · {selectedStudent.currentLeave.reason}</div>
                    </div>
                  )}
                  {selectedStudent.leaveHistory.length === 0 && !selectedStudent.currentLeave
                    ? <div style={{ color:"#94a3b8", fontSize:13 }}>No leave history</div>
                    : selectedStudent.leaveHistory.map((l,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #f8fafc", fontSize:13 }}>
                      <span style={{ background:"#e8f5e9", color:"#2e7d32", padding:"3px 10px", borderRadius:20, fontWeight:600, fontSize:12 }}>Completed</span>
                      <span>{l.from} → {l.to}</span>
                      <span style={{ color:"#64748b" }}>{l.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FEE MANAGEMENT TAB */}
          {activeTab==="fees" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
                {["paid","pending","overdue"].map(status=>{
                  const list = students.filter(s=>s.feeStatus===status);
                  return (
                    <div key={status} style={{ background:"#fff", borderRadius:12, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", borderTop:`3px solid ${COLORS[status].dot}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                        <div style={{ fontWeight:700, fontSize:14, textTransform:"capitalize", color: COLORS[status].text }}>{status}</div>
                        <span style={{ background: COLORS[status].bg, color: COLORS[status].text, fontWeight:700, borderRadius:20, padding:"2px 12px", fontSize:13 }}>{list.length}</span>
                      </div>
                      {list.map(s=>(
                        <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f8fafc", fontSize:13 }}>
                          <div>
                            <div style={{ fontWeight:600 }}>{s.name}</div>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>₹{s.feeAmount.toLocaleString()} {status!=="paid"?`· Due: ${s.feeDueDate}`:""}</div>
                          </div>
                          {status!=="paid" && <button onClick={()=>handleMarkPaid(s.id)} style={{ background:"#1565c0", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontWeight:600 }}>Pay</button>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Send reminders section */}
              <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>📣 Send Fee Reminders</div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  {["overdue","pending"].map(status=>(
                    <button key={status} onClick={()=>showToast(`Reminders sent to all ${status} students!`)} style={{ background: status==="overdue"?"#fce4ec":"#fff8e1", color: COLORS[status].text, border:"none", borderRadius:8, padding:"12px 20px", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                      Send to All {status.charAt(0).toUpperCase()+status.slice(1)} ({students.filter(s=>s.feeStatus===status).length})
                    </button>
                  ))}
                  <button onClick={()=>showToast("Reminders sent to all students!")} style={{ background:"#e3f2fd", color:"#1565c0", border:"none", borderRadius:8, padding:"12px 20px", cursor:"pointer", fontWeight:600, fontSize:14 }}>Send to All Students</button>
                </div>
              </div>
            </div>
          )}

          {/* LEAVE TRACKER TAB */}
          {activeTab==="leave" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Currently On Leave</div>
                  {students.filter(s=>s.currentLeave).length === 0
                    ? <div style={{ color:"#94a3b8", fontSize:13 }}>No students on leave</div>
                    : students.filter(s=>s.currentLeave).map(s=>(
                    <div key={s.id} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #f8fafc", alignItems:"center" }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", background: avatarColors[s.id%avatarColors.length], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14 }}>{s.photo}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{s.name}</div>
                        <div style={{ fontSize:12, color:"#64748b" }}>Room {s.room} · {s.currentLeave.from} → {s.currentLeave.to}</div>
                        <div style={{ fontSize:12, color:"#94a3b8" }}>{s.currentLeave.reason}</div>
                      </div>
                      <span style={{ background:"#fff8e1", color:"#f57f17", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 }}>Active</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Leave History (All)</div>
                  {students.flatMap(s=>s.leaveHistory.map(l=>({...l, name:s.name, room:s.room, photo:s.photo, sid:s.id}))).length === 0
                    ? <div style={{ color:"#94a3b8", fontSize:13 }}>No leave history</div>
                    : students.flatMap(s=>s.leaveHistory.map(l=>({...l, name:s.name, room:s.room, photo:s.photo, sid:s.id}))).map((l,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #f8fafc", alignItems:"center" }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", background: avatarColors[l.sid%avatarColors.length], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14 }}>{l.photo}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{l.name}</div>
                        <div style={{ fontSize:12, color:"#64748b" }}>{l.from} → {l.to} · {l.reason}</div>
                      </div>
                      <span style={{ background:"#e8f5e9", color:"#2e7d32", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 }}>Done</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:32, width:500, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:20 }}>Add New Student</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {[["Full Name","name","text"],["Room Number","room","text"],["Course","course","text"],["Phone","phone","tel"],["Email","email","email"],["Joining Date","joiningDate","date"],["Monthly Fee (₹)","feeAmount","number"],["Fee Due Date","feeDueDate","date"]].map(([label,key,type])=>(
                <div key={key}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:5, fontWeight:600 }}>{label}</div>
                  <input type={type} value={newStudent[key]} onChange={e=>setNewStudent({...newStudent,[key]:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:12, marginTop:20 }}>
              <button onClick={handleAddStudent} style={{ flex:1, background:"#1565c0", color:"#fff", border:"none", borderRadius:8, padding:"11px", cursor:"pointer", fontWeight:600 }}>Add Student</button>
              <button onClick={()=>setShowAddModal(false)} style={{ flex:1, background:"#f1f5f9", color:"#475569", border:"none", borderRadius:8, padding:"11px", cursor:"pointer", fontWeight:600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && selectedStudent && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:32, width:400, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:20 }}>Grant Leave — {selectedStudent.name}</div>
            {[["From","from","date"],["To","to","date"],["Reason","reason","text"]].map(([label,key,type])=>(
              <div key={key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, color:"#64748b", marginBottom:5, fontWeight:600 }}>{label}</div>
                <input type={type} value={leaveForm[key]} onChange={e=>setLeaveForm({...leaveForm,[key]:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <button onClick={()=>handleApproveLeave(selectedStudent.id)} style={{ flex:1, background:"#1565c0", color:"#fff", border:"none", borderRadius:8, padding:"11px", cursor:"pointer", fontWeight:600 }}>Approve Leave</button>
              <button onClick={()=>setShowLeaveModal(false)} style={{ flex:1, background:"#f1f5f9", color:"#475569", border:"none", borderRadius:8, padding:"11px", cursor:"pointer", fontWeight:600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)", background:"#1a2332", color:"#fff", padding:"12px 24px", borderRadius:10, fontWeight:600, fontSize:14, zIndex:400, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
          ✓ {toastMsg}
        </div>
      )}
    </div>
  );
}
