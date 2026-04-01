import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Dashboard = ({ user }) => {
  const [docs, setDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const departments = ['All', 'Security', 'Data', 'System', 'Development'];

  const fetchDocs = async () => {
    try {
      const res = await axios.get('/api/documents');
      setDocs(res.data);
    } catch (err) {
      toast.error("Failed to load documents");
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/documents/${id}/approve`);
      toast.success("ITDOC Archive Updated: Document Approved");
      fetchDocs();
    } catch (err) {
      toast.error("Unauthorized: Only Adam can approve.");
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "All" || doc.department === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="dashboard-container p-8 bg-gray-50 min-h-screen">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6 text-slate-800">TITAN ULTRA CENTRAL COMMAND</h1>

      {/* 🔍 Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <input 
          type="text" 
          placeholder="Search archives..." 
          className="p-3 rounded-lg border shadow-sm w-full lg:w-1/3 outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex bg-white p-1 rounded-lg shadow-sm border overflow-x-auto">
          {departments.map(dept => (
            <button 
              key={dept}
              onClick={() => setActiveTab(dept)}
              className={`px-6 py-2 rounded-md transition-all ${activeTab === dept ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* 📄 Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg truncate">{doc.title}</h3>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${doc.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {doc.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{doc.description}</p>
            
            <div className="flex gap-2">
              <a href={doc.fileUrl} target="_blank" className="flex-1 text-center bg-slate-800 text-white py-2 rounded-md text-sm hover:bg-slate-700">View File</a>
              
              {/* ADMIN ONLY APPROVE BUTTON */}
              {user?.email === 'adamouchkouk16@gmail.com' && doc.status === 'pending' && (
                <button 
                  onClick={() => handleApprove(doc._id)}
                  className="flex-1 bg-green-500 text-white py-2 rounded-md text-sm hover:bg-green-600 font-bold"
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
