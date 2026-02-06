import React, { useState, useMemo } from 'react';

function StudentTable({ students, onSelectStudent }) {
    const [sortConfig, setSortConfig] = useState({ key: 'gpa', direction: 'desc' });

    const sortedStudents = useMemo(() => {
        const sorted = [...students];
        sorted.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            // Handle GPA as number
            if (sortConfig.key === 'gpa') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }
            // Handle arrays (strengths, weaknesses, activities) by length
            if (Array.isArray(aVal)) {
                aVal = aVal.length;
                bVal = bVal.length;
            }
            // Handle strings
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [students, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const getGpaColor = (gpa) => {
        const g = parseFloat(gpa);
        if (g >= 4.0) return 'bg-emerald-100 text-emerald-700';
        if (g >= 3.5) return 'bg-sky-100 text-sky-700';
        if (g >= 3.0) return 'bg-amber-100 text-amber-700';
        return 'bg-rose-100 text-rose-700';
    };

    // Generate avatar gradient from name
    const getAvatarGradient = (name) => {
        const hash = name.split('').reduce((acc, c) => c.charCodeAt(0) + ((acc << 5) - acc), 0);
        const colors = [
            'from-rose-400 to-pink-500',
            'from-violet-400 to-purple-500',
            'from-blue-400 to-cyan-500',
            'from-emerald-400 to-teal-500',
            'from-amber-400 to-orange-500',
            'from-fuchsia-400 to-pink-500',
        ];
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left">
                        <th className="py-3 px-4 font-semibold text-slate-600">Photo</th>
                        <th
                            className="py-3 px-4 font-semibold text-slate-600 cursor-pointer hover:text-brand-600 transition-colors"
                            onClick={() => requestSort('name')}
                        >
                            Name {getSortIcon('name')}
                        </th>
                        <th
                            className="py-3 px-4 font-semibold text-slate-600 cursor-pointer hover:text-brand-600 transition-colors"
                            onClick={() => requestSort('gpa')}
                        >
                            GPA {getSortIcon('gpa')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-slate-600">Courses & Grades</th>
                        <th className="py-3 px-4 font-semibold text-slate-600">Activities</th>
                        <th className="py-3 px-4 font-semibold text-slate-600">Future Direction</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedStudents.map((student) => (
                        <tr
                            key={student.id}
                            className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            onClick={() => onSelectStudent && onSelectStudent(student)}
                        >
                            {/* Photo */}
                            <td className="py-3 px-4">
                                {student.photo ? (
                                    <img
                                        src={student.photo}
                                        alt={student.name}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                    />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(student.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                        {student.chineseName.charAt(0)}
                                    </div>
                                )}
                            </td>

                            {/* Name */}
                            <td className="py-3 px-4">
                                <div className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
                                    {student.chineseName}
                                </div>
                                <div className="text-xs text-slate-500">{student.name.replace(student.chineseName, '').trim()}</div>
                            </td>

                            {/* GPA */}
                            <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getGpaColor(student.gpa)}`}>
                                    {typeof student.gpa === 'number' ? student.gpa.toFixed(2) : student.gpa}
                                </span>
                            </td>

                            {/* Courses & Grades */}
                            <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                    {student.courses?.slice(0, 3).map((c, i) => {
                                        const gradeColors = {
                                            5: 'bg-violet-100 text-violet-700 border-violet-200',
                                            4: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                                            3: 'bg-blue-50 text-blue-600 border-blue-200',
                                            2: 'bg-amber-50 text-amber-600 border-amber-200',
                                            1: 'bg-rose-50 text-rose-600 border-rose-200',
                                            0: 'bg-slate-100 text-slate-500 border-slate-200'
                                        };
                                        const colorClass = gradeColors[c.gradeNum] || gradeColors[3];
                                        const shortName = c.name.length > 12 ? c.name.substring(0, 12) + '…' : c.name;
                                        return (
                                            <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`} title={`${c.name}: ${c.grade}`}>
                                                {shortName} [{c.gradeNum}]
                                            </span>
                                        );
                                    })}
                                    {student.courses?.length > 3 && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                                            +{student.courses.length - 3}
                                        </span>
                                    )}
                                    {(!student.courses || student.courses.length === 0) && (
                                        <span className="text-slate-400 text-xs">No courses</span>
                                    )}
                                </div>
                            </td>

                            {/* Activities */}
                            <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                    {student.activities?.slice(0, 2).map((a, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                                            {a}
                                        </span>
                                    ))}
                                    {student.activities?.length > 2 && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                                            +{student.activities.length - 2}
                                        </span>
                                    )}
                                </div>
                            </td>

                            {/* Future Direction */}
                            <td className="py-3 px-4">
                                {student.futureDirection ? (
                                    <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">
                                        {student.futureDirection}
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-xs">
                                        未定
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default StudentTable;
