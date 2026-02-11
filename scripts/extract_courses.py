#!/usr/bin/env python3
"""
Extract course grades from growth portrait PDFs using visual position detection.
Improved version with dynamic Y-position detection and better color matching.
"""

import fitz  # PyMuPDF
import json
import re
from pathlib import Path
from collections import Counter

# X positions for each grade (approximate centers)
GRADE_X_POSITIONS = [
    (60, 0),    # F
    (145, 1),   # 萌芽 [1]
    (225, 2),   # 生长 [2]
    (305, 3),   # 掌握 [3]
    (385, 4),   # 精熟 [4]
    (465, 5)    # 超越 [5]
]

# Dark blue color used for inactive grades
INACTIVE_COLOR = (0.004, 0.067, 0.239)

def is_inactive_color(fill):
    """Check if fill is the inactive dark blue color."""
    if not fill:
        return True
    r, g, b = fill
    # Check if close to dark blue
    return (r < 0.05 and g < 0.1 and b < 0.3)

def is_gray_or_white(fill):
    """Check if fill is gray or white (background)."""
    if not fill:
        return True
    r, g, b = fill
    # White/light gray
    if r > 0.9 and g > 0.9 and b > 0.9:
        return True
    # Mid gray
    if 0.5 < r < 0.7 and 0.5 < g < 0.7 and 0.5 < b < 0.7:
        return True
    return False

def find_grade_scale_y(page):
    """Find the Y position of the grade scale text."""
    blocks = page.get_text('dict')['blocks']
    for block in blocks:
        if 'lines' in block:
            for line in block['lines']:
                for span in line['spans']:
                    t = span['text'].strip()
                    if t == '掌握':  # Look for middle grade marker
                        return span['origin'][1]
    return None

def find_grade_from_graphics(page):
    """Find the selected grade from graphics on the page."""
    # First, find where the grade scale is on this page
    grade_y = find_grade_scale_y(page)
    if grade_y is None:
        return None
    
    # Look for colored shapes near the grade bar (within 30 pixels above the text)
    drawings = page.get_drawings()
    
    active_x_positions = []
    
    for d in drawings:
        rect = d.get('rect')
        fill = d.get('fill')
        if rect and fill:
            # Check if in the grade bar area (slightly above the text labels)
            if grade_y - 40 < rect.y0 < grade_y + 10:
                # Skip inactive (dark blue) and background colors
                if not is_inactive_color(fill) and not is_gray_or_white(fill):
                    x_center = (rect.x0 + rect.x1) / 2
                    active_x_positions.append(x_center)
    
    if not active_x_positions:
        return None
    
    # Find the most common x position range (multiple shapes form the indicator)
    x_counts = Counter()
    for x_pos, grade in GRADE_X_POSITIONS:
        for x in active_x_positions:
            if abs(x - x_pos) < 40:  # Within 40 pixels of grade position
                x_counts[grade] += 1
    
    if not x_counts:
        return None
    
    # Return the grade with most matching shapes
    return x_counts.most_common(1)[0][0]

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
        skip_keywords = ['课程', '教师', '素养', '成绩', '建议', '高光', '超越', '精熟', 
                        '掌握', '生长', '萌芽', '扫码', 'QR', 'Scan', 'DingTalk']
        if any(skip in line for skip in skip_keywords):
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
            # Count grade distribution
            grades = [c['gradeNum'] for c in courses]
            grade_dist = Counter(grades)
            print(f" - {len(courses)} courses: {dict(grade_dist)}")
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
    print("\n=== Sample Output ===")
    for name in list(data.keys())[:3]:
        print(f"\n{name}:")
        for course in data[name]['courses']:
            print(f"  [{course['gradeNum']}] {course['name']}")
