"""
PockiTrack Desktop — PRES (Organization Side)
Run: python pres_desktop.py
Logo file: place 671433942_27312238625051044_6853393097405090621_n.png
           in the same folder and rename to pocki_logo.png
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from supabase import create_client
from dotenv import load_dotenv
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime
import os, re

try:
    from PIL import Image, ImageTk
    PIL_OK = True
except ImportError:
    PIL_OK = False

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# ─────────────────────────────────────────
# DESIGN TOKENS  (exact match to CSS)
# ─────────────────────────────────────────
BG          = "#F5F1E8"   # body / sidebar background
WHITE       = "#FFFFFF"
ACTIVE_NAV  = "#A24A00"   # nav-item.active
AMBER       = "#E59E2C"   # accent / hover
AMBER_LIGHT = "#F3D58D"   # summary card gradient start
CREAM       = "#ECDDC6"   # borders / hover bg
TEXT_DARK   = "#000000"
TEXT_MUTE   = "#616161"
TEXT_GRAY   = "#828282"
GREEN_OK    = "#2E7D32"
RED_ERR     = "#C62828"
FONT_MAIN   = ("Poppins", 10)
FONT_BOLD   = ("Poppins", 10, "bold")
FONT_TITLE  = ("Georgia", 22, "italic")   # Playfair Display substitute

MONTH_KEYS = [
    "august","september","october","november","december",
    "january","february","march","april","may",
]
MONTH_LABELS = {k: k.capitalize() for k in MONTH_KEYS}

# ─────────────────────────────────────────
# STYLE HELPERS
# ─────────────────────────────────────────
def styled_btn(parent, text, cmd, bg=ACTIVE_NAV, fg=WHITE, font=FONT_MAIN, **kw):
    b = tk.Button(parent, text=text, command=cmd, bg=bg, fg=fg,
                  font=font, relief="flat", cursor="hand2",
                  activebackground=AMBER, activeforeground=WHITE,
                  padx=14, pady=6, **kw)
    return b

def section_label(parent, text, **kw):
    return tk.Label(parent, text=text, bg=BG, fg=TEXT_DARK,
                    font=("Poppins", 9), **kw)

def card_frame(parent, **kw):
    return tk.Frame(parent, bg=WHITE, relief="flat",
                    highlightbackground=CREAM,
                    highlightthickness=1, **kw)


# ─────────────────────────────────────────
# ICON LOADER
# ─────────────────────────────────────────
_icon_cache = {}
def load_icon(path, size=(20,20)):
    key = (path, size)
    if key in _icon_cache:
        return _icon_cache[key]
    if PIL_OK and os.path.exists(path):
        img = Image.open(path).resize(size, Image.LANCZOS)
        photo = ImageTk.PhotoImage(img)
        _icon_cache[key] = photo
        return photo
    return None


# ═══════════════════════════════════════════════════════════
# LOGIN WINDOW
# ═══════════════════════════════════════════════════════════
class LoginWindow(tk.Toplevel):
    def __init__(self, parent, on_success):
        super().__init__(parent)
        self.on_success = on_success
        self.title("PockiTrack | Login")
        self.geometry("460x520")
        self.resizable(False, False)
        self.configure(bg=BG)
        self.grab_set()

        # ── logo top-left ──
        logo_row = tk.Frame(self, bg=BG)
        logo_row.place(x=14, y=14)
        self._set_logo(logo_row)

        # ── white login box ──
        box = tk.Frame(self, bg=WHITE, bd=0,
                       highlightbackground="#E0E0E0", highlightthickness=1)
        box.place(relx=0.5, rely=0.52, anchor="center", width=390, height=400)

        tk.Label(box, text="Log in", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins", 22, "bold")).pack(pady=(30,4))
        tk.Label(box, text="Enter your details to sign in to your account.",
                 bg=WHITE, fg=TEXT_GRAY, font=("Poppins", 10)).pack(pady=(0,20))

        form = tk.Frame(box, bg=WHITE)
        form.pack(padx=40, fill="x")

        section_label(form, "Username").pack(anchor="w")
        self.username_var = tk.StringVar()
        un_entry = tk.Entry(form, textvariable=self.username_var,
                            font=("Poppins", 11), relief="flat",
                            highlightbackground=CREAM, highlightthickness=1)
        un_entry.pack(fill="x", ipady=6, pady=(2,12))
        un_entry.bind("<FocusIn>",  lambda e: un_entry.config(highlightbackground=AMBER))
        un_entry.bind("<FocusOut>", lambda e: un_entry.config(highlightbackground=CREAM))

        section_label(form, "Password").pack(anchor="w")
        pw_row = tk.Frame(form, bg=WHITE,
                          highlightbackground=CREAM, highlightthickness=1)
        pw_row.pack(fill="x", pady=(2,8))
        self.pw_var = tk.StringVar()
        pw_entry = tk.Entry(pw_row, textvariable=self.pw_var,
                            show="*", font=("Poppins", 11), relief="flat", bd=0)
        pw_entry.pack(side="left", fill="x", expand=True, ipady=6, padx=(6,0))
        pw_entry.bind("<FocusIn>",  lambda e: pw_row.config(highlightbackground=AMBER))
        pw_entry.bind("<FocusOut>", lambda e: pw_row.config(highlightbackground=CREAM))

        self.show_pw = False
        def toggle_pw():
            self.show_pw = not self.show_pw
            pw_entry.config(show="" if self.show_pw else "*")
            eye_btn.config(text="🙈" if self.show_pw else "👁")
        eye_btn = tk.Button(pw_row, text="👁", font=("Poppins",10),
                            bg=WHITE, relief="flat", cursor="hand2", command=toggle_pw)
        eye_btn.pack(side="right", padx=4)

        tk.Label(form, text="Forgot password?", bg=WHITE, fg=ACTIVE_NAV,
                 font=("Poppins", 9), cursor="hand2").pack(anchor="e", pady=(0,4))

        self.err_label = tk.Label(box, text="", bg=WHITE, fg=RED_ERR,
                                  font=("Poppins", 9))
        self.err_label.pack()

        login_btn = tk.Button(box, text="Log in", command=self._login,
                              bg=AMBER_LIGHT, fg=TEXT_DARK, font=("Poppins",13,"bold"),
                              relief="flat", cursor="hand2", bd=1,
                              activebackground=AMBER, activeforeground=WHITE)
        login_btn.pack(padx=40, fill="x", ipady=6, pady=16)
        self.bind("<Return>", lambda e: self._login())

    def _set_logo(self, parent):
        logo_img = load_icon("pocki_logo.png", (40, 40))
        if logo_img:
            lbl = tk.Label(parent, image=logo_img, bg=BG)
            lbl.image = logo_img
            lbl.pack(side="left")
        tk.Label(parent, text="PockiTrack", bg=BG, fg=TEXT_DARK,
                 font=("Poppins", 16, "bold")).pack(side="left", padx=6)

    def _login(self):
        username = self.username_var.get().strip()
        password = self.pw_var.get().strip()
        if not username or not password:
            self.err_label.config(text="Please enter username and password.")
            return
        try:
            result = supabase.table("organizations").select("*")\
                             .eq("username", username).execute()
            if not result.data:
                self.err_label.config(text="Organization not found.")
                return
            org = result.data[0]
            if org.get("status") == "Archived":
                self.err_label.config(text="This account is archived. Contact OSAS.")
                return
            if not check_password_hash(org["password"], password):
                self.err_label.config(text="Incorrect password.")
                return
            self.destroy()
            self.on_success(org)
        except Exception as e:
            self.err_label.config(text=str(e)[:60])


# ═══════════════════════════════════════════════════════════
# SIDEBAR
# ═══════════════════════════════════════════════════════════
class Sidebar(tk.Frame):
    NAV = [
        ("🏠", "Home",    "home"),
        ("📋", "History", "history"),
        ("👛", "Wallets", "wallets"),
        ("👤", "Profile", "profile"),
    ]

    def __init__(self, parent, org, on_navigate, on_logout):
        super().__init__(parent, bg=BG, width=230)
        self.pack_propagate(False)
        self.org         = org
        self.on_navigate = on_navigate
        self._btns       = {}
        self._active     = None

        # logo
        logo_frame = tk.Frame(self, bg=BG)
        logo_frame.pack(anchor="w", padx=14, pady=(14,0))
        logo_img = load_icon("pocki_logo.png", (44,44))
        if logo_img:
            lbl = tk.Label(logo_frame, image=logo_img, bg=BG)
            lbl.image = logo_img
            lbl.pack(side="left")
        tk.Label(logo_frame, text="PockiTrack", bg=BG, fg=TEXT_DARK,
                 font=("Poppins", 16, "bold")).pack(side="left", padx=6)

        # nav items
        nav_frame = tk.Frame(self, bg=BG)
        nav_frame.pack(anchor="w", padx=0, pady=(30,0), fill="x")
        for emoji, label, key in self.NAV:
            btn = tk.Button(nav_frame, text=f"  {emoji}  {label}",
                            anchor="w", font=("Poppins", 11),
                            bg=BG, fg=TEXT_MUTE, relief="flat",
                            cursor="hand2", bd=0,
                            activebackground=CREAM,
                            command=lambda k=key: self._nav(k))
            btn.pack(fill="x", padx=14, pady=3, ipady=8)
            self._btns[key] = btn

        # logout
        tk.Frame(self, bg=CREAM, height=1).pack(fill="x", padx=20, pady=20)
        logout_btn = tk.Button(self, text="  ⎋  Logout",
                               anchor="w", font=("Poppins",11),
                               bg=WHITE, fg=TEXT_MUTE, relief="flat",
                               cursor="hand2", bd=0,
                               activebackground=ACTIVE_NAV,
                               activeforeground=WHITE,
                               command=on_logout)
        logout_btn.pack(fill="x", padx=14, pady=4, ipady=8)

    def _nav(self, key):
        if self._active and self._active in self._btns:
            self._btns[self._active].config(bg=BG, fg=TEXT_MUTE)
        self._btns[key].config(bg=ACTIVE_NAV, fg=WHITE)
        self._active = key
        self.on_navigate(key)

    def set_active(self, key):
        self._nav(key)


# ═══════════════════════════════════════════════════════════
# HOME / DASHBOARD
# ═══════════════════════════════════════════════════════════
class HomeTab(tk.Frame):
    def __init__(self, parent, org):
        super().__init__(parent, bg=WHITE)
        self.org = org
        self._build()
        self.load()

    def _build(self):
        # header
        hdr = tk.Frame(self, bg=WHITE)
        hdr.pack(fill="x", padx=30, pady=(24,0))
        now = datetime.now()
        tk.Label(hdr, text=f"Hello, {self.org.get('org_name','')}",
                 bg=WHITE, fg=TEXT_DARK, font=("Georgia", 22, "italic")).pack(anchor="w")
        tk.Label(hdr, text=now.strftime("%A, %B %d %Y"),
                 bg=WHITE, fg=TEXT_MUTE, font=("Poppins", 10)).pack(anchor="w")

        # summary gradient bar
        bar = tk.Frame(self, bg=AMBER_LIGHT, bd=0)
        bar.pack(fill="x", padx=30, pady=18)
        self._card_vars = {}
        cards = [
            ("total_balance",      "Total Balance",         "Php 0.00"),
            ("income_month",       "Income this month",     "Php 0.00"),
            ("expenses_month",     "Expenses this month",   "Php 0.00"),
            ("reports_submitted",  "Reports submitted",     "0"),
        ]
        for key, label, default in cards:
            c = tk.Frame(bar, bg="#ECB95D", padx=18, pady=14)
            c.pack(side="left", fill="both", expand=True, padx=6, pady=10)
            tk.Label(c, text=label, bg="#ECB95D", fg=TEXT_DARK,
                     font=("Poppins",9,"bold"), wraplength=130).pack(anchor="w")
            var = tk.StringVar(value=default)
            self._card_vars[key] = var
            tk.Label(c, textvariable=var, bg="#ECB95D", fg=TEXT_DARK,
                     font=("Poppins",12,"bold")).pack(anchor="w", pady=(4,0))

        # overview
        over = tk.Frame(self, bg=WHITE)
        over.pack(fill="both", expand=True, padx=30, pady=4)

        # wallets overview
        wl = tk.Frame(over, bg=WHITE)
        wl.pack(side="left", fill="both", expand=True, padx=(0,10))
        tk.Label(wl, text="Wallets Overview", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins",12,"bold")).pack(anchor="w", pady=(0,8))
        self._wallets_box = tk.Frame(wl, bg="#F9F9F9",
                                     highlightbackground=CREAM,
                                     highlightthickness=1)
        self._wallets_box.pack(fill="both", expand=True)

        # recent transactions
        tr = tk.Frame(over, bg=WHITE)
        tr.pack(side="left", fill="both", expand=True, padx=(10,0))
        tk.Label(tr, text="Transaction History", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins",12,"bold")).pack(anchor="w", pady=(0,8))
        self._tx_box = tk.Frame(tr, bg="#F9F9F9",
                                highlightbackground=CREAM,
                                highlightthickness=1)
        self._tx_box.pack(fill="both", expand=True)

        styled_btn(self, "↻  Refresh", self.load, bg=AMBER, font=("Poppins",9))\
            .pack(anchor="e", padx=30, pady=8)

    def load(self):
        org_id = self.org["id"]
        try:
            # wallets
            wres   = supabase.table("wallets").select("id,name")\
                              .eq("organization_id", org_id).execute()
            wallets    = wres.data or []
            wallet_ids = [w["id"] for w in wallets]

            income_all = expense_all = income_mo = expense_mo = 0.0
            now = datetime.now()
            txs_all = []

            if wallet_ids:
                tres = supabase.table("wallet_transactions")\
                               .select("kind,date_issued,quantity,price,description,wallet_id")\
                               .in_("wallet_id", wallet_ids).execute()
                for tx in (tres.data or []):
                    qty   = int(tx.get("quantity") or 0)
                    price = float(tx.get("price") or 0)
                    amt   = qty * price
                    if tx.get("kind") == "income":
                        income_all += amt
                    else:
                        expense_all += amt
                    d = tx.get("date_issued","")[:10]
                    try:
                        dt = datetime.strptime(d, "%Y-%m-%d")
                        if dt.year == now.year and dt.month == now.month:
                            if tx.get("kind") == "income":
                                income_mo += amt
                            else:
                                expense_mo += amt
                    except: pass
                    txs_all.append(tx)

                bres = supabase.table("wallet_budgets").select("amount,wallet_id")\
                               .in_("wallet_id", wallet_ids).execute()
                beginning = sum(float(b.get("amount") or 0) for b in (bres.data or []))
                total_bal = beginning + income_all - expense_all
            else:
                total_bal = 0.0

            rres = supabase.table("financial_reports")\
                           .select("id", count="exact")\
                           .eq("organization_id", org_id)\
                           .in_("status", ["Submitted","Approved"]).execute()
            reports = rres.count or 0

            # update summary cards
            self._card_vars["total_balance"].set(f"Php {total_bal:,.2f}")
            self._card_vars["income_month"].set(f"Php {income_mo:,.2f}")
            self._card_vars["expenses_month"].set(f"Php {expense_mo:,.2f}")
            self._card_vars["reports_submitted"].set(str(reports))

            # wallets list
            for w in self._wallets_box.winfo_children(): w.destroy()
            if wallets:
                for w in wallets[:5]:
                    row = tk.Frame(self._wallets_box, bg=WHITE,
                                   highlightbackground=CREAM, highlightthickness=1)
                    row.pack(fill="x", padx=8, pady=4)
                    tk.Label(row, text=f"👛  {w.get('name','')}", bg=WHITE,
                             fg=TEXT_DARK, font=("Poppins",10,"bold"),
                             padx=10, pady=8).pack(anchor="w")
            else:
                tk.Label(self._wallets_box, text="No wallets yet", bg="#F9F9F9",
                         fg=TEXT_MUTE, font=("Poppins",10)).pack(pady=30)

            # recent transactions
            for w in self._tx_box.winfo_children(): w.destroy()
            recent = sorted(txs_all,
                            key=lambda x: x.get("date_issued",""),
                            reverse=True)[:5]
            if recent:
                for tx in recent:
                    qty   = int(tx.get("quantity") or 0)
                    price = float(tx.get("price") or 0)
                    amt   = qty * price
                    kind  = tx.get("kind","")
                    color = GREEN_OK if kind == "income" else RED_ERR
                    sign  = "+" if kind == "income" else "-"
                    row   = tk.Frame(self._tx_box, bg=WHITE,
                                     highlightbackground=CREAM, highlightthickness=1)
                    row.pack(fill="x", padx=8, pady=3)
                    tk.Label(row, text=tx.get("description","")[:30],
                             bg=WHITE, fg=TEXT_DARK, font=("Poppins",9,"bold"),
                             padx=10, pady=4).pack(side="left")
                    tk.Label(row, text=f"{sign}Php {amt:,.2f}",
                             bg=WHITE, fg=color, font=("Poppins",9,"bold"),
                             padx=10).pack(side="right")
            else:
                tk.Label(self._tx_box, text="No transactions yet",
                         bg="#F9F9F9", fg=TEXT_MUTE,
                         font=("Poppins",10)).pack(pady=30)

        except Exception as e:
            messagebox.showerror("Dashboard Error", str(e))


# ═══════════════════════════════════════════════════════════
# HISTORY TAB
# ═══════════════════════════════════════════════════════════
class HistoryTab(tk.Frame):
    def __init__(self, parent, org):
        super().__init__(parent, bg=WHITE)
        self.org = org
        self._filter = "all"
        self._year   = datetime.now().year
        self._month  = datetime.now().month
        self._build()
        self.load()

    def _build(self):
        hdr = tk.Frame(self, bg=WHITE)
        hdr.pack(fill="x", padx=30, pady=(24,0))
        tk.Label(hdr, text="Transaction History", bg=WHITE, fg=TEXT_DARK,
                 font=("Georgia",22,"italic")).pack(anchor="w")

        # month selector
        nav_row = tk.Frame(self, bg=WHITE)
        nav_row.pack(pady=10)
        styled_btn(nav_row, "‹", self._prev_month, bg=CREAM, fg=TEXT_DARK,
                   font=("Poppins",14)).pack(side="left", padx=6)
        self._month_lbl = tk.Label(nav_row, bg=AMBER_LIGHT, fg=TEXT_DARK,
                                   font=("Poppins",11,"bold"),
                                   width=20, pady=8, relief="flat")
        self._month_lbl.pack(side="left")
        styled_btn(nav_row, "›", self._next_month, bg=CREAM, fg=TEXT_DARK,
                   font=("Poppins",14)).pack(side="left", padx=6)
        self._update_month_label()

        # filter tabs
        ftab = tk.Frame(self, bg=WHITE)
        ftab.pack(pady=6)
        self._filter_btns = {}
        for f in ("all","income","expense"):
            b = tk.Button(ftab, text=f.capitalize(),
                          font=("Poppins",10), relief="flat",
                          cursor="hand2", padx=20, pady=6,
                          command=lambda x=f: self._set_filter(x))
            b.pack(side="left", padx=4)
            self._filter_btns[f] = b
        self._set_filter("all")

        # scrollable list
        frame = tk.Frame(self, bg=WHITE)
        frame.pack(fill="both", expand=True, padx=30, pady=4)
        canvas = tk.Canvas(frame, bg=WHITE, highlightthickness=0)
        sb     = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        self._tx_inner = tk.Frame(canvas, bg=WHITE)
        self._tx_inner.bind("<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0,0), window=self._tx_inner, anchor="nw")
        canvas.configure(yscrollcommand=sb.set)
        canvas.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")

    def _update_month_label(self):
        months = ["","January","February","March","April","May","June",
                  "July","August","September","October","November","December"]
        self._month_lbl.config(text=f"{months[self._month]} {self._year}")

    def _prev_month(self):
        self._month -= 1
        if self._month < 1:
            self._month = 12; self._year -= 1
        self._update_month_label(); self.load()

    def _next_month(self):
        self._month += 1
        if self._month > 12:
            self._month = 1; self._year += 1
        self._update_month_label(); self.load()

    def _set_filter(self, f):
        self._filter = f
        for k,b in self._filter_btns.items():
            if k == f:
                b.config(bg=AMBER, fg=WHITE)
            else:
                b.config(bg=WHITE, fg=TEXT_MUTE,
                         highlightbackground=CREAM, highlightthickness=1)
        self.load()

    def load(self):
        for w in self._tx_inner.winfo_children(): w.destroy()
        org_id = self.org["id"]
        try:
            wres = supabase.table("wallets").select("id")\
                           .eq("organization_id", org_id).execute()
            wids = [w["id"] for w in (wres.data or [])]
            if not wids:
                tk.Label(self._tx_inner, text="No wallets found.",
                         bg=WHITE, fg=TEXT_MUTE,
                         font=("Poppins",10)).pack(pady=40)
                return

            tres = supabase.table("wallet_transactions")\
                           .select("kind,date_issued,quantity,price,description,particulars,income_type")\
                           .in_("wallet_id", wids)\
                           .order("date_issued", desc=True).execute()
            txs = []
            for tx in (tres.data or []):
                d = tx.get("date_issued","")[:10]
                try:
                    dt = datetime.strptime(d, "%Y-%m-%d")
                    if dt.year != self._year or dt.month != self._month:
                        continue
                except: continue
                if self._filter != "all" and tx.get("kind") != self._filter:
                    continue
                txs.append(tx)

            if not txs:
                tk.Label(self._tx_inner,
                         text="No transactions for this period.",
                         bg=WHITE, fg=TEXT_MUTE,
                         font=("Poppins",10)).pack(pady=40)
                return

            for tx in txs:
                kind  = tx.get("kind","")
                qty   = int(tx.get("quantity") or 0)
                price = float(tx.get("price") or 0)
                amt   = qty * price
                color = GREEN_OK if kind == "income" else RED_ERR
                sign  = "+" if kind == "income" else "-"

                card = tk.Frame(self._tx_inner, bg=WHITE,
                                highlightbackground=CREAM, highlightthickness=1)
                card.pack(fill="x", pady=4, padx=2)

                left = tk.Frame(card, bg=WHITE)
                left.pack(side="left", fill="both", expand=True, padx=12, pady=8)
                desc = tx.get("description") or tx.get("particulars","")
                tk.Label(left, text=desc[:40], bg=WHITE, fg=TEXT_DARK,
                         font=("Poppins",10,"bold"), anchor="w").pack(anchor="w")
                sub = tx.get("income_type","") or kind.capitalize()
                tk.Label(left, text=sub, bg=WHITE, fg=TEXT_MUTE,
                         font=("Poppins",9), anchor="w").pack(anchor="w")
                tk.Label(left, text=tx.get("date_issued","")[:10],
                         bg=WHITE, fg="#999999",
                         font=("Poppins",8), anchor="w").pack(anchor="w")

                tk.Label(card, text=f"{sign}Php {amt:,.2f}",
                         bg=WHITE, fg=color, font=("Poppins",11,"bold"),
                         padx=12).pack(side="right", pady=8)
        except Exception as e:
            messagebox.showerror("History Error", str(e))


# ═══════════════════════════════════════════════════════════
# WALLETS TAB
# ═══════════════════════════════════════════════════════════
class WalletsTab(tk.Frame):
    def __init__(self, parent, org):
        super().__init__(parent, bg=WHITE)
        self.org       = org
        self._folders  = []
        self._sel_folder = None
        self._tx_filter  = "all"
        self._build()
        self._show_list()
        self.load_folders()

    # ── build views ───────────────────────────────────────
    def _build(self):
        # LIST VIEW
        self._list_view = tk.Frame(self, bg=WHITE)

        lhdr = tk.Frame(self._list_view, bg=WHITE)
        lhdr.pack(fill="x", padx=30, pady=(24,0))
        tk.Label(lhdr, text="Wallets", bg=WHITE, fg=TEXT_DARK,
                 font=("Georgia",22,"italic")).pack(side="left")
        styled_btn(lhdr, "↻ Refresh", self.load_folders,
                   bg=AMBER, font=("Poppins",9)).pack(side="right")

        # search bar
        sbar = tk.Frame(self._list_view, bg=WHITE)
        sbar.pack(fill="x", padx=30, pady=8)
        self._search_var = tk.StringVar()
        self._search_var.trace("w", lambda *a: self._render_folders())
        se = tk.Entry(sbar, textvariable=self._search_var,
                      font=("Poppins",10), relief="flat",
                      highlightbackground=CREAM, highlightthickness=1)
        se.pack(side="left", ipady=6, padx=(0,8), ipadx=10)
        tk.Label(sbar, text="Search wallet...", bg=WHITE,
                 fg=TEXT_GRAY, font=("Poppins",9)).place(in_=se, x=8, y=6)

        # grid
        canvas = tk.Canvas(self._list_view, bg=WHITE, highlightthickness=0)
        sb     = ttk.Scrollbar(self._list_view, orient="vertical",
                               command=canvas.yview)
        self._grid_inner = tk.Frame(canvas, bg=WHITE)
        self._grid_inner.bind("<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0,0), window=self._grid_inner, anchor="nw")
        canvas.configure(yscrollcommand=sb.set)
        canvas.pack(side="left", fill="both", expand=True, padx=30)
        sb.pack(side="right", fill="y")

        # DETAIL VIEW
        self._detail_view = tk.Frame(self, bg=WHITE)

        dhdr = tk.Frame(self._detail_view, bg=WHITE)
        dhdr.pack(fill="x", padx=30, pady=(20,0))
        styled_btn(dhdr, "‹", self._show_list, bg=CREAM, fg=TEXT_DARK,
                   font=("Poppins",16)).pack(side="left")
        self._detail_title = tk.Label(dhdr, text="Wallet", bg=WHITE,
                                      fg=TEXT_DARK, font=("Georgia",18,"italic"))
        self._detail_title.pack(side="left", padx=12)
        styled_btn(dhdr, "+ Add Transaction",
                   self._open_add_tx, bg=ACTIVE_NAV,
                   font=("Poppins",9)).pack(side="right", padx=6)

        # tabs
        tab_row = tk.Frame(self._detail_view, bg=WHITE,
                           highlightbackground=CREAM, highlightthickness=1)
        tab_row.pack(fill="x", padx=30, pady=10)
        self._detail_tabs  = {}
        self._detail_panes = {}
        for key, lbl in [("transactions","Transactions"),
                          ("reports","Reports"),
                          ("receipts","Receipts"),
                          ("archives","Archive")]:
            b = tk.Button(tab_row, text=lbl, relief="flat",
                          font=("Poppins",10), cursor="hand2",
                          padx=16, pady=8,
                          command=lambda k=key: self._switch_detail_tab(k))
            b.pack(side="left")
            self._detail_tabs[key] = b

        self._detail_body = tk.Frame(self._detail_view, bg=WHITE)
        self._detail_body.pack(fill="both", expand=True, padx=30)

        # pane: transactions
        tp = tk.Frame(self._detail_body, bg=WHITE)
        self._detail_panes["transactions"] = tp
        # filter btns
        tf = tk.Frame(tp, bg=WHITE)
        tf.pack(fill="x", pady=6)
        self._tx_filter_btns = {}
        for f in ("all","income","expense"):
            b = tk.Button(tf, text=f.capitalize(), relief="flat",
                          font=("Poppins",9), cursor="hand2",
                          padx=18, pady=5,
                          command=lambda x=f: self._set_tx_filter(x))
            b.pack(side="left", padx=4)
            self._tx_filter_btns[f] = b
        self._set_tx_filter("all")
        # tx list
        tc = tk.Canvas(tp, bg=WHITE, highlightthickness=0)
        ts = ttk.Scrollbar(tp, orient="vertical", command=tc.yview)
        self._tx_list = tk.Frame(tc, bg=WHITE)
        self._tx_list.bind("<Configure>",
            lambda e: tc.configure(scrollregion=tc.bbox("all")))
        tc.create_window((0,0), window=self._tx_list, anchor="nw")
        tc.configure(yscrollcommand=ts.set)
        tc.pack(side="left", fill="both", expand=True)
        ts.pack(side="right", fill="y")

        # pane: reports
        rp = tk.Frame(self._detail_body, bg=WHITE)
        self._detail_panes["reports"] = rp
        self._build_reports_pane(rp)

        # pane: receipts
        rcp = tk.Frame(self._detail_body, bg=WHITE)
        self._detail_panes["receipts"] = rcp
        tk.Label(rcp, text="Receipts are stored in Supabase Storage.\nOpen the web app to view receipt images.",
                 bg=WHITE, fg=TEXT_MUTE, font=("Poppins",10),
                 justify="center").pack(pady=60)

        # pane: archives
        ap = tk.Frame(self._detail_body, bg=WHITE)
        self._detail_panes["archives"] = ap
        self._build_archives_pane(ap)

        self._switch_detail_tab("transactions")

    def _build_reports_pane(self, parent):
        # gradient bar
        bar = tk.Frame(parent, bg=AMBER_LIGHT)
        bar.pack(fill="x", pady=10)
        tk.Label(bar, text="Generate Financial Report", bg=AMBER_LIGHT,
                 fg=TEXT_DARK, font=("Poppins",12,"bold"),
                 padx=16, pady=14).pack(side="left")
        styled_btn(bar, "Generate Report",
                   self._generate_report, bg=WHITE, fg=TEXT_DARK,
                   font=("Poppins",9)).pack(side="right", padx=8, pady=10)

        # stat cards
        stats = tk.Frame(parent, bg=WHITE)
        stats.pack(fill="x", pady=10)
        self._stat_vars = {}
        for key, lbl in [("budget","Budget"),
                         ("income","Total Income"),
                         ("expense","Total Expenses"),
                         ("ending","Ending Cash")]:
            c = tk.Frame(stats, bg=WHITE,
                         highlightbackground=CREAM, highlightthickness=2)
            c.pack(side="left", fill="both", expand=True, padx=6, pady=4)
            tk.Label(c, text=lbl, bg=WHITE, fg=TEXT_MUTE,
                     font=("Poppins",9), pady=6).pack()
            var = tk.StringVar(value="Php 0.00")
            self._stat_vars[key] = var
            tk.Label(c, textvariable=var, bg=WHITE, fg=TEXT_DARK,
                     font=("Poppins",11,"bold"), pady=6).pack()

        # submit btn
        styled_btn(parent, "Submit Report to OSAS",
                   self._submit_report, bg=GREEN_OK,
                   font=("Poppins",10,"bold")).pack(pady=12, ipady=4)

    def _build_archives_pane(self, parent):
        tk.Label(parent, text="Submitted Reports", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins",12,"bold")).pack(anchor="w", pady=(8,6))
        styled_btn(parent, "↻ Load Archives",
                   self._load_archives, bg=AMBER,
                   font=("Poppins",9)).pack(anchor="e", pady=4)
        canvas = tk.Canvas(parent, bg=WHITE, highlightthickness=0)
        sb     = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        self._arch_list = tk.Frame(canvas, bg=WHITE)
        self._arch_list.bind("<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0,0), window=self._arch_list, anchor="nw")
        canvas.configure(yscrollcommand=sb.set)
        canvas.pack(side="left", fill="both", expand=True)
        sb.pack(side="right", fill="y")

    # ── navigation ────────────────────────────────────────
    def _show_list(self):
        self._detail_view.pack_forget()
        self._list_view.pack(fill="both", expand=True)

    def _show_detail(self, folder):
        self._sel_folder = folder
        self._list_view.pack_forget()
        self._detail_title.config(
            text=f"{folder.get('wallet_name','')} / {folder.get('name','')} {folder.get('year','')}")
        self._detail_view.pack(fill="both", expand=True)
        self._switch_detail_tab("transactions")
        self._load_transactions()
        self._load_report_stats()

    def _switch_detail_tab(self, key):
        for k, b in self._detail_tabs.items():
            if k == key:
                b.config(bg=WHITE, fg=TEXT_DARK,
                         highlightbackground=AMBER, highlightthickness=2)
            else:
                b.config(bg=WHITE, fg=TEXT_MUTE,
                         highlightbackground=CREAM, highlightthickness=0)
        for k, p in self._detail_panes.items():
            if k == key:
                p.pack(fill="both", expand=True)
            else:
                p.pack_forget()

    def _set_tx_filter(self, f):
        self._tx_filter = f
        for k, b in self._tx_filter_btns.items():
            b.config(bg=AMBER if k==f else WHITE,
                     fg=WHITE if k==f else TEXT_MUTE)
        if self._sel_folder:
            self._load_transactions()

    # ── data loaders ──────────────────────────────────────
    def load_folders(self):
        org_id = self.org["id"]
        try:
            wres = supabase.table("wallets").select("id,name")\
                           .eq("organization_id", org_id).execute()
            self._folders = []
            for w in (wres.data or []):
                bres = supabase.table("wallet_budgets")\
                               .select("id,amount,year,month_id,months(month_name,month_order)")\
                               .eq("wallet_id", w["id"]).execute()
                for b in (bres.data or []):
                    self._folders.append({
                        "id":          b["id"],
                        "wallet_id":   w["id"],
                        "wallet_name": w["name"],
                        "name":        b["months"]["month_name"],
                        "year":        b["year"],
                        "amount":      float(b.get("amount") or 0),
                    })
            self._render_folders()
        except Exception as e:
            messagebox.showerror("Wallets Error", str(e))

    def _render_folders(self):
        for w in self._grid_inner.winfo_children(): w.destroy()
        q = self._search_var.get().lower()
        shown = [f for f in self._folders
                 if q in f["wallet_name"].lower() or q in f["name"].lower()]
        if not shown:
            tk.Label(self._grid_inner, text="No wallets found.",
                     bg=WHITE, fg=TEXT_MUTE,
                     font=("Poppins",10)).pack(pady=40)
            return

        colors = [AMBER_LIGHT, CREAM, "#E8F5E9", "#E3F2FD", "#FFF3E0"]
        row_frame = None
        for i, f in enumerate(shown):
            if i % 4 == 0:
                row_frame = tk.Frame(self._grid_inner, bg=WHITE)
                row_frame.pack(fill="x", pady=8, padx=4)
            bg_col = colors[i % len(colors)]
            card = tk.Frame(row_frame, bg=bg_col, width=170, height=130,
                            cursor="hand2",
                            highlightbackground="#CCC", highlightthickness=1)
            card.pack(side="left", padx=8)
            card.pack_propagate(False)
            card.bind("<Button-1>", lambda e, folder=f: self._show_detail(folder))
            tk.Label(card, text=f["name"], bg=bg_col, fg=TEXT_DARK,
                     font=("Poppins",10,"bold"), wraplength=140,
                     justify="center").place(relx=0.5, rely=0.3, anchor="center")
            tk.Label(card, text=f["wallet_name"], bg=bg_col, fg=TEXT_MUTE,
                     font=("Poppins",8)).place(relx=0.5, rely=0.55, anchor="center")
            tk.Label(card, text=f"{f['year']}", bg=bg_col, fg=TEXT_MUTE,
                     font=("Poppins",8)).place(relx=0.5, rely=0.70, anchor="center")

    def _load_transactions(self):
        for w in self._tx_list.winfo_children(): w.destroy()
        if not self._sel_folder: return
        fid = self._sel_folder["id"]
        wid = self._sel_folder["wallet_id"]
        try:
            res = supabase.table("wallet_transactions")\
                          .select("id,kind,date_issued,description,quantity,price,income_type,particulars")\
                          .eq("wallet_id", wid)\
                          .eq("budget_id", fid)\
                          .order("date_issued").execute()
            txs = res.data or []
            if self._tx_filter != "all":
                txs = [t for t in txs if t.get("kind") == self._tx_filter]
            if not txs:
                tk.Label(self._tx_list, text="No transactions.",
                         bg=WHITE, fg=TEXT_MUTE,
                         font=("Poppins",10)).pack(pady=30)
                return
            for tx in txs:
                qty   = int(tx.get("quantity") or 0)
                price = float(tx.get("price") or 0)
                amt   = qty * price
                kind  = tx.get("kind","")
                color = GREEN_OK if kind=="income" else RED_ERR
                sign  = "+" if kind=="income" else "-"

                row = tk.Frame(self._tx_list, bg=WHITE,
                               highlightbackground=CREAM, highlightthickness=1)
                row.pack(fill="x", pady=3, padx=2)
                left = tk.Frame(row, bg=WHITE)
                left.pack(side="left", padx=10, pady=6, fill="both", expand=True)
                desc = tx.get("description") or tx.get("particulars","")
                tk.Label(left, text=desc[:44], bg=WHITE, fg=TEXT_DARK,
                         font=("Poppins",9,"bold"), anchor="w").pack(anchor="w")
                sub = tx.get("income_type","") or kind.capitalize()
                tk.Label(left, text=f"{sub}  ·  {tx.get('date_issued','')[:10]}",
                         bg=WHITE, fg=TEXT_MUTE,
                         font=("Poppins",8)).pack(anchor="w")
                tk.Label(row, text=f"{sign}Php {amt:,.2f}",
                         bg=WHITE, fg=color,
                         font=("Poppins",10,"bold"), padx=10).pack(side="right")
        except Exception as e:
            messagebox.showerror("Transactions Error", str(e))

    def _load_report_stats(self):
        if not self._sel_folder: return
        fid = self._sel_folder["id"]
        wid = self._sel_folder["wallet_id"]
        org = self.org["id"]
        try:
            res = supabase.table("wallet_transactions")\
                          .select("kind,quantity,price")\
                          .eq("wallet_id", wid)\
                          .eq("budget_id", fid).execute()
            total_inc = total_exp = 0.0
            for tx in (res.data or []):
                qty   = int(tx.get("quantity") or 0)
                price = float(tx.get("price") or 0)
                amt   = qty * price
                if tx.get("kind") == "income":
                    total_inc += amt
                else:
                    total_exp += amt
            budget = self._sel_folder.get("amount", 0)
            ending = budget + total_inc - total_exp
            self._stat_vars["budget"].set(f"Php {budget:,.2f}")
            self._stat_vars["income"].set(f"Php {total_inc:,.2f}")
            self._stat_vars["expense"].set(f"Php {total_exp:,.2f}")
            self._stat_vars["ending"].set(f"Php {ending:,.2f}")
        except Exception: pass

    def _load_archives(self):
        for w in self._arch_list.winfo_children(): w.destroy()
        if not self._sel_folder: return
        fid = self._sel_folder["id"]
        wid = self._sel_folder["wallet_id"]
        org = self.org["id"]
        try:
            res = supabase.table("financial_report_archives")\
                          .select("id,report_no,event_name,date_prepared,budget,total_expense,remaining")\
                          .eq("organization_id", org)\
                          .eq("wallet_id", wid)\
                          .eq("budget_id", fid)\
                          .order("created_at").execute()
            archives = res.data or []
            if not archives:
                tk.Label(self._arch_list, text="No submitted reports.",
                         bg=WHITE, fg=TEXT_MUTE,
                         font=("Poppins",10)).pack(pady=30)
                return
            for a in archives:
                card = tk.Frame(self._arch_list, bg=WHITE,
                                highlightbackground=CREAM, highlightthickness=2)
                card.pack(fill="x", pady=6, padx=2)
                tk.Label(card, text=a.get("report_no","—"), bg=WHITE,
                         fg=TEXT_DARK, font=("Poppins",11,"bold"),
                         padx=12, pady=6).pack(anchor="w")
                tk.Label(card, text=f"Event: {a.get('event_name','—')}",
                         bg=WHITE, fg=TEXT_MUTE,
                         font=("Poppins",9), padx=12).pack(anchor="w")
                tk.Label(card,
                         text=f"Budget: Php {float(a.get('budget') or 0):,.2f}  |  "
                              f"Expense: Php {float(a.get('total_expense') or 0):,.2f}  |  "
                              f"Remaining: Php {float(a.get('remaining') or 0):,.2f}",
                         bg=WHITE, fg=TEXT_DARK,
                         font=("Poppins",9), padx=12, pady=6).pack(anchor="w")
        except Exception as e:
            messagebox.showerror("Archives Error", str(e))

    # ── actions ───────────────────────────────────────────
    def _open_add_tx(self):
        if not self._sel_folder:
            messagebox.showwarning("No folder", "Select a wallet folder first.")
            return
        AddTransactionDialog(self, self._sel_folder, self.org,
                             on_done=self._load_transactions)

    def _generate_report(self):
        if not self._sel_folder:
            messagebox.showwarning("No folder","Select a wallet folder first.")
            return
        messagebox.showinfo("Generate Report",
            "Report generation requires the web app (DOCX template).\n"
            "Please use the web version to generate and download the DOCX report.")

    def _submit_report(self):
        if not self._sel_folder:
            messagebox.showwarning("No folder","Select a wallet folder first.")
            return
        if not messagebox.askyesno("Submit Report",
            "Submit this report to OSAS?\nYou will not be able to edit after submission."):
            return
        wid = self._sel_folder["wallet_id"]
        org = self.org["id"]
        try:
            res = supabase.table("financial_reports")\
                          .select("*")\
                          .eq("organization_id", org)\
                          .eq("wallet_id", wid)\
                          .eq("status","Pending Review")\
                          .order("created_at", desc=True).limit(1).execute()
            if not res.data:
                messagebox.showinfo("No Report","No pending report found. Generate one first.")
                return
            rep    = res.data[0]
            rep_id = rep["id"]
            from datetime import datetime as dt
            supabase.table("financial_reports").update({
                "status": "Submitted",
                "submission_date": dt.utcnow().date().isoformat(),
                "updated_at": dt.utcnow().isoformat(),
            }).eq("id", rep_id).execute()
            messagebox.showinfo("Submitted ✓",
                "Report submitted to OSAS successfully!")
        except Exception as e:
            messagebox.showerror("Submit Error", str(e))


# ── Add Transaction Dialog ────────────────────────────────
class AddTransactionDialog(tk.Toplevel):
    def __init__(self, parent, folder, org, on_done):
        super().__init__(parent)
        self.folder  = folder
        self.org     = org
        self.on_done = on_done
        self.title("Add Transaction")
        self.geometry("440x520")
        self.configure(bg=WHITE)
        self.grab_set()
        self._build()

    def _build(self):
        tk.Label(self, text="Add Transaction", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins",14,"bold")).pack(pady=(20,4))
        tk.Label(self, text="Add a new transaction for this wallet.",
                 bg=WHITE, fg=TEXT_MUTE, font=("Poppins",9)).pack(pady=(0,14))

        form = tk.Frame(self, bg=WHITE)
        form.pack(padx=30, fill="x")

        def row(label):
            tk.Label(form, text=label, bg=WHITE, fg=TEXT_MUTE,
                     font=("Poppins",9)).pack(anchor="w", pady=(6,2))

        row("Kind")
        self.kind_var = tk.StringVar(value="expense")
        kind_frame = tk.Frame(form, bg=WHITE)
        kind_frame.pack(fill="x")
        for k in ("income","expense"):
            tk.Radiobutton(kind_frame, text=k.capitalize(), variable=self.kind_var,
                           value=k, bg=WHITE, font=("Poppins",10)).pack(side="left", padx=8)

        row("Date Issued")
        self.date_var = tk.StringVar(value=datetime.now().strftime("%Y-%m-%d"))
        tk.Entry(form, textvariable=self.date_var, font=("Poppins",10),
                 relief="flat", highlightbackground=CREAM,
                 highlightthickness=1).pack(fill="x", ipady=6)

        row("Quantity")
        self.qty_var = tk.StringVar(value="1")
        tk.Entry(form, textvariable=self.qty_var, font=("Poppins",10),
                 relief="flat", highlightbackground=CREAM,
                 highlightthickness=1).pack(fill="x", ipady=6)

        row("Description")
        self.desc_var = tk.StringVar()
        tk.Entry(form, textvariable=self.desc_var, font=("Poppins",10),
                 relief="flat", highlightbackground=CREAM,
                 highlightthickness=1).pack(fill="x", ipady=6)

        row("Particulars (expense)")
        self.part_var = tk.StringVar()
        tk.Entry(form, textvariable=self.part_var, font=("Poppins",10),
                 relief="flat", highlightbackground=CREAM,
                 highlightthickness=1).pack(fill="x", ipady=6)

        row("Income Type (income)")
        self.itype_var = tk.StringVar()
        ttk.Combobox(form, textvariable=self.itype_var,
                     values=["IGP","Registration Fee","Membership Fee"],
                     state="readonly", font=("Poppins",10)).pack(fill="x", ipady=4)

        row("Price")
        self.price_var = tk.StringVar(value="0.00")
        tk.Entry(form, textvariable=self.price_var, font=("Poppins",10),
                 relief="flat", highlightbackground=CREAM,
                 highlightthickness=1).pack(fill="x", ipady=6)

        btn_row = tk.Frame(self, bg=WHITE)
        btn_row.pack(pady=16)
        styled_btn(btn_row, "Cancel", self.destroy,
                   bg=CREAM, fg=TEXT_DARK).pack(side="left", padx=8)
        styled_btn(btn_row, "Save", self._save,
                   bg=ACTIVE_NAV).pack(side="left", padx=8)

    def _save(self):
        try:
            fid   = self.folder["id"]
            wid   = self.folder["wallet_id"]
            kind  = self.kind_var.get()
            date  = self.date_var.get().strip()
            qty   = int(self.qty_var.get() or 1)
            desc  = self.desc_var.get().strip()
            price = float(self.price_var.get() or 0)
            itype = self.itype_var.get()
            part  = self.part_var.get().strip()
            if not desc:
                messagebox.showwarning("Required", "Description is required."); return
            supabase.table("wallet_transactions").insert({
                "wallet_id":   wid,
                "budget_id":   fid,
                "kind":        kind,
                "date_issued": date,
                "quantity":    qty,
                "description": desc,
                "price":       price,
                "income_type": itype if kind=="income" else None,
                "particulars": part  if kind=="expense" else None,
            }).execute()
            messagebox.showinfo("Saved ✓", "Transaction added successfully!")
            self.destroy()
            self.on_done()
        except Exception as e:
            messagebox.showerror("Error", str(e))


# ═══════════════════════════════════════════════════════════
# PROFILE TAB
# ═══════════════════════════════════════════════════════════
class ProfileTab(tk.Frame):
    def __init__(self, parent, org):
        super().__init__(parent, bg=WHITE)
        self.org      = org
        self._editing = False
        self._build()
        self.load()

    def _build(self):
        # header
        tk.Label(self, text="Profile", bg=WHITE, fg=TEXT_DARK,
                 font=("Georgia",22,"italic")).pack(anchor="w", padx=30, pady=(24,0))

        # overview banner
        banner = tk.Frame(self, bg=CREAM)
        banner.pack(fill="x", padx=30, pady=14)

        self._photo_label = tk.Label(banner, bg=CREAM, width=10, height=5,
                                     relief="flat",
                                     highlightbackground=WHITE,
                                     highlightthickness=3)
        self._photo_label.pack(side="left", padx=20, pady=16)

        info = tk.Frame(banner, bg=CREAM)
        info.pack(side="left", fill="both", expand=True, pady=16)

        self._ov_name  = tk.Label(info, text="", bg=CREAM, fg=TEXT_DARK,
                                   font=("Poppins",16,"bold"))
        self._ov_name.pack(anchor="w")
        self._ov_short = tk.Label(info, text="", bg=CREAM, fg=ACTIVE_NAV,
                                   font=("Poppins",12,"bold"))
        self._ov_short.pack(anchor="w")
        self._ov_dept  = tk.Label(info, text="", bg=CREAM, fg=TEXT_MUTE,
                                   font=("Poppins",10))
        self._ov_dept.pack(anchor="w")
        self._ov_email = tk.Label(info, text="", bg=CREAM, fg=TEXT_MUTE,
                                   font=("Poppins",10))
        self._ov_email.pack(anchor="w")
        tk.Label(info, text="✓ Accredited", bg="#4CAF50", fg=WHITE,
                 font=("Poppins",9,"bold"), padx=10, pady=4).pack(anchor="w", pady=6)

        # tabs
        tab_bar = tk.Frame(self, bg=WHITE,
                           highlightbackground=CREAM, highlightthickness=1)
        tab_bar.pack(fill="x", padx=30, pady=(0,6))
        self._tabs     = {}
        self._panes    = {}
        self._tab_body = tk.Frame(self, bg=WHITE)
        self._tab_body.pack(fill="both", expand=True, padx=30)

        for key, lbl in [("org","Organization Info"),
                          ("officers","Officers"),
                          ("accred","Accreditation")]:
            b = tk.Button(tab_bar, text=lbl, relief="flat",
                          font=("Poppins",10), cursor="hand2",
                          padx=14, pady=8,
                          command=lambda k=key: self._switch_tab(k))
            b.pack(side="left")
            self._tabs[key] = b

        # org info pane
        op = tk.Frame(self._tab_body, bg=WHITE)
        self._panes["org"] = op
        self._vars = {}
        fields = [
            ("org_name",       "Organization Name",          False),
            ("org_short_name", "Shortened Name",             True),
            ("department",     "Department",                 False),
            ("school",         "School/University",          False),
            ("email",          "Email Address",              True),
        ]
        for key, lbl, editable in fields:
            tk.Label(op, text=lbl, bg=WHITE, fg=TEXT_MUTE,
                     font=("Poppins",9)).pack(anchor="w", pady=(8,2))
            var = tk.StringVar()
            self._vars[key] = var
            e = tk.Entry(op, textvariable=var, font=("Poppins",10),
                         relief="flat", bg="#F9F9F9",
                         highlightbackground=CREAM, highlightthickness=1,
                         state="readonly" if not editable else "normal")
            e.pack(fill="x", ipady=6)
            setattr(self, f"_entry_{key}", e)

        self._edit_btn = styled_btn(op, "Edit", self._toggle_edit, bg=ACTIVE_NAV)
        self._edit_btn.pack(anchor="e", pady=10)

        # officers pane
        offp = tk.Frame(self._tab_body, bg=WHITE)
        self._panes["officers"] = offp
        off_hdr = tk.Frame(offp, bg=WHITE)
        off_hdr.pack(fill="x", pady=8)
        tk.Label(off_hdr, text="Organization Officers", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins",12,"bold")).pack(side="left")
        styled_btn(off_hdr, "+ Add Officer",
                   self._add_officer, bg=ACTIVE_NAV,
                   font=("Poppins",9)).pack(side="right")
        cols = ("Name","Position","Term Start","Term End","Status")
        self._off_tree = ttk.Treeview(offp, columns=cols, show="headings", height=8)
        for c in cols:
            self._off_tree.heading(c, text=c)
            self._off_tree.column(c, width=120, anchor="center")
        self._off_tree.pack(fill="both", expand=True)
        styled_btn(offp, "↻ Refresh Officers",
                   self._load_officers, bg=AMBER,
                   font=("Poppins",9)).pack(anchor="e", pady=4)

        # accreditation pane
        acp = tk.Frame(self._tab_body, bg=WHITE)
        self._panes["accred"] = acp
        card = tk.Frame(acp, bg=WHITE,
                        highlightbackground=CREAM, highlightthickness=2)
        card.pack(fill="x", pady=20)
        tk.Label(card, text="Accreditation Information", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins",12,"bold"),
                 padx=20, pady=10).pack(anchor="w")
        tk.Frame(card, bg=CREAM, height=1).pack(fill="x")
        self._acc_date   = tk.Label(card, text="", bg=WHITE, fg=TEXT_DARK,
                                     font=("Poppins",10), padx=20, pady=8)
        self._acc_date.pack(anchor="w")
        self._acc_status = tk.Label(card, text="", bg=WHITE, fg=GREEN_OK,
                                     font=("Poppins",10,"bold"), padx=20, pady=4)
        self._acc_status.pack(anchor="w")

        self._switch_tab("org")

    def _switch_tab(self, key):
        for k, b in self._tabs.items():
            b.config(bg=WHITE,
                     fg=ACTIVE_NAV if k==key else TEXT_MUTE,
                     font=("Poppins",10,"bold" if k==key else "normal"))
        for k, p in self._panes.items():
            if k == key:
                p.pack(fill="both", expand=True)
            else:
                p.pack_forget()
        if key == "officers":
            self._load_officers()

    def load(self):
        org_id = self.org["id"]
        try:
            org_res  = supabase.table("organizations")\
                               .select("id,org_name,department_id,accreditation_date,status")\
                               .eq("id", org_id).limit(1).execute()
            if not org_res.data: return
            org = org_res.data[0]

            prof_res = supabase.table("profile_users")\
                               .select("org_short_name,campus,school_name,email")\
                               .eq("organization_id", org_id).limit(1).execute()
            prof = prof_res.data[0] if prof_res.data else {}

            dept_name = ""
            if org.get("department_id"):
                dr = supabase.table("departments")\
                             .select("dept_name")\
                             .eq("id", org["department_id"]).limit(1).execute()
                if dr.data:
                    dept_name = dr.data[0]["dept_name"]

            self._vars["org_name"].set(org.get("org_name",""))
            self._vars["org_short_name"].set(prof.get("org_short_name",""))
            self._vars["department"].set(dept_name)
            self._vars["school"].set(prof.get("school_name",""))
            self._vars["email"].set(prof.get("email",""))

            self._ov_name.config( text=org.get("org_name",""))
            self._ov_short.config(text=prof.get("org_short_name",""))
            self._ov_dept.config( text=dept_name)
            self._ov_email.config(text=prof.get("email",""))

            self._acc_date.config(
                text=f"Date of Accreditation:  {org.get('accreditation_date','—')}")
            status_txt = "Accredited" if org.get("status")=="Active" else org.get("status","")
            self._acc_status.config(text=f"Current Status:  {status_txt}")
        except Exception as e:
            messagebox.showerror("Profile Error", str(e))

    def _toggle_edit(self):
        self._editing = not self._editing
        state = "normal" if self._editing else "readonly"
        for key in ("org_short_name","email"):
            getattr(self, f"_entry_{key}").config(state=state)
        self._edit_btn.config(text="Save Changes" if self._editing else "Edit",
                              bg=GREEN_OK if self._editing else ACTIVE_NAV)
        if not self._editing:
            self._save_profile()

    def _save_profile(self):
        org_id = self.org["id"]
        try:
            supabase.table("profile_users").update({
                "org_short_name": self._vars["org_short_name"].get(),
                "email":          self._vars["email"].get(),
            }).eq("organization_id", org_id).execute()
            messagebox.showinfo("Saved ✓", "Profile updated successfully!")
        except Exception as e:
            messagebox.showerror("Save Error", str(e))

    def _load_officers(self):
        for row in self._off_tree.get_children():
            self._off_tree.delete(row)
        org_id = self.org["id"]
        try:
            res = supabase.table("profile_officers")\
                          .select("id,name,position,term_start,term_end,status")\
                          .eq("organization_id", org_id)\
                          .order("term_start").execute()
            for o in (res.data or []):
                self._off_tree.insert("","end", values=(
                    o.get("name",""),
                    o.get("position",""),
                    str(o.get("term_start",""))[:7],
                    str(o.get("term_end",""))[:7],
                    o.get("status",""),
                ))
        except Exception as e:
            messagebox.showerror("Officers Error", str(e))

    def _add_officer(self):
        AddOfficerDialog(self, self.org, on_done=self._load_officers)


# ── Add Officer Dialog ────────────────────────────────────
class AddOfficerDialog(tk.Toplevel):
    def __init__(self, parent, org, on_done):
        super().__init__(parent)
        self.org     = org
        self.on_done = on_done
        self.title("Add Officer")
        self.geometry("400x400")
        self.configure(bg=WHITE)
        self.grab_set()
        self._build()

    def _build(self):
        tk.Label(self, text="Add Officer", bg=WHITE, fg=TEXT_DARK,
                 font=("Poppins",13,"bold")).pack(pady=(20,14))
        form = tk.Frame(self, bg=WHITE)
        form.pack(padx=30, fill="x")
        self._vars = {}
        for key, lbl in [("name","Name"),("position","Position"),
                          ("term_start","Term Start (YYYY-MM)"),
                          ("term_end","Term End (YYYY-MM)")]:
            tk.Label(form, text=lbl, bg=WHITE, fg=TEXT_MUTE,
                     font=("Poppins",9)).pack(anchor="w", pady=(6,2))
            var = tk.StringVar()
            self._vars[key] = var
            tk.Entry(form, textvariable=var, font=("Poppins",10),
                     relief="flat", highlightbackground=CREAM,
                     highlightthickness=1).pack(fill="x", ipady=6)
        tk.Label(form, text="Status", bg=WHITE, fg=TEXT_MUTE,
                 font=("Poppins",9)).pack(anchor="w", pady=(6,2))
        self._status_var = tk.StringVar(value="Active")
        ttk.Combobox(form, textvariable=self._status_var,
                     values=["Active","Inactive"],
                     state="readonly").pack(fill="x")
        row = tk.Frame(self, bg=WHITE)
        row.pack(pady=16)
        styled_btn(row, "Cancel", self.destroy,
                   bg=CREAM, fg=TEXT_DARK).pack(side="left", padx=8)
        styled_btn(row, "Save Officer", self._save,
                   bg=ACTIVE_NAV).pack(side="left", padx=8)

    def _save(self):
        try:
            supabase.table("profile_officers").insert({
                "organization_id": self.org["id"],
                "name":       self._vars["name"].get(),
                "position":   self._vars["position"].get(),
                "term_start": self._vars["term_start"].get() or None,
                "term_end":   self._vars["term_end"].get() or None,
                "status":     self._status_var.get(),
            }).execute()
            messagebox.showinfo("Saved ✓","Officer added!")
            self.destroy()
            self.on_done()
        except Exception as e:
            messagebox.showerror("Error", str(e))


# ═══════════════════════════════════════════════════════════
# MAIN APP WINDOW
# ═══════════════════════════════════════════════════════════
class PockiTrackApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("PockiTrack")
        self.geometry("1100x700")
        self.minsize(900, 600)
        self.configure(bg=BG)
        self._set_icon()
        self._org = None
        self._show_login()

    def _set_icon(self):
        """Use the box logo image as window icon."""
        try:
            if PIL_OK and os.path.exists("pocki_logo.png"):
                img = Image.open("pocki_logo.png").resize((64,64), Image.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                self.iconphoto(True, photo)
                self._icon_ref = photo   # keep reference
        except Exception:
            pass

    def _clear(self):
        for w in self.winfo_children():
            w.destroy()

    def _show_login(self):
        self._clear()
        # splash / role screen
        splash = tk.Frame(self, bg=BG)
        splash.pack(fill="both", expand=True)

        center = tk.Frame(splash, bg=BG)
        center.place(relx=0.5, rely=0.5, anchor="center")

        logo_img = load_icon("pocki_logo.png", (80,80))
        if logo_img:
            lbl = tk.Label(center, image=logo_img, bg=BG)
            lbl.image = logo_img
            lbl.pack(pady=(0,8))

        tk.Label(center, text="PockiTrack", bg=BG, fg=TEXT_DARK,
                 font=("Poppins",32,"bold")).pack()
        tk.Label(center, text="Organization Financial Management",
                 bg=BG, fg=TEXT_MUTE, font=("Poppins",12)).pack(pady=(4,40))

        styled_btn(center, "  Log in to your Organization  ",
                   self._open_login, bg=ACTIVE_NAV,
                   font=("Poppins",13,"bold")).pack(ipady=10, ipadx=20)

        tk.Label(center,
                 text="Developed by Snowden, Yngrie & Zoo · LSPU-SCC",
                 bg=BG, fg="#AAAAAA", font=("Poppins",8)).pack(pady=(40,0))

    def _open_login(self):
        LoginWindow(self, on_success=self._on_login_success)

    def _on_login_success(self, org):
        self._org = org
        self._show_main()

    def _show_main(self):
        self._clear()
        self.title(f"PockiTrack — {self._org.get('org_name','')}")

        root = tk.Frame(self, bg=BG)
        root.pack(fill="both", expand=True)

        # sidebar
        sidebar = Sidebar(root, self._org,
                          on_navigate=self._navigate,
                          on_logout=self._logout)
        sidebar.pack(side="left", fill="y")

        # main white content area
        self._content_area = tk.Frame(root, bg=WHITE,
                                       highlightbackground="#E0E0E0",
                                       highlightthickness=0)
        self._content_area.pack(side="left", fill="both", expand=True,
                                padx=20, pady=20)

        # rounded corner effect
        self._content_area.configure(relief="flat")

        self._tabs = {}
        self._sidebar = sidebar

        # pre-build all tabs
        self._tabs["home"]    = HomeTab(   self._content_area, self._org)
        self._tabs["history"] = HistoryTab(self._content_area, self._org)
        self._tabs["wallets"] = WalletsTab(self._content_area, self._org)
        self._tabs["profile"] = ProfileTab(self._content_area, self._org)

        self._navigate("home")

    def _navigate(self, key):
        for k, t in self._tabs.items():
            if k == key:
                t.pack(fill="both", expand=True)
            else:
                t.pack_forget()

    def _logout(self):
        if messagebox.askyesno("Logout", "Log out of PockiTrack?"):
            self._org = None
            self.title("PockiTrack")
            self._show_login()


# ─────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────
if __name__ == "__main__":
    app = PockiTrackApp()
    app.mainloop()