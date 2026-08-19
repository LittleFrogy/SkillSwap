import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, GraduationCap, CheckCircle, Plus, Trash2, ArrowRight } from 'lucide-react';

const API_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')}/api/listings`;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [uniqueSkills, setUniqueSkills] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/signin');
      return;
    }
    axios.get(`${API_URL}/skills/unique`)
      .then(res => setUniqueSkills(res.data))
      .catch(err => console.error("Error fetching unique skills", err));
  }, [userId, navigate]);

  const emptyTeach = { skill: '', proficiencyLevel: 'Intermediate', description: '', weeklyAvailability: '', days: [], times: [] };
  const emptyLearn = { skill: '', proficiencyLevel: 'Beginner', description: '', weeklyAvailability: '', days: [], times: [] };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const TIMES = ['Morning', 'Noon', 'Afternoon', 'Evening', 'Night'];

  const toggleArrayItem = (array, item) => {
    return array?.includes(item) 
      ? array.filter(i => i !== item) 
      : [...(array || []), item];
  };

  const [teachList, setTeachList] = useState([{...emptyTeach}]);
  const [learnList, setLearnList] = useState([{...emptyLearn}]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const addTeach = () => setTeachList([...teachList, {...emptyTeach}]);
  const addLearn = () => setLearnList([...learnList, {...emptyLearn}]);
  
  const removeTeach = (idx) => setTeachList(teachList.filter((_, i) => i !== idx));
  const removeLearn = (idx) => setLearnList(learnList.filter((_, i) => i !== idx));

  const updateTeach = (idx, field, value) => {
    const updated = [...teachList];
    updated[idx][field] = value;
    setTeachList(updated);
  };
  
  const updateLearn = (idx, field, value) => {
    const updated = [...learnList];
    updated[idx][field] = value;
    setLearnList(updated);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formatPayload = (item, type) => {
        const derivedAvailability = item.days?.length > 0 || item.times?.length > 0 
          ? `${item.days?.join(', ')} ${item.times?.length > 0 ? `(${item.times.join(', ')})` : ''}`
          : 'Flexible';
        return { ...item, type, userId, weeklyAvailability: derivedAvailability };
      };

      const teachPromises = teachList
        .filter(t => t.skill.trim())
        .map(t => axios.post(API_URL, formatPayload(t, 'teach')));
        
      const learnPromises = learnList
        .filter(l => l.skill.trim())
        .map(l => axios.post(API_URL, formatPayload(l, 'learn')));

      await Promise.all([...teachPromises, ...learnPromises]);
      setStep(4);
    } catch (error) {
      console.error("Error submitting listings", error);
      alert("Something went wrong saving your skills.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyTeachSkill = teachList.some(t => t.skill.trim());
  const hasAnyLearnSkill = learnList.some(l => l.skill.trim());

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-20">
      
      {/* Progress Bar */}
      <div className="bg-slate-100 h-2 w-full">
        <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      <datalist id="skills-list">
        {uniqueSkills.map(skill => (
          <option key={skill} value={skill} />
        ))}
      </datalist>

      <div className="p-8">
        {step === 1 && (
          <div className="text-center space-y-6 py-12">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">👋</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome to SkillSwap!</h1>
            <p className="text-slate-600 text-lg max-w-lg mx-auto">
              Let's set up your profile. We just need to know two things: What you can teach, and what you want to learn. You can always add more later!
            </p>
            <button 
              onClick={handleNext}
              className="mt-6 px-8 py-3.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-sm transition-all text-lg flex items-center gap-2 mx-auto"
            >
              Let's Get Started <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <GraduationCap size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What can you teach?</h2>
                <p className="text-slate-500">Share your expertise with the community.</p>
              </div>
            </div>

            <div className="space-y-6">
              {teachList.map((data, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative">
                  {teachList.length > 1 && (
                    <button onClick={() => removeTeach(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                      <Trash2 size={16} />
                    </button>
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Skill #{idx + 1} (e.g. React, Guitar, Spanish)</label>
                    <input 
                      type="text" 
                      list="skills-list"
                      className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={data.skill}
                      onChange={e => updateTeach(idx, 'skill', e.target.value)}
                      placeholder="What are you good at?"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Proficiency Level</label>
                      <select 
                        className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={data.proficiencyLevel}
                        onChange={e => updateTeach(idx, 'proficiencyLevel', e.target.value)}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Weekly Availability (Days)</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button 
                          key={day} 
                          type="button" 
                          onClick={() => updateTeach(idx, 'days', toggleArrayItem(data.days, day))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${data.days?.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Timings</label>
                    <div className="flex flex-wrap gap-2">
                      {TIMES.map(time => (
                        <button 
                          key={time} 
                          type="button" 
                          onClick={() => updateTeach(idx, 'times', toggleArrayItem(data.times, time))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${data.times?.includes(time) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Short Description</label>
                    <textarea 
                      className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows="2"
                      value={data.description}
                      onChange={e => updateTeach(idx, 'description', e.target.value)}
                      placeholder="Describe what you can offer in a session..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addTeach} className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-300 transition-colors">
              <Plus size={20} /> Add another skill to teach
            </button>

            <div className="flex justify-between pt-8 mt-4 border-t border-slate-100">
              <button onClick={handlePrev} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-full font-semibold transition-colors">Back</button>
              <button 
                onClick={handleNext} 
                className={`px-8 py-2.5 rounded-full font-semibold transition-all shadow-sm ${hasAnyTeachSkill ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {hasAnyTeachSkill ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <BookOpen size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What do you want to learn?</h2>
                <p className="text-slate-500">Find someone to help you grow.</p>
              </div>
            </div>

            <div className="space-y-6">
              {learnList.map((data, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative">
                  {learnList.length > 1 && (
                    <button onClick={() => removeLearn(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Skill #{idx + 1} (e.g. Python, UI Design)</label>
                    <input 
                      type="text" 
                      list="skills-list"
                      className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={data.skill}
                      onChange={e => updateLearn(idx, 'skill', e.target.value)}
                      placeholder="What do you want to master?"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Your Current Level</label>
                      <select 
                        className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={data.proficiencyLevel}
                        onChange={e => updateLearn(idx, 'proficiencyLevel', e.target.value)}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Weekly Availability (Days)</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button 
                          key={day} 
                          type="button" 
                          onClick={() => updateLearn(idx, 'days', toggleArrayItem(data.days, day))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${data.days?.includes(day) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Timings</label>
                    <div className="flex flex-wrap gap-2">
                      {TIMES.map(time => (
                        <button 
                          key={time} 
                          type="button" 
                          onClick={() => updateLearn(idx, 'times', toggleArrayItem(data.times, time))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${data.times?.includes(time) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Why do you want to learn this?</label>
                    <textarea 
                      className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows="2"
                      value={data.description}
                      onChange={e => updateLearn(idx, 'description', e.target.value)}
                      placeholder="Share your goals..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addLearn} className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-300 transition-colors">
              <Plus size={20} /> Add another skill to learn
            </button>

            <div className="flex justify-between pt-8 mt-4 border-t border-slate-100">
              <button onClick={handlePrev} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-full font-semibold transition-colors">Back</button>
              <button 
                onClick={handleSubmit} 
                className="px-8 py-2.5 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : (hasAnyLearnSkill || hasAnyTeachSkill ? "Complete Profile" : "Skip & Complete")}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
            <div className="text-emerald-500 flex justify-center">
              <CheckCircle size={80} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">All Set!</h2>
            <p className="text-slate-600 text-lg">
              Your profile is ready. Let's find your first skill exchange!
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-8 py-3.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-sm transition-all text-lg"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
