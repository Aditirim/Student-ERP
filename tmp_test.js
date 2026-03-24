require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("teacher_assignments")
    .select(`
      id,
      subject_id,
      branch,
      year,
      semester,
      section,
      subjects (name)
    `)
    .eq("teacher_id", "T201");
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

run();
