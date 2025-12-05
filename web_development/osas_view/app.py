from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session,
    jsonify,
)
from werkzeug.security import check_password_hash, generate_password_hash
from supabase import create_client
import os
from dotenv import load_dotenv
import random
import string
from datetime import datetime
import uuid
from io import BytesIO
from docx import Document
from flask import send_file
from docx.shared import Inches

load_dotenv()

osas = Blueprint(
    "osas",
    __name__,
    url_prefix="/osas",
    template_folder="templates",
    static_folder="static",
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def generate_username():
    return f"0125-{random.randint(1000,9999)}"


def generate_password(length=8):
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


def get_admin_data(username):
    result = supabase.table("osas_admin").select("*").eq("username", username).execute()
    if result.data:
        return result.data[0]
    return None


def log_activity(admin_id, action_type, description):
    supabase.table("osas_activity_log").insert(
        {
            "admin_id": admin_id,
            "action_type": action_type,
            "description": description,
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()


def log_admin_audit(admin_id, field, old_value, new_value):
    supabase.table("osas_admin_audit").insert(
        {
            "admin_id": admin_id,
            "changed_field": field,
            "old_value": old_value,
            "new_value": new_value,
            "changed_at": datetime.utcnow().isoformat(),
        }
    ).execute()


# ========== AUTH & NAV ===========
@osas.route("/login", methods=["GET", "POST"])
def osas_login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        admin = get_admin_data(username)
        if admin:
            if check_password_hash(admin["password"], password):
                session["osas_admin"] = username
                log_activity(admin["id"], "login", f"Admin {username} logged in")
                device_info = request.user_agent.string
                ip_address = request.remote_addr or "Unknown"
                supabase.table("osas_sessions").insert(
                    {
                        "admin_id": admin["id"],
                        "device_info": device_info,
                        "ip_address": ip_address,
                        "last_active_at": datetime.utcnow().isoformat(),
                        "is_current": True,
                    }
                ).execute()
                flash("OSAS login successful!", "success")
                return redirect(url_for("osas.osas_dashboard"))
            flash("Incorrect password.", "danger")
        else:
            flash("Admin not found.", "danger")
    return render_template("osas/login.html")


@osas.route("/dashboard")
def osas_dashboard():
    if "osas_admin" in session:
        return render_template("osas/homepage.html", active_page="dashboard")
    return redirect(url_for("osas.osas_login"))


@osas.route("/logout")
def osas_logout():
    username = session.get("osas_admin")
    if username:
        admin = get_admin_data(username)
        if admin:
            log_activity(admin["id"], "logout", f"Admin {username} logged out")
            device_info = request.user_agent.string
            ip_address = request.remote_addr or "Unknown"
            supabase.table("osas_sessions").update(
                {"is_current": False, "last_active_at": datetime.utcnow().isoformat()}
            ).eq("admin_id", admin["id"]).eq("device_info", device_info).eq(
                "ip_address", ip_address
            ).execute()

    # HUWAG na session.clear() para di ma‑logout ang PRES
    session.pop("osas_admin", None)
    session.pop("osas_role", None)       # kung meron kang ganitong key
    session.pop("osas_permissions", None)  # at iba pang OSAS-only keys

    return redirect(url_for("osas.osas_login"))



@osas.route("/reports")
def osas_reports():
    if "osas_admin" in session:
        return render_template("osas/reports.html", active_page="reports")
    return redirect(url_for("osas.osas_login"))


@osas.route("/api/admin/notifications", methods=["GET"])
def get_admin_notifications():
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401

    try:
        res = (
            supabase.table("osas_notifications")
            .select("id, org_id, report_id, org_name, message, created_at, is_read")
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )

        items = res.data or []
        has_unread = any(not n.get("is_read") for n in items)

        return jsonify({"notifications": items, "has_unread": has_unread})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@osas.route("/api/admin/notifications/<int:notif_id>/read", methods=["POST"])
def mark_notification_read(notif_id):
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        supabase.table("osas_notifications").update({"is_read": True}).eq(
            "id", notif_id
        ).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@osas.route("/settings")
def osas_settings():
    if "osas_admin" in session:
        return render_template("osas/settings.html", active_page="settings")
    return redirect(url_for("osas.osas_login"))


@osas.route("/orgs")
def osas_orgs():
    if "osas_admin" in session:
        return render_template("osas/orgs.html", active_page="orgs")
    return redirect(url_for("osas.osas_login"))


@osas.route("/archive")
def osas_archive():
    if "osas_admin" in session:
        return render_template("osas/archive.html", active_page="archive")
    return redirect(url_for("osas.osas_login"))


# ========== ORGANIZATION API ===========
@osas.route("/api/organizations", methods=["GET"])
def get_organizations():
    department = request.args.get("department")
    orgs = []
    dept_id = None
    if department and department != "All Departments":
        dept_result = (
            supabase.table("departments")
            .select("id")
            .eq("dept_name", department)
            .execute()
        )
        if dept_result.data:
            dept_id = dept_result.data[0]["id"]
    org_query = supabase.table("organizations").select("*").eq("status", "Active")
    if dept_id:
        org_query = org_query.eq("department_id", dept_id)
    result = org_query.execute()
    if result.data:
        for org in result.data:
            dept_name = "-"
            if org.get("department_id"):
                d = (
                    supabase.table("departments")
                    .select("dept_name")
                    .eq("id", org["department_id"])
                    .execute()
                )
                if d.data and isinstance(d.data, list):
                    dept_name = d.data[0]["dept_name"]
            orgs.append(
                {
                    "id": org["id"],
                    "name": org["org_name"],
                    "department": dept_name,
                    "username": org["username"],
                    "password": org["password"],
                    "date": str(org.get("accreditation_date")),
                    "status": org.get("status"),
                    "created_by": org.get("created_by"),
                }
            )
    return jsonify({"organizations": orgs})


@osas.route("/api/archived_organizations", methods=["GET"])
def get_archived_organizations():
    orgs = []
    result = (
        supabase.table("organizations").select("*").eq("status", "Archived").execute()
    )
    if result.data:
        for org in result.data:
            dept_name = "-"
            if org.get("department_id"):
                d = (
                    supabase.table("departments")
                    .select("dept_name")
                    .eq("id", org["department_id"])
                    .execute()
                )
                if d.data and isinstance(d.data, list):
                    dept_name = d.data[0]["dept_name"]
            orgs.append(
                {
                    "id": org["id"],
                    "name": org["org_name"],
                    "department": dept_name,
                    "username": org["username"],
                    "password": org["password"],
                    "date": str(org.get("accreditation_date")),
                    "status": org.get("status"),
                    "created_by": org.get("created_by"),
                }
            )
    return jsonify({"organizations": orgs})


@osas.route("/api/archive/empty", methods=["DELETE"])
def empty_archive():
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401

    try:
        admin = get_admin_data(session["osas_admin"])
        admin_id = admin["id"] if admin else None
        supabase.table("organizations").delete().eq("status", "Archived").execute()

        if admin_id:
            log_activity(admin_id, "archive", "Emptied organization archive")

        return jsonify({"message": "Archive emptied successfully"}), 200
    except Exception as e:
        print("Error emptying archive:", e)
        return jsonify({"error": "Failed to empty archive"}), 500


@osas.route("/add_organization", methods=["POST"])
def add_organization():
    if "osas_admin" not in session:
        return jsonify({"error": "Login required"}), 401

    data = request.get_json()
    org_name = data.get("orgName")
    username = data.get("username") or generate_username()
    password = data.get("password") or generate_password()
    accreditation_date = data.get("accreditationDate")
    status = "Active"
    department_id = data.get("department_id")
    admin = get_admin_data(session["osas_admin"])

    # check duplicate
    existing = (
        supabase.table("organizations")
        .select("id")
        .or_(f"org_name.eq.{org_name},username.eq.{username}")
        .execute()
    )
    if existing.data and len(existing.data) > 0:
        return jsonify({"error": "Organization name or username already exists"}), 400

    hashed_password = generate_password_hash(password)
    org_result = (
        supabase.table("organizations")
        .insert(
            {
                "org_name": org_name,
                "username": username,
                "password": hashed_password,
                "accreditation_date": accreditation_date,
                "status": status,
                "department_id": department_id,
                "must_change_password": True,
                "created_by": admin["id"] if admin else None,
            }
        )
        .execute()
    )

    new_org_id = None
    if (
        org_result.data
        and isinstance(org_result.data, list)
        and len(org_result.data) > 0
    ):
        new_org_id = org_result.data[0]["id"]

    # --- auto-create initial financial report row ---
    if new_org_id:
        initial_report = {
            "organization_id": new_org_id,
            "status": "Pending Review",
            "notes": "",
            "checklist": {},  # empty months
            "submission_date": accreditation_date
            or datetime.utcnow().date().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        supabase.table("financial_reports").insert(initial_report).execute()

        dept_name = "-"

        if department_id:
            d = (
                supabase.table("departments")
                .select("dept_name")
                .eq("id", department_id)
                .execute()
            )
            if d.data and isinstance(d.data, list) and d.data:
                dept_name = d.data[0].get("dept_name") or "-"

        if admin:
            log_activity(
                admin["id"],
                "organization",
                f'Added new organization: "{org_name}" in {dept_name}',
            )

        return (
            jsonify(
                {
                    "message": "Organization added",
                    "username": username,
                    "password": password,
                }
            ),
            201,
        )


@osas.route("/api/organizations/<int:org_id>", methods=["PUT"])
def update_organization(org_id):
    if "osas_admin" not in session:
        return jsonify({"error": "Login required"}), 401
    data = request.get_json()
    update_data = {
        "org_name": data.get("orgName"),
        "username": data.get("username"),
        "password": (
            generate_password_hash(data.get("password"))
            if data.get("password")
            else None
        ),
        "accreditation_date": data.get("accreditationDate"),
        "status": "Active",
        "department_id": data.get("department_id"),
    }
    update_data = {k: v for k, v in update_data.items() if v is not None}
    result = supabase.table("organizations").select("*").eq("id", org_id).execute()
    old_org = result.data[0] if result.data and isinstance(result.data, list) else {}
    supabase.table("organizations").update(update_data).eq("id", org_id).execute()
    admin = get_admin_data(session["osas_admin"])
    if admin:
        for key in update_data:
            old = old_org.get(key)
            new = update_data[key]
            if old != new:
                log_admin_audit(admin["id"], key, old, new)
        log_activity(admin["id"], "organization", f"Updated organization [{org_id}]")
    return jsonify({"message": "Organization updated"})


@osas.route("/api/organizations/<int:org_id>", methods=["DELETE"])
def archive_organization(org_id):
    if "osas_admin" not in session:
        return jsonify({"error": "Login required"}), 401
    supabase.table("organizations").update({"status": "Archived"}).eq(
        "id", org_id
    ).execute()
    admin = get_admin_data(session["osas_admin"])
    if admin:
        log_activity(admin["id"], "organization", f"Archived organization [{org_id}]")
    return jsonify({"message": "Organization archived"})


@osas.route("/api/archive/organizations/<int:org_id>", methods=["DELETE"])
def permanently_delete_organization(org_id):
    if "osas_admin" not in session:
        return jsonify({"error": "Login required"}), 401
    try:
        supabase.table("organizations").delete().eq("id", org_id).execute()

        admin = get_admin_data(session["osas_admin"])
        if admin:
            log_activity(
                admin["id"], "archive", f"Permanently deleted organization [{org_id}]"
            )

        return jsonify({"message": "Organization permanently deleted"}), 200
    except Exception as e:
        print("Error permanently deleting org:", e)
        return jsonify({"error": "Failed to permanently delete organization"}), 500


@osas.route("/api/organizations/<int:org_id>/restore", methods=["PATCH"])
def restore_organization(org_id):
    if "osas_admin" not in session:
        return jsonify({"error": "Login required"}), 401
    supabase.table("organizations").update({"status": "Active"}).eq(
        "id", org_id
    ).execute()
    admin = get_admin_data(session["osas_admin"])
    if admin:
        log_activity(admin["id"], "organization", f"Restored organization [{org_id}]")
    return jsonify({"message": "Organization restored"})


# ========== DEPARTMENTS API ===========
@osas.route("/api/departments", methods=["GET"])
def get_departments():
    try:
        result = supabase.table("departments").select("id,dept_name").execute()
        print(result)  # See output in console
        departments = [
            {"id": d["id"], "name": d["dept_name"]}
            for d in result.data
            if isinstance(result.data, list)
        ]
        return jsonify({"departments": departments})
    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

@osas.route("/reports/<int:org_id>/months/<string:month_key>/view", methods=["GET"])
def osas_view_monthly_report(org_id, month_key):
    if "osas_admin" not in session:
        return redirect(url_for("osas.osas_login"))

    # 1) hanapin PRES financial_reports row para sa buwang iyon
    pres_res = (
        supabase.table("financial_reports")
        .select("*")
        .eq("organization_id", org_id)
        .eq("report_month", month_key.lower())
        .not_.is_("wallet_id", None)
        .not_.is_("budget_id", None)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not pres_res.data:
        return "No report", 404

    rep = pres_res.data[0]
    wallet_id = rep["wallet_id"]
    budget_id = rep["budget_id"]

    # 2) org + college (same as PRES)
    org_res = (
        supabase.table("organizations")
        .select("org_name, department_id")
        .eq("id", org_id)
        .single()
        .execute()
    )
    org_data = org_res.data or {}
    org_name = org_data.get("org_name") or ""
    college_name = "COLLEGE"
    dept_id = org_data.get("department_id")
    if dept_id is not None:
        dept_res = (
            supabase.table("departments")
            .select("dept_name")
            .eq("id", dept_id)
            .single()
            .execute()
        )
        if dept_res.data:
            college_name = dept_res.data["dept_name"].upper()

    # 3) month text (wallet_budgets + months)
    wb_res = (
        supabase.table("wallet_budgets")
        .select("year, month_id, months (month_name)")
        .eq("id", budget_id)
        .single()
        .execute()
    )
    report_month_text = ""
    if wb_res.data:
        y = wb_res.data["year"]
        mname = wb_res.data["months"]["month_name"]
        report_month_text = f"{mname} {y}".upper()

    # 4) numeric fields gaya ng PRES
    budget_val = float(rep.get("budget") or 0)
    total_expense = float(rep.get("total_expense") or 0)
    reimb = float(rep.get("reimbursement") or 0)
    prev_fund = float(rep.get("previous_fund") or 0)
    remaining = budget_val - total_expense - reimb + prev_fund
    total_income = float(rep.get("total_income") or 0)
    budget_in_the_bank = float(rep.get("budget_in_the_bank") or 0)

    # 5) transactions + incomes (same queries as PRES print) [file:2]
    tx_res = (
        supabase.table("wallet_transactions")
        .select("date_issued, quantity, particulars, description, price, kind")
        .eq("wallet_id", wallet_id)
        .eq("budget_id", budget_id)
        .eq("kind", "expense")
        .order("date_issued")
        .execute()
    )
    transactions = tx_res.data or []

    inc_res = (
        supabase.table("wallet_transactions")
        .select("date_issued, quantity, income_type, description, price, kind")
        .eq("wallet_id", wallet_id)
        .eq("budget_id", budget_id)
        .eq("kind", "income")
        .order("date_issued")
        .execute()
    )
    incomes = inc_res.data or []

    rc_res = (
        supabase.table("wallet_receipts")
        .select("description, receipt_date, file_url")
        .eq("wallet_id", wallet_id)
        .eq("budget_id", budget_id)
        .order("receipt_date")
        .execute()
    )
    receipts = rc_res.data or []

    # 6) render same HTML template na gamit ng PRES
    # path: pres_view/templates/pres/print_report.html  [file:2]
    return render_template(
        "pres/print_report.html",
        report=rep,
        transactions=transactions,
        incomes=incomes,
        receipts=receipts,
        budget=budget_val,
        totalexpense=total_expense,
        totalincome=total_income,
        reimbursement=reimb,
        previous_fund=prev_fund,
        remaining=remaining,
        budget_in_the_bank=budget_in_the_bank,
        org_name=org_name,
        college_name=college_name,
        report_month_text=report_month_text,
    )

# ========== FINANCIAL REPORTS API ===========
@osas.route("/api/organizations/<int:org_id>/financial_reports", methods=["GET"])
def get_financial_reports_by_org(org_id):
    """
    OSAS master rows lang (walang wallet_id / budget_id).
    Isang row per org na may checklist + status sa buong taon.
    """
    results = (
        supabase.table("financial_reports")
        .select("*")
        .eq("organization_id", org_id)
        .is_("wallet_id", None)   # huwag isama PRES rows
        .is_("budget_id", None)
        .order("created_at", desc=True)
        .execute()
    )
    reports = results.data or []
    return jsonify({"reports": reports})


@osas.route("/api/organizations/<int:org_id>/financial_reports", methods=["POST"])
def create_financial_report_by_org(org_id):
    """
    Gumagawa ng master OSAS financial_reports row para sa org na ito.
    Walang wallet_id/budget_id, may checklist per month + notes/status.
    """
    if "osas_admin" not in session:
        return jsonify({"error": "Login required"}), 401

    data = request.get_json() or {}
    report = {
        "organization_id": org_id,
        "status": data.get("status") or "Pending Review",
        "notes": data.get("notes") or "",
        "checklist": data.get("checklist") or {},
        "submission_date": data.get("submission_date")
        or datetime.utcnow().date().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "wallet_id": None,
        "budget_id": None,
    }
    inserted = supabase.table("financial_reports").insert(report).execute()
    return jsonify({"message": "Financial report created", "report": inserted.data[0]})


@osas.route("/api/financial_reports/<int:report_id>", methods=["PUT"])
def update_financial_report(report_id):
    """
    Update OSAS master row: notes + checklist per month, then recompute status.
    """
    if "osas_admin" not in session:
        return jsonify({"error": "Login required"}), 401

    data = request.get_json() or {}
    update_data = {}

    # load existing report for checklist manipulation
    res = supabase.table("financial_reports").select("*").eq("id", report_id).execute()
    if not res.data:
        return jsonify({"error": "Not found"}), 404
    report = res.data[0]
    checklist = report.get("checklist") or {}

    # admin notes
    if "notes" in data:
        update_data["notes"] = data["notes"]

    # explicit checklist overwrite (optional)
    if "checklist" in data:
        checklist = data["checklist"] or checklist

    # receive single month from modal
    receive_month = data.get("receiveMonth")
    if receive_month:
        checklist[receive_month] = True

    # mark all months complete from "Mark as Complete" button
    if data.get("completeAll"):
        for key in [
            "august", "september", "october", "november", "december",
            "january", "february", "march", "april", "may",
        ]:
            checklist[key] = True

    update_data["checklist"] = checklist

    # recompute status based on checklist (same logic as PRES submit) [file:2]
    month_keys = [
        "august", "september", "october", "november", "december",
        "january", "february", "march", "april", "may",
    ]
    received_count = sum(1 for k in month_keys if checklist.get(k))
    total_count = len(month_keys)
    if received_count == 0:
        update_data["status"] = "Pending Review"
    elif received_count < total_count:
        update_data["status"] = "In Review"
    else:
        update_data["status"] = "Completed"

    update_data["updated_at"] = datetime.utcnow().isoformat()

    try:
        supabase.table("financial_reports").update(update_data).eq("id", report_id).execute()
        return jsonify({"message": "Financial report updated", "updated": update_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@osas.route("/api/financial_reports/<int:report_id>", methods=["GET"])
def get_single_financial_report(report_id):
    """
    Kunin isang OSAS master financial report row by id.
    """
    result = (
        supabase.table("financial_reports")
        .select("*")
        .eq("id", report_id)
        .execute()
    )
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data[0])


@osas.route(
    "/api/financial_reports/<int:org_id>/months/<string:month_key>/download",
    methods=["GET"],
)
def download_monthly_report(org_id, month_key):
    if "osas_admin" not in session:
        return "Not authorized", 401

    try:
        # 1. Hanapin PRES financial_reports row para sa buwang iyon
        pres_res = (
            supabase.table("financial_reports")
            .select("*")
            .eq("organization_id", org_id)
            .eq("report_month", month_key.lower())
            .not_.is_("wallet_id", None)
            .not_.is_("budget_id", None)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not pres_res.data:
            return "Report not found", 404

        rep = pres_res.data[0]
        wallet_id = rep["wallet_id"]
        budget_id = rep["budget_id"]

        # 2. Org + college name (pareho sa PRES)
        org_res = (
            supabase.table("organizations")
            .select("org_name, department_id")
            .eq("id", org_id)
            .single()
            .execute()
        )
        org_data = org_res.data or {}
        org_name = org_data.get("org_name") or ""

        college_name = "COLLEGE"
        dept_id = org_data.get("department_id")
        if dept_id is not None:
            dept_res = (
                supabase.table("departments")
                .select("dept_name")
                .eq("id", dept_id)
                .single()
                .execute()
            )
            if dept_res.data:
                college_name = dept_res.data["dept_name"].upper()

        # 3. Month text (wallet_budgets + months)
        wb_res = (
            supabase.table("wallet_budgets")
            .select("year, month_id, months (month_name)")
            .eq("id", budget_id)
            .single()
            .execute()
        )
        report_month_text = ""
        if wb_res.data:
            y = wb_res.data["year"]
            mname = wb_res.data["months"]["month_name"]
            report_month_text = f"{mname} {y}".upper()

        # 4. Load DOCX template (same as PRES)
        base_dir = os.path.dirname(__file__)
        template_path = os.path.join(
            base_dir,
            "templates",
            "osas",
            "finance_report_template.docx",
        )
        doc = Document(template_path)

        def replace_all(old: str, new: str):
            if new is None:
                new = ""
            for p in doc.paragraphs:
                if old in p.text:
                    for run in p.runs:
                        run.text = run.text.replace(old, new)
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if old in cell.text:
                            for p in cell.paragraphs:
                                for run in p.runs:
                                    run.text = run.text.replace(old, new)

        # 5. Numeric fields
        budget_val = float(rep.get("budget") or 0)
        total_expense = float(rep.get("total_expense") or 0)
        reimb = float(rep.get("reimbursement") or 0)
        prev_fund = float(rep.get("previous_fund") or 0)
        remaining = budget_val - total_expense - reimb + prev_fund
        total_income = float(rep.get("total_income") or 0)
        budget_in_the_bank = float(rep.get("budget_in_the_bank") or 0)

        # 6. Header placeholders
        replace_all("{{TOTAL_INCOME}}", f"PHP {total_income:,.2f}")
        replace_all("{{BUDGET_IN_THE_BANK}}", f"PHP {budget_in_the_bank:,.2f}")
        replace_all("{{COLLEGE_NAME}}", college_name)
        replace_all("{{ORG_NAME}}", org_name)
        replace_all("{{EVENT_NAME}}", rep.get("event_name") or "")
        replace_all("{{REPORT_MONTH}}", report_month_text)
        replace_all("{{DATE_PREPARED}}", str(rep.get("date_prepared") or ""))
        replace_all("{{REPORT_NO}}", rep.get("report_no") or "")
        replace_all("{{BUDGET}}", f"PHP {budget_val:,.2f}")
        replace_all("{{TOTAL_EXPENSE}}", f"PHP {total_expense:,.2f}")
        replace_all("{{REIMBURSEMENT}}", f"PHP {reimb:,.2f}")
        replace_all("{{PREVIOUS_FUND}}", f"PHP {prev_fund:,.2f}")
        replace_all("{{TOTAL_REMAINING}}", f"PHP {remaining:,.2f}")

        # 7. INCOME transactions (same as PRES)
        income_res = (
            supabase.table("wallet_transactions")
            .select("date_issued, quantity, income_type, description, price, kind")
            .eq("wallet_id", wallet_id)
            .eq("budget_id", budget_id)
            .eq("kind", "income")
            .order("date_issued")
            .execute()
        )
        incomes = income_res.data or []

        income_table = None
        for table in doc.tables:
            if len(table.rows) < 2:
                continue
            header_row = table.rows[1]
            header_text = " ".join(cell.text for cell in header_row.cells).upper()
            if "TYPE OF INCOME" in header_text and "DATE ISSUED" in header_text:
                income_table = table
                break

        # 8. EXPENSE transactions (same as PRES)
        tx_res = (
            supabase.table("wallet_transactions")
            .select("date_issued, quantity, particulars, description, price, kind")
            .eq("wallet_id", wallet_id)
            .eq("budget_id", budget_id)
            .eq("kind", "expense")
            .order("date_issued")
            .execute()
        )
        txs = tx_res.data or []

        expenses_table = None
        for table in doc.tables:
            if len(table.rows) < 2:
                continue
            header_row = table.rows[1]
            first_row_text = "".join(cell.text for cell in header_row.cells).upper()
            if "DATE ISSUED" in first_row_text and "PARTICULARS" in first_row_text:
                expenses_table = table
                break

        # 9. Fill EXPENSES table (header row 1, summary row 2)
        if expenses_table:
            while len(expenses_table.rows) > 3:
                expenses_table._tbl.remove(expenses_table.rows[2]._tr)

            from datetime import datetime as dtlocal

            def fmtdate(d):
                try:
                    return dtlocal.fromisoformat(d).strftime("%Y-%m-%d")
                except Exception:
                    return d or ""

            lastdate = None
            summaryrow = expenses_table.rows[2]  # row 2 = Total Amount of Expenses

            for tx in txs:
                newrow = expenses_table.add_row()
                expenses_table._tbl.remove(newrow._tr)
                summaryrow._tr.addprevious(newrow._tr)

                datecell, qtycell, partcell, desccell, totalcell = newrow.cells

                datestr = tx.get("date_issued")
                showdate = fmtdate(datestr)
                if datestr == lastdate:
                    datecell.text = ""
                else:
                    datecell.text = showdate
                    lastdate = datestr

                qtycell.text = str(tx.get("quantity") or "")
                partcell.text = tx.get("particulars") or ""
                desccell.text = tx.get("description") or ""

                qty = float(tx.get("quantity") or 0)
                price = float(tx.get("price") or 0)
                linetotal = qty * price
                totalcell.text = f"PHP {linetotal:,.2f}"

            summaryrow.cells[-1].text = f"PHP {total_expense:,.2f}"

        # 10. Fill INCOME table (header row 1, summary row 2)
        if income_table:
            while len(income_table.rows) > 3:
                income_table._tbl.remove(income_table.rows[2]._tr)

            from datetime import datetime as _dt_local

            def fmt_date_income(d):
                try:
                    return _dt_local.fromisoformat(d).strftime("%Y-%m-%d")
                except Exception:
                    return d or ""

            last_date_inc = None
            summary_row_inc = income_table.rows[2]  # row 2 = Total Amount of Income

            for tx in incomes:
                new_row = income_table.add_row()
                income_table._tbl.remove(new_row._tr)
                summary_row_inc._tr.addprevious(new_row._tr)

                date_cell, qty_cell, type_cell, desc_cell, price_cell = new_row.cells

                date_str = tx.get("date_issued")
                show_date = fmt_date_income(date_str)
                if date_str == last_date_inc:
                    date_cell.text = ""
                else:
                    date_cell.text = show_date
                    last_date_inc = date_str

                qty_cell.text = str(tx.get("quantity") or "")
                type_cell.text = tx.get("income_type") or ""
                desc_cell.text = tx.get("description") or ""

                price = float(tx.get("price") or 0)
                price_cell.text = f"PHP {price:,.2f}"

            summary_row_inc.cells[-1].text = f"PHP {total_income:,.2f}"

        # 11. Receipts appendix with pictures
        rc_res = (
            supabase.table("wallet_receipts")
            .select("description, file_url, receipt_date")
            .eq("wallet_id", wallet_id)
            .eq("budget_id", budget_id)
            .order("receipt_date")
            .execute()
        )
        receipts = rc_res.data or []

        if receipts:
            from docx.shared import Inches

            doc.add_page_break()
            title_p = doc.add_paragraph()
            title_run = title_p.add_run("APPENDIX A - RECEIPTS")
            title_run.bold = True

            for r in receipts:
                file_path = r["file_url"]
                try:
                    file_bytes = supabase.storage.from_("Receipts").download(file_path)
                except Exception:
                    continue

                # caption
                capp = doc.add_paragraph()
                capp.add_run(f"{r['receipt_date']} - {r['description']}")

                # image
                img_stream = BytesIO(file_bytes)
                doc.add_picture(img_stream, width=Inches(4))
                doc.add_paragraph()  # spacer

        # 12. Send DOCX
        buf = BytesIO()
        doc.save(buf)
        buf.seek(0)
        filename = f"financial_report_{month_key}.docx"
        return send_file(
            buf,
            as_attachment=True,
            download_name=filename,
            mimetype=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ========== ADMIN/SETTINGS ===========
@osas.route("/api/admin/profile", methods=["GET"])
def get_profile():
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401
    username = session["osas_admin"]
    admin = (
        supabase.table("osas_admin")
        .select("username,full_name,email")
        .eq("username", username)
        .execute()
    )
    if admin.data:
        return jsonify(admin.data[0])
    return jsonify({"error": "Not found"}), 404


@osas.route("/api/admin/profile", methods=["PUT"])
def update_profile():
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401

    username = session["osas_admin"]
    data = request.get_json()
    update_data = {}
    old_admin = get_admin_data(username)

    if data.get("full_name") and data["full_name"] != old_admin.get("full_name"):
        update_data["full_name"] = data["full_name"]
        log_admin_audit(
            old_admin["id"], "full_name", old_admin.get("full_name"), data["full_name"]
        )

    if data.get("email") and data["email"] != old_admin.get("email"):
        update_data["email"] = data["email"]
        log_admin_audit(old_admin["id"], "email", old_admin.get("email"), data["email"])

    # Handle username change and uniqueness check
    if data.get("username") and data["username"] != username:
        existing = (
            supabase.table("osas_admin")
            .select("id")
            .eq("username", data["username"])
            .execute()
        )
        if existing.data:
            return jsonify({"error": "Username already exists."}), 400
        update_data["username"] = data["username"]
        log_admin_audit(
            old_admin["id"], "username", old_admin.get("username"), data["username"]
        )
        session["osas_admin"] = data["username"]

    if update_data:
        supabase.table("osas_admin").update(update_data).eq(
            "username", username
        ).execute()
        new_user = update_data.get("username", username)
    else:
        new_user = username

    admin = get_admin_data(new_user)
    if admin:
        log_activity(admin["id"], "settings", "Profile updated")
    return jsonify({"message": "Profile updated!", "updated": update_data})


@osas.route("/api/admin/password", methods=["POST"])
def change_password():
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401
    username = session["osas_admin"]
    data = request.get_json()
    current_pw = data.get("currentPassword")
    new_pw = data.get("newPassword")
    admin = get_admin_data(username)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    if not check_password_hash(admin["password"], current_pw):
        return jsonify({"error": "Current password incorrect"}), 400
    hashed = generate_password_hash(new_pw)
    supabase.table("osas_admin").update({"password": hashed}).eq(
        "username", username
    ).execute()
    log_admin_audit(admin["id"], "password", None, "[UPDATED]")
    log_activity(admin["id"], "security", "Changed password")
    return jsonify({"message": "Password changed"})


@osas.route("/api/admin/activity", methods=["GET"])
def get_activity():
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401
    username = session["osas_admin"]
    admin = get_admin_data(username)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    admin_id = admin["id"]
    action_type = request.args.get("type")
    activity_date = request.args.get("date")
    query = supabase.table("osas_activity_log").select("*").eq("admin_id", admin_id)
    if action_type and action_type.lower() != "all":
        query = query.eq("action_type", action_type)
    if activity_date:
        query = query.gte("created_at", activity_date + "T00:00:00").lte(
            "created_at", activity_date + "T23:59:59"
        )
    logs = query.order("created_at", desc=True).limit(50).execute()
    return jsonify(logs.data if logs.data else [])


@osas.route("/api/admin/sessions", methods=["GET"])
def get_admin_sessions():
    if "osas_admin" not in session:
        return jsonify({"error": "Not logged in"}), 401
    admin = get_admin_data(session["osas_admin"])
    sessions = []
    if admin:
        result = (
            supabase.table("osas_sessions")
            .select("*")
            .eq("admin_id", admin["id"])
            .order("last_active_at", desc=True)
            .execute()
        )
        sessions = result.data
    return jsonify({"sessions": sessions})


@osas.route("/api/admin/request_password_reset", methods=["POST"])
def request_password_reset():
    data = request.get_json()
    username = data.get("username")
    admin = get_admin_data(username)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    token = str(uuid.uuid4())
    expires_at = (datetime.utcnow()).isoformat()
    supabase.table("osas_password_resets").insert(
        {
            "admin_id": admin["id"],
            "token": token,
            "expires_at": expires_at,
            "used": False,
        }
    ).execute()
    return jsonify({"message": "Password reset token generated", "token": token})


@osas.route("/api/admin/reset_password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get("token")
    new_pw = data.get("new_password")
    row = (
        supabase.table("osas_password_resets")
        .select("*")
        .eq("token", token)
        .eq("used", False)
        .execute()
    )
    if not row.data or not new_pw:
        return jsonify({"error": "Invalid token or password"}), 400
    admin_id = row.data[0]["admin_id"]
    hashed = generate_password_hash(new_pw)
    supabase.table("osas_admin").update({"password": hashed}).eq(
        "id", admin_id
    ).execute()
    supabase.table("osas_password_resets").update({"used": True}).eq(
        "token", token
    ).execute()
    log_admin_audit(admin_id, "password", None, "[RESET]")
    log_activity(admin_id, "security", "Password reset via token")
    return jsonify({"message": "Password reset successful"})
