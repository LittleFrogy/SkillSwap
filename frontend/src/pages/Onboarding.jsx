import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, GraduationCap, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/listings';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [teachData, setTeachData] = useState({
    skill: '',
    proficiencyLevel: 'Intermediate',
    description: '',
    weeklyAvailability: ''
  });

  const [learnData, setLearnData] = useState({
    skill: '',
    proficiencyLevel: 'Beginner',
    description: '',
    weeklyAvailability: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (teachData.skill) {
        await axios.post(API_URL, { ...teachData, type: 'teach' });
      }
      if (learnData.skill) {
        await axios.post(API_URL, { ...learnData, type: 'learn' });
      }
      setStep(4); // Success step
    } catch (error) {
      console.error("Error submitting listings", error);
      alert("Something went wrong. Please check if the backend is running on port 5000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Progress Bar */}
      <div className="bg-slate-100 h-2 w-full">
        <div className="bg-primary-500 h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">👋</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome to SkillSwap!</h1>
            <p className="text-slate-600 text-lg">
              Let's set up your profile. We just need to know two things:<br/>
              What you can teach, and what you want to learn.
            </p>
            <button 
              onClick={handleNext}
              className="px-8 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors"
            >
              Let's Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <GraduationCap size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What can you teach?</h2>
                <p className="text-slate-500">Share your expertise with the community.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill (e.g., Python, Guitar, Spanish)</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  value={teachData.skill}
                  onChange={e => setTeachData({...teachData, skill: e.target.value})}
                  placeholder="What are you good at?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proficiency Level</label>
                <select 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  value={teachData.proficiencyLevel}
                  onChange={e => setTeachData({...teachData, proficiencyLevel: e.target.value})}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weekly Availability</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  value={teachData.weeklyAvailability}
                  onChange={e => setTeachData({...teachData, weeklyAvailability: e.target.value})}
                  placeholder="e.g., Weekends, Evenings, 2 hours a week"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows="3"
                  value={teachData.description}
                  onChange={e => setTeachData({...teachData, description: e.target.value})}
                  placeholder="Describe what you can offer in a session..."
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <button onClick={handlePrev} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Back</button>
              <button 
                onClick={handleNext} 
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
                disabled={!teachData.skill}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <BookOpen size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What do you want to learn?</h2>
                <p className="text-slate-500">Find someone to help you grow.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill to Learn</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  value={learnData.skill}
                  onChange={e => setLearnData({...learnData, skill: e.target.value})}
                  placeholder="What do you want to master?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Current Level</label>
                <select 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  value={learnData.proficiencyLevel}
                  onChange={e => setLearnData({...learnData, proficiencyLevel: e.target.value})}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weekly Availability for Learning</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  value={learnData.weeklyAvailability}
                  onChange={e => setLearnData({...learnData, weeklyAvailability: e.target.value})}
                  placeholder="e.g., Weekday mornings"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Why do you want to learn this?</label>
                <textarea 
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows="3"
                  value={learnData.description}
                  onChange={e => setLearnData({...learnData, description: e.target.value})}
                  placeholder="Share your goals..."
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <button onClick={handlePrev} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Back</button>
              <button 
                onClick={handleSubmit} 
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 flex items-center gap-2"
                disabled={!learnData.skill || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Finish Onboarding"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-6 py-8 animate-in fade-in zoom-in duration-500">
            <div className="text-primary-500 flex justify-center">
              <CheckCircle size={80} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">All Set!</h2>
            <p className="text-slate-600 text-lg">
              Your listings have been created. You're ready to start swapping skills!
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
