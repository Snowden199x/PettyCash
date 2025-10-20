from supabase import create_client, Client
from werkzeug.security import generate_password_hash

# === SUPABASE CONNECTION ===
SUPABASE_URL = "https://itvemmgexltaomqwtmhk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dmVtbWdleGx0YW9tcXd0bWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4OTA2OCwiZXhwIjoyMDc2NDY1MDY4fQ.Z7TCF0NpYOLUtZttRRPG97CMZ5oKy8pT6ZwOo4_lU4E"  # service_role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# === OSAS ACCOUNT DETAILS ===
username = "osas_admin"
email = "osas.admin@schoolname.edu.ph"   # temporary email
plain_password = "osas123"               # temporary password
role = "superadmin"

# === HASH PASSWORD ===
hashed_password = generate_password_hash(plain_password)

# === DATA TO INSERT ===
data = {
    "username": username,
    "email": email,
    "password_hash": hashed_password,
    "role": role,
    "is_active": True
}

# === INSERT INTO SUPABASE ===
try:
    response = supabase.table("users").insert(data).execute()
    print("✅ OSAS Superadmin account created successfully!")
    print("Username:", username)
    print("Email:", email)
    print("Temporary password:", plain_password)
    print("\n🧹 Reminder: Delete or update this account before production!")
except Exception as e:
    print("❌ Error inserting OSAS admin:", e)
