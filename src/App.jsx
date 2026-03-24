import React, { useState, useEffect, useCallback } from 'react';
import './index.css'; // CRITICAL: This must be present for your local CSS to work
import { 
  User, 
  MessageSquare, 
  Calendar, 
  Clock, 
  CreditCard, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Download,
  ShieldCheck,
  X,
  Search,
  ChevronLeft
} from 'lucide-react';

/**
 * LIVE CONFIGURATION
 */
const RAZORPAY_KEY_ID = "rzp_live_Q1kOja5eGeifXq"; 

export default function App() {
  const [step, setStep] = useState(1); // 1: Form, 2: Payment, 3: Success, 4: Admin
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [titleClicks, setTitleClicks] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  // Local state for admissions
  const [admissions, setAdmissions] = useState([
    { id: 1, studentName: "Sample Student", demoFeedback: "Highly focused, ready for intermediate level.", preferredDays: ["Monday", "Wednesday"], preferredTime: "4:00 PM - 5:00 PM", status: "Paid", date: "2026-03-24" }
  ]);

  const [formData, setFormData] = useState({
    studentName: '',
    demoFeedback: '',
    preferredDays: [],
    preferredTime: '',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM', '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM'];

  /**
   * Production-Hardened Script Loader
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadScript = () => {
      if (window.Razorpay) {
        setIsScriptLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        console.log("Razorpay SDK loaded successfully");
        setIsScriptLoaded(true);
      };
      script.onerror = () => {
        console.error("Razorpay SDK failed to load");
        setError("Payment gateway failed to initialize. Please check your connection.");
      };
      document.body.appendChild(script);
    };

    loadScript();
  }, []);

  const handleSecretAccess = () => {
    setTitleClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setStep(4);
        return 0;
      }
      return next;
    });
    
    const timer = setTimeout(() => setTitleClicks(0), 2000);
    return () => clearTimeout(timer);
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const isSelected = prev.preferredDays.includes(day);
      if (!isSelected && prev.preferredDays.length >= 2) return prev; 
      return {
        ...prev,
        preferredDays: isSelected
          ? prev.preferredDays.filter(d => d !== day)
          : [...prev.preferredDays, day]
      };
    });
  };

  const validateForm = () => {
    if (!formData.studentName.trim() || !formData.demoFeedback.trim()) {
      setError("Please provide student name and feedback.");
      return false;
    }
    if (formData.preferredDays.length !== 2) {
      setError("Please select exactly 2 days.");
      return false;
    }
    if (!formData.preferredTime) {
      setError("Please select a time slot.");
      return false;
    }
    setError(null);
    return true;
  };

  const handlePayment = async () => {
    if (!isScriptLoaded || !window.Razorpay) {
      setError("Payment gateway is still loading. Please try again in a few seconds.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: 10000, // ₹100
        currency: "INR",
        name: "Imperial Chess World",
        description: "Admission Registration Fee",
        image: "/ICW logo-1.png", // Added leading slash for root-relative production path
        handler: function (response) {
          const newEntry = {
            ...formData,
            id: Date.now(),
            status: "Paid",
            date: new Date().toISOString().split('T')[0],
            paymentId: response.razorpay_payment_id
          };
          setAdmissions(prev => [newEntry, ...prev]);
          setStep(3);
          setLoading(false);
        },
        prefill: {
          name: formData.studentName,
          email: "support@imperialchessworld.com",
          contact: "9999999999"
        },
        theme: { color: "#ed1c24" },
        modal: { 
          ondismiss: () => setLoading(false)
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Something went wrong with the payment window.");
      setLoading(false);
    }
  };

  const downloadCSV = useCallback((data, filename) => {
    const headers = ["Name", "Feedback", "Schedule", "Time", "Status", "Date"];
    const rows = data.map(a => [
      `"${a.studentName}"`,
      `"${a.demoFeedback.replace(/"/g, '""')}"`,
      `"${a.preferredDays.join(" & ")}"`,
      `"${a.preferredTime}"`,
      `"${a.status}"`,
      `"${a.date}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const filteredAdmissions = admissions.filter(a => 
    a.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-100 antialiased overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-200/50 to-transparent -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <header 
          className="text-center mb-8 md:mb-12 cursor-pointer transition-transform active:scale-95" 
          onClick={handleSecretAccess}
        >
          <div className="inline-block p-2 rounded-3xl mb-4 bg-white shadow-sm border border-slate-100">
            <img src="/ICW logo-1.png" alt="ICW Logo" className="h-20 md:h-28 w-auto object-contain" />
          </div>
          <h1 className="text-3xl md:text-5xl font-[900] tracking-tight text-slate-800 leading-tight">
            IMPERIAL <span className="text-[#ed1c24]">CHESS</span> WORLD
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
            {step === 4 ? "Administrative Dashboard" : "Admission Portal"}
          </div>
        </header>

        {step === 4 ? (
          <main className="bg-white border border-slate-200 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button onClick={() => setStep(1)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-800">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="font-black uppercase tracking-widest text-sm text-slate-800">Enrollment Data</h2>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search students..."
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#ed1c24] transition-all"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => downloadCSV(admissions, 'ICW_All_Students.csv')} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Student</th>
                    <th className="px-8 py-5">Schedule</th>
                    <th className="px-8 py-5">Payment</th>
                    <th className="px-8 py-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAdmissions.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-extrabold text-slate-800">{adm.studentName}</div>
                        <div className="text-[10px] text-slate-400 italic mt-1">{adm.demoFeedback}</div>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-700">{adm.preferredDays.join(" & ")}<br/><span className="text-[10px] text-slate-400 font-normal">{adm.preferredTime}</span></td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full border border-green-100">Paid</span>
                      </td>
                      <td className="px-8 py-6 text-[11px] font-bold text-slate-400 tabular-nums">{adm.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        ) : (
          <main className="max-w-xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden">
            <nav className="flex border-b border-slate-100 bg-slate-50/30">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex-1 py-5 text-center text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'text-[#ed1c24] bg-white border-b-4 border-[#ed1c24]' : 'text-slate-300'}`}>
                  {s === 1 ? 'Details' : s === 2 ? 'Payment' : 'Success'}
                </div>
              ))}
            </nav>

            <div className="p-6 md:p-12">
              {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-bold">{error}</span>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Student Full Name</label>
                    <input type="text" value={formData.studentName} onChange={(e) => setFormData(p => ({...p, studentName: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 focus:border-[#ed1c24] focus:bg-white outline-none font-bold text-slate-800" placeholder="Magnus Carlsen" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Demo Feedback</label>
                    <textarea value={formData.demoFeedback} onChange={(e) => setFormData(p => ({...p, demoFeedback: e.target.value}))} rows="3" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 focus:border-[#ed1c24] focus:bg-white outline-none resize-none font-bold text-slate-800" placeholder="Trial session notes..." />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex justify-between">Select 2 Days <span>{formData.preferredDays.length}/2</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {days.map(day => (
                        <button key={day} onClick={() => toggleDay(day)} className={`py-4 rounded-2xl text-[10px] font-black border-2 transition-all ${formData.preferredDays.includes(day) ? 'bg-[#ed1c24] border-[#ed1c24] text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400'}`}>
                          {day.substring(0, 3).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Time Slot</label>
                    <select value={formData.preferredTime} onChange={(e) => setFormData(p => ({...p, preferredTime: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800">
                      <option value="">Select a time...</option>
                      {times.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button onClick={() => validateForm() && setStep(2)} className="w-full bg-[#ed1c24] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-[#d01921] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                    Review Admission <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="text-center space-y-10 py-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-[#ed1c24]">
                    <CreditCard className="w-10 h-10 text-[#ed1c24]" />
                  </div>
                  <div className="bg-slate-50 rounded-[2.5rem] p-8 text-left border border-slate-100 space-y-4 mx-auto max-w-sm">
                    <div className="text-xl font-[900] text-slate-800 tracking-tight">{formData.studentName}</div>
                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total Fee</span> 
                      <span className="text-4xl font-black text-[#ed1c24]">₹100</span>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <button onClick={handlePayment} disabled={loading} className="w-full bg-[#ed1c24] text-white font-black py-6 rounded-3xl flex justify-center items-center gap-4 shadow-2xl hover:bg-[#d01921] disabled:opacity-50 transition-all uppercase tracking-widest text-xs">
                      {loading ? <Loader2 className="animate-spin" /> : "Authorize Payment Now"}
                    </button>
                    <button onClick={() => setStep(1)} className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Return to Edit</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="text-center space-y-10 py-10 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto border-8 border-white shadow-2xl animate-bounce">
                    <CheckCircle2 className="w-14 h-14 text-green-500" />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">CHECK<span className="text-[#ed1c24]">MATE</span>!</h2>
                  <div className="space-y-4 pt-6 max-w-sm mx-auto">
                    <button onClick={() => downloadCSV([admissions[0]], `ICW_Receipt_${formData.studentName.replace(/\s+/g, '_')}.csv`)} className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl flex justify-center items-center gap-4 shadow-xl uppercase tracking-widest text-[10px]">
                      <Download className="w-5 h-5 text-[#ed1c24]" /> Download Admission Receipt
                    </button>
                    <button onClick={() => window.location.reload()} className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] pt-4">Process Another Admission</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}