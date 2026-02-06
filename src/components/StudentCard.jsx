
import React, { useState } from 'react';

const StudentCard = ({ student, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const {
        name,
        chineseName,
        className,
        tutorName,
        gpa,
        growthPortrait
    } = student;

    // Function to determine GPA color and badge style
    const getGpaStyle = (gpa) => {
        const val = parseFloat(gpa);
        if (isNaN(val)) return 'bg-gray-100 text-gray-500';
        if (val >= 4.0) return 'bg-emerald-100 text-emerald-700 ring-emerald-500/20';
        if (val >= 3.0) return 'bg-blue-100 text-blue-700 ring-blue-500/20';
        if (val >= 2.0) return 'bg-amber-100 text-amber-700 ring-amber-500/20';
        return 'bg-rose-100 text-rose-700 ring-rose-500/20';
    };

    // Generate a consistent gradient based on name
    const getAvatarGradient = (name) => {
        const gradients = [
            'from-blue-400 to-indigo-500',
            'from-emerald-400 to-teal-500',
            'from-orange-400 to-rose-500',
            'from-purple-400 to-fuchsia-500',
            'from-cyan-400 to-blue-500',
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    return (
        <div
            className={`group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-brand-500/20 shadow-lg' : 'hover:shadow-md hover:border-brand-200'}`}
        >
            {/* Header / Summary Row */}
            <div
                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-5">
                    {/* Avatar Placeholder */}
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(chineseName)} shadow-inner flex items-center justify-center text-white font-display font-bold text-xl ring-4 ring-white`}>
                        {chineseName[0]}
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors">
                            {chineseName} <span className="text-base font-medium text-slate-400 ml-1">({name})</span>
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-slate-500 mt-0.5">
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                {className}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                {tutorName}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pl-19 sm:pl-0">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Current GPA</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold ring-1 ring-inset ${getGpaStyle(gpa)}`}>
                            {typeof gpa === 'number' ? gpa.toFixed(2) : gpa}
                        </span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-brand-100 text-brand-600 rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 pt-0 border-t border-slate-50 space-y-6 bg-slate-50/50">

                    <div className="h-4"></div> {/* Spacer */}

                    {/* Goals Section */}
                    <section className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-400 rounded-full"></div>
                        <div className="pl-4">
                            <h4 className="flex items-center text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">
                                <span className="bg-brand-100 px-2 py-1 rounded text-[10px] mr-2">Target</span> Current Goals
                            </h4>
                            <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 text-slate-600 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                                {growthPortrait.goals}
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Self Reflection */}
                        <section className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 rounded-full"></div>
                            <div className="pl-4 h-full flex flex-col">
                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">
                                    Self Reflection
                                </h4>
                                <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 text-slate-600 text-sm whitespace-pre-wrap leading-relaxed flex-1">
                                    {growthPortrait.selfReflection}
                                </div>
                            </div>
                        </section>

                        {/* Tutor Comment */}
                        <section className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-full"></div>
                            <div className="pl-4 h-full flex flex-col">
                                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">
                                    Tutor's View
                                </h4>
                                <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 text-slate-600 text-sm whitespace-pre-wrap leading-relaxed flex-1 italic">
                                    {growthPortrait.tutorComment}
                                </div>
                            </div>
                        </section>
                    </div>
                    <div className="h-2"></div>
                </div>
            </div>
        </div>
    );
};

export default StudentCard;
