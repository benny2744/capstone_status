#!/usr/bin/env python3
"""
Merge course data into students.json and generate academic summaries.
"""

import json
import re

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def clean_course_name(name):
    """Clean up course names."""
    if not name:
        return None
    # Skip invalid names
    invalid_patterns = ['超越', '精熟', '掌握', '萌芽', '生长', 'None', '高光']
    for pattern in invalid_patterns:
        if pattern in str(name):
            return None
    return name.strip()

def grade_to_number(grade_str):
    """Convert grade string to numeric value."""
    if not grade_str:
        return 3
    if '超越' in grade_str or '[5]' in grade_str:
        return 5
    if '精熟' in grade_str or '[4]' in grade_str:
        return 4
    if '掌握' in grade_str or '[3]' in grade_str:
        return 3
    if '生长' in grade_str or '[2]' in grade_str:
        return 2
    if '萌芽' in grade_str or '[1]' in grade_str:
        return 1
    if 'F' in grade_str.upper():
        return 0
    return 3

def generate_academic_summary(courses):
    """Generate a brief academic summary from courses."""
    if not courses:
        return {"strength": None, "weakness": None}
    
    # Group courses by grade
    high_grades = []  # 4-5
    low_grades = []   # 1-2
    
    for course in courses:
        name = clean_course_name(course.get('name'))
        if not name:
            continue
        grade = grade_to_number(course.get('grade'))
        feedback = course.get('feedback', '')
        
        if grade >= 4:
            high_grades.append({'name': name, 'grade': grade, 'feedback': feedback})
        elif grade <= 2:
            low_grades.append({'name': name, 'grade': grade, 'feedback': feedback})
    
    strength = None
    weakness = None
    
    if high_grades:
        strength = f"Excels in {high_grades[0]['name']}"
        if len(high_grades) > 1:
            strength += f" and {len(high_grades)-1} other course(s)"
    
    if low_grades:
        weakness = f"Needs improvement in {low_grades[0]['name']}"
        if len(low_grades) > 1:
            weakness += f" and {len(low_grades)-1} other course(s)"
    
    return {"strength": strength, "weakness": weakness}

def main():
    # Load data
    students = load_json('src/data/students.json')
    course_data = load_json('src/data/course_data.json')
    
    updated_count = 0
    
    for student in students:
        chinese_name = student.get('chineseName')
        if chinese_name in course_data:
            student_courses = course_data[chinese_name]
            
            # Clean up courses
            clean_courses = []
            for course in student_courses.get('courses', []):
                name = clean_course_name(course.get('name'))
                if name:
                    grade_num = course.get('gradeNum', 3)
                    grade_labels = {5: '超越[5]', 4: '精熟[4]', 3: '掌握[3]', 2: '生长[2]', 1: '萌芽[1]', 0: 'F'}
                    clean_courses.append({
                        'name': name,
                        'grade': grade_labels.get(grade_num, '掌握[3]'),
                        'gradeNum': grade_num,
                        'feedback': (course.get('feedback') or '')[:300]  # Truncate
                    })
            
            student['courses'] = clean_courses
            
            # Generate academic summary
            summary = generate_academic_summary(clean_courses)
            student['academicStrength'] = summary['strength']
            student['academicWeakness'] = summary['weakness']
            
            # Replace old strengths/weaknesses arrays
            if clean_courses:
                # Create simple strength/weakness based on course performance
                high_courses = [c['name'] for c in clean_courses if c['gradeNum'] >= 4]
                low_courses = [c['name'] for c in clean_courses if c['gradeNum'] <= 2]
                
                if high_courses:
                    student['strengths'] = high_courses[:3]
                if low_courses:
                    student['weaknesses'] = low_courses[:3]
            
            updated_count += 1
    
    # Save updated students
    save_json('src/data/students.json', students)
    print(f"Updated {updated_count} students with course data")
    
    # Show sample
    for student in students[:2]:
        print(f"\n{student['chineseName']}:")
        print(f"  Courses: {len(student.get('courses', []))}")
        for c in student.get('courses', [])[:3]:
            print(f"    - {c['name']}: {c['grade']}")

if __name__ == '__main__':
    main()
