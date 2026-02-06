
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../src/data');
const scriptsDir = __dirname;
const photosDir = path.join(__dirname, '../public/photos');

function cleanText(text) {
    if (!text) return "";
    return text.replace(/\-\- \d+ of \d+ \-\-/g, '') // Remove page markers
        .replace(/\n+/g, '\n') // Normalize newlines
        .trim();
}

function extractSection(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return null;

    let sub = text.substring(startIndex + startMarker.length);
    let endIndex = -1;

    if (endMarker) {
        if (Array.isArray(endMarker)) {
            let minIndex = -1;
            endMarker.forEach(m => {
                const idx = sub.indexOf(m);
                if (idx !== -1 && (minIndex === -1 || idx < minIndex)) {
                    minIndex = idx;
                }
            });
            endIndex = minIndex;
        } else {
            endIndex = sub.indexOf(endMarker);
        }
    }

    if (endIndex !== -1) {
        sub = sub.substring(0, endIndex);
    }

    return cleanText(sub);
}

// Extract academic highlights from 高光时刻 sections
function extractHighlights(text) {
    const highlights = [];
    const highlightMatches = text.match(/⾼光时刻\s*([\s\S]*?)(?=教师：|社团简介|钉钉扫码|$)/g);
    if (highlightMatches) {
        highlightMatches.forEach(match => {
            // Extract course names before 高光时刻
            const courseMatch = match.match(/^(.*?)⾼光时刻/);
            if (courseMatch && courseMatch[1]) {
                const course = courseMatch[1].trim();
                if (course && course.length < 50) {
                    highlights.push(course);
                }
            }
        });
    }
    return [...new Set(highlights)].slice(0, 5); // Unique, max 5
}

// Extract strengths from tutor comments (positive keywords)
function extractStrengths(text) {
    const strengths = [];
    const positivePatterns = [
        /出⾊|excellent|outstanding|优秀|strong|impressive|remarkable/gi,
        /leadership|领导⼒|responsible|责任感/gi,
        /creative|创造⼒|innovative|创新/gi,
        /analytical|分析|critical thinking|思辨/gi,
        /teamwork|团队|collaborative|协作/gi,
        /communication|沟通|articulate|表达/gi,
        /persistent|坚持|resilient|韧性/gi,
    ];

    const strengthLabels = ['Academic Excellence', 'Leadership', 'Creativity', 'Analytical Thinking', 'Teamwork', 'Communication', 'Persistence'];

    positivePatterns.forEach((pattern, idx) => {
        if (pattern.test(text)) {
            strengths.push(strengthLabels[idx]);
        }
    });

    return [...new Set(strengths)].slice(0, 4);
}

// Extract weaknesses/improvement areas
function extractWeaknesses(text) {
    const weaknesses = [];
    const improvementPatterns = [
        { pattern: /time management|时间管理|按时|deadline|late|迟交/gi, label: 'Time Management' },
        { pattern: /participation|参与|engage|课堂|passive/gi, label: 'Class Participation' },
        { pattern: /attention|专注|focus|distract|分⼼/gi, label: 'Focus & Attention' },
        { pattern: /confidence|⾃信|shy|hesitant/gi, label: 'Confidence' },
        { pattern: /foundation|基础|fundamental|basic/gi, label: 'Foundational Skills' },
        { pattern: /consistency|稳定|consistent|fluctuat/gi, label: 'Consistency' },
    ];

    improvementPatterns.forEach(({ pattern, label }) => {
        if (pattern.test(text)) {
            weaknesses.push(label);
        }
    });

    return [...new Set(weaknesses)].slice(0, 3);
}

// Extract activities from club sections
function extractActivities(text) {
    const activities = [];
    const activityPatterns = [
        { pattern: /篮球|basketball/gi, label: '🏀 Basketball' },
        { pattern: /⾜球|football|soccer/gi, label: '⚽ Football' },
        { pattern: /飞盘|frisbee/gi, label: '🥏 Frisbee' },
        { pattern: /音乐剧|musical|drama|戏剧/gi, label: '🎭 Musical/Drama' },
        { pattern: /商社|business club|商赛/gi, label: '💼 Business Club' },
        { pattern: /⼿⼯|craft|handmade/gi, label: '🎨 Crafts' },
        { pattern: /debate|辩论/gi, label: '🎤 Debate' },
        { pattern: /art|艺术|painting|绘画/gi, label: '🖼️ Art' },
    ];

    activityPatterns.forEach(({ pattern, label }) => {
        if (pattern.test(text)) {
            activities.push(label);
        }
    });

    return [...new Set(activities)].slice(0, 4);
}

// Find photo for student
function findPhoto(chineseName) {
    if (!fs.existsSync(photosDir)) return null;

    const files = fs.readdirSync(photosDir);
    const match = files.find(f => f.startsWith(chineseName));
    return match ? `/photos/${match}` : null;
}

function processData() {
    // 1. Read Excel Data
    const excelPath = path.join(dataDir, 'excel_data.json');
    if (!fs.existsSync(excelPath)) {
        console.error("Excel data not found.");
        return;
    }
    const excelRaw = JSON.parse(fs.readFileSync(excelPath, 'utf-8'));

    // Create Map: Name -> GPA
    const gpaMap = {};
    excelRaw.forEach(row => {
        const name = row['学年名称'];
        const gpa = row['2025学年'];
        if (name && name !== '年级名称' && name !== '姓名') {
            gpaMap[name] = gpa;
        }
    });

    // 2. Read PDF Text Data
    const pdfRawPath = path.join(scriptsDir, 'temp_raw_data.json');
    if (!fs.existsSync(pdfRawPath)) {
        console.error("PDF raw data not found.");
        return;
    }
    const pdfRaw = JSON.parse(fs.readFileSync(pdfRawPath, 'utf-8'));

    // 3. Process each student
    const students = pdfRaw.map(entry => {
        const text = entry.text;

        // Extract Name
        const filename = entry.filename;
        const nameMatch = filename.match(/——(.*?)\.pdf/);
        let fullName = nameMatch ? nameMatch[1] : "Unknown";

        const nameParts = fullName.split(' ');
        const chineseName = nameParts[0];

        // Match GPA
        const gpa = gpaMap[chineseName] || "N/A";

        // Extract Sections
        const goals = extractSection(text, "我的⽬标", ["学⽣⾃我管理状况", "成长总结"]);
        const selfReflection = extractSection(text, "我眼中的⾃⼰", ["我成长中的⾼光", "个⼈成⻓"]);
        const tutorComment = extractSection(text, "导师眼中的我", ["同伴眼中的我", "⽣活导师有话说"]);

        // Extract basic info
        const classMatch = text.match(/班级：\s*(.*)/);
        const className = classMatch ? classMatch[1].trim() : "";

        const tutorMatch = text.match(/导师：\s*(.*)/);
        const tutorName = tutorMatch ? tutorMatch[1].trim() : "";

        // NEW: Extract additional columns
        const strengths = extractStrengths(text);
        const weaknesses = extractWeaknesses(text);
        const activities = extractActivities(text);
        const photo = findPhoto(chineseName);

        return {
            id: chineseName,
            name: fullName,
            chineseName,
            className,
            tutorName,
            gpa,
            photo,
            strengths,
            weaknesses,
            activities,
            growthPortrait: {
                goals: goals || "Not available",
                selfReflection: selfReflection || "Not available",
                tutorComment: tutorComment || "Not available"
            },
        };
    });

    // Write final data
    fs.writeFileSync(path.join(dataDir, 'students.json'), JSON.stringify(students, null, 2));
    console.log(`Processed ${students.length} students with photos and new columns. Saved to src/data/students.json`);
}

processData();
