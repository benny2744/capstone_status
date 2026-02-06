#!/usr/bin/env python3
"""
Extract course grades from growth portrait PDFs using visual position detection.
"""

import fitz  # PyMuPDF
import json
import re
from pathlib import Path

# X positions for each grade (approximate centers)
GRADE_X_POSITIONS = {
    0: 60,   # F
    1: 143,  # 萌芽 [1]
    2: 223,  # 生长 [2]
    3: 303,  # 掌握 [3]
    4: 383,  # 精熟 [4]
    5: 462   # 超越 [5]
}

# Bright colors indicating active grade (teal/cyan and orange/red variants)
ACTIVE_COLORS = [
    (0.075, 0.671, 0.871),  # Teal
    (0.996, 0.447, 0.337),  # Orange/red
    (0.075, 0.670, 0.871),  # Teal variant
    (0.996, 0.447, 0.338),  # Orange variant
]

def is_active_color(fill):
    """Check if fill color indicates an active (selected) grade."""
    if not fill:
        return False
    for active in ACTIVE_COLORS:
        if all(abs(fill[i] - active[i]) < 0.1 for i in range(3)):
            return True
    # Also check for bright colors (not dark blue or gray)
    # Dark blue: (0.004, 0.067, 0.239)
    # Gray: (0.6, 0.6, 0.6) or (0.957, 0.957, 0.957)
    r, g, b = fill
    if r > 0.5 or g > 0.5 or (b > 0.5 and r > 0.1):
        # Likely a bright/active color
        return True
    return False

def find_grade_from_graphics(page, grade_y_min=380, grade_y_max=430):
    """Find the selected grade from graphics on the page."""
    drawings = page.get_drawings()
    
    active_x_positions = []
    
    for d in drawings:
        rect = d.get('rect')
        fill = d.get('fill')
        if rect and fill:
            y = rect.y0
            if grade_y_min < y < grade_y_max:
                if is_active_color(fill):
                    x_center = (rect.x0 + rect.x1) / 2
                    active_x_positions.append(x_center)
    
    if not active_x_positions:
        return None
    
    # Find the most common x position (the grade indicator)
    # Look for the x position closest to one of our grade positions
    avg_x = sum(active_x_positions) / len(active_x_positions)
    
    best_grade = 3  # Default
    min_dist = float('inf')
    
    for grade, x_pos in GRADE_X_POSITIONS.items():
        dist = abs(avg_x - x_pos)
        if dist < min_dist:
            min_dist = dist
            best_grade = grade
    
    return best_grade

def extract_courses_from_page(page, page_text):
    """Extract course info from a single page."""
    if '课程成绩' not in page_text:
        return None
    
    # Check for grade scale markers
    if not any(marker in page_text for marker in ['萌芽', '掌握', '精熟']):
        return None
    
    # Extract course name (at end of page, before empty lines)
    lines = [l.strip() for l in page_text.strip().split('\n') if l.strip()]
    
    # Course name is typically the last meaningful line
    course_name = None
    for line in reversed(lines[-15:]):
        # Skip grade scale, keywords, empty
        if any(skip in line for skip in ['课程', '教师', '素养', '成绩', '建议', '高光', '超越', '精熟', '掌握', '生长', '萌芽']):
            continue
        if len(line) > 2 and len(line) < 40:
            course_name = line
            break
    
    # Extract teacher
    teacher_match = re.search(r'教师[：:]\s*([^\n]+)', page_text)
    teacher = teacher_match.group(1).strip() if teacher_match else None
    
    # Extract feedback
    feedback_match = re.search(r'教师建议\s*\n([\s\S]*?)(?=高光时刻|$)', page_text)
    feedback = feedback_match.group(1).strip() if feedback_match else None
    if feedback:
        # Clean up - remove course name if at end
        feedback = re.sub(r'\n[^\n]{2,30}$', '', feedback).strip()
    
    # Get grade from graphics
    grade = find_grade_from_graphics(page)
    
    if not course_name:
        return None
    
    return {
        'name': course_name,
        'teacher': teacher,
        'gradeNum': grade if grade is not None else 3,
        'feedback': feedback[:300] if feedback else None
    }

def extract_student_courses(pdf_path):
    """Extract all courses from a student's growth portrait."""
    doc = fitz.open(pdf_path)
    courses = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        course = extract_courses_from_page(page, text)
        if course and course['name']:
            courses.append(course)
    
    return courses

def process_all_pdfs(pdf_dir, output_file):
    """Process all growth portrait PDFs."""
    pdf_dir = Path(pdf_dir)
    all_data = {}
    
    pdf_files = list(pdf_dir.glob("高中2025-2026学年第一学期成长画像——*.pdf"))
    print(f"Found {len(pdf_files)} PDF files")
    
    for pdf_path in pdf_files:
        # Extract student name
        match = re.search(r'——(.+?)\s+(.+?)\.pdf', pdf_path.name)
        if not match:
            continue
        
        chinese_name = match.group(1)
        english_name = match.group(2)
        
        print(f"Processing: {chinese_name}", end='')
        
        try:
            courses = extract_student_courses(str(pdf_path))
            all_data[chinese_name] = {
                'chineseName': chinese_name,
                'englishName': english_name,
                'courses': courses
            }
            print(f" - {len(courses)} courses")
        except Exception as e:
            print(f" - Error: {e}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved to {output_file}")
    return all_data

if __name__ == '__main__':
    pdf_dir = '/Users/bennyz/Documents/~004 Capstone/26-27 Cycle'
    output_file = '/Users/bennyz/Documents/~004 Capstone/26-27 Cycle/student-dashboard/src/data/course_data.json'
    
    data = process_all_pdfs(pdf_dir, output_file)
    
    # Show sample with actual grades
    for name in list(data.keys())[:3]:
        print(f"\n{name}:")
        for course in data[name]['courses'][:5]:
            print(f"  - {course['name']}: Grade {course['gradeNum']}")
