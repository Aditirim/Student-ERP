require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// Local Caching mechanism to prevent daily spam
const CACHE_FILE = './warning_cache.json';
let warningCache = {};
if (fs.existsSync(CACHE_FILE)) {
  warningCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
}

// Connect using environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Since we are moving to direct emails, we need AWS SES (Simple Email Service) SENDER email instead of an SNS Topic
const SENDER_EMAIL = process.env.SENDER_EMAIL || "your_verified_personal_email@gmail.com";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY locally.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const sesClient = new SESClient({ region: 'ap-south-1' });

async function runETL() {
  try {
    const { data: students, error: studentError } = await supabase.from('students').select('id, name, email');
    if (studentError) throw studentError;

    const { data: subjects, error: subjectError } = await supabase.from('subjects').select('id, name');
    if (subjectError) throw subjectError;

    const { data: attendance, error: attendanceError } = await supabase.from('attendance').select('student_id, subject_id, present');
    if (attendanceError) throw attendanceError;

    const studentMap = new Map(students.map(s => [s.id, s]));
    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

    const attendanceStats = {};
    attendance.forEach(record => {
      if (!attendanceStats[record.student_id]) attendanceStats[record.student_id] = {};
      if (!attendanceStats[record.student_id][record.subject_id]) {
        attendanceStats[record.student_id][record.subject_id] = { total: 0, present: 0 };
      }

      attendanceStats[record.student_id][record.subject_id].total++;
      if (record.present) {
        attendanceStats[record.student_id][record.subject_id].present++;
      }
    });

    const output = [];

    for (const [studentId, subjectsObj] of Object.entries(attendanceStats)) {
      const student = studentMap.get(studentId);
      if (!student) continue;

      for (const [subjectId, stats] of Object.entries(subjectsObj)) {
        const attendancePercentage = Math.round((stats.present / stats.total) * 100);
        const subjectName = subjectMap.get(Number(subjectId)) || `Subject ${subjectId}`;

        // Create a unique tracking hash for this specific student + subject combo
        const cacheKey = `${studentId}-${subjectId}`;

        // Only send if it's below threshold AND we haven't already warned them!
        if (attendancePercentage <= 75 && !warningCache[cacheKey]) {
          const logData = {
            student_id: studentId,
            email: student.email,
            subject: subjectName,
            attendance_percentage: attendancePercentage,
            status: "LOW_ATTENDANCE"
          };
          output.push(logData);

          if (!student.email) {
            console.log(`⚠️ Skipped email alert for ${studentId} (No email on file).`);
            continue;
          }

          const messageText = `Hello ${student.name},\n\nURGENT ALERT: Your attendance in ${subjectName} has dropped to ${attendancePercentage}%. Please improve your attendance record immediately to avoid academic penalties.\n\n- Student ERP Auto-Bot`;

          try {
            // Push Direct Email specifically to the student using AWS SES
            const command = new SendEmailCommand({
              Source: SENDER_EMAIL,
              Destination: { ToAddresses: [student.email] },
              Message: {
                Subject: { Data: `Low Attendance Warning - ${subjectName}` },
                Body: { Text: { Data: messageText } }
              }
            });

            await sesClient.send(command);
            
            // Mark true in cache so we NEVER send this specific warning email again
            warningCache[cacheKey] = true;
            
            console.log(`\n✅ Direct AWS SES Email successfully dispatched to Student Element: ${student.email}`);
            console.log("Logged Output:", JSON.stringify(logData, null, 2));
            
          } catch (sesErr) {
            console.error(`\n❌ Failed to dispatch direct SES Email for ${studentId} to ${student.email}:`, sesErr.message);
          }
        }
      }
    }
    
    // Save Cache permanently so tomorrow it remembers who we emailed
    fs.writeFileSync(CACHE_FILE, JSON.stringify(warningCache, null, 2));

  } catch (err) {
    console.error("ETL Server Error:", err.message);
  }
}

runETL();
