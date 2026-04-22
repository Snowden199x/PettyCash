"""
PockiTrack Desktop Application
================================
Logo file: place pocki_logo.png in the same folder as this script.

Faithfully reproduces the PockiTrack web UI (landingpage, login, homepage,
history, wallets, profile) as a Tkinter desktop application.

Color palette (from CSS):
  BG_CREAM   = #F5F1E8  (page background)
  BROWN      = #8B3B08  (landing accent / login button)
  DARK_BROWN = #A24A00  (nav active / primary buttons)
  GOLD       = #F3D58D  (hero card border / summary gradient)
  GOLD_MID   = #ECB95D
  GOLD_DARK  = #E59E2C  (active filter)
  WHITE      = #FFFFFF
  GRAY       = #616161  (body text, nav items)
  LIGHT_GRAY = #ECDDC6  (borders, hover)
  GREEN      = #2E7D32  (income)
  RED        = #C62828  (expense)
  BLACK      = #000000
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import os
import sys
import datetime
import json

# ── optional PIL for rounded images ──────────────────────────────────────────
try:
    from PIL import Image, ImageTk, ImageDraw, ImageFilter
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# ─────────────────────────────────────────────────────────────────────────────
# COLOUR / FONT CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
BG_CREAM    = "#F5F1E8"
BG_WHITE    = "#FFFFFF"
BROWN       = "#8B3B08"
DARK_BROWN  = "#A24A00"
GOLD        = "#F3D58D"
GOLD_MID    = "#ECB95D"
GOLD_DARK   = "#E59E2C"
LIGHT_TAN   = "#ECDDC6"
GRAY        = "#616161"
LIGHT_GRAY  = "#D9D9D9"
BLACK       = "#000000"
GREEN       = "#2E7D32"
RED         = "#C62828"
INCOME_CLR  = "#C27A23"
EXPENSE_CLR = "#D18330"

FONT_POPPINS      = ("Segoe UI", 10)
FONT_POPPINS_SM   = ("Segoe UI", 9)
FONT_POPPINS_MD   = ("Segoe UI", 12)
FONT_POPPINS_LG   = ("Segoe UI", 14)
FONT_POPPINS_XL   = ("Segoe UI", 18, "bold")
FONT_POPPINS_BOLD = ("Segoe UI", 10, "bold")
FONT_ITALIC_LG    = ("Georgia", 22, "italic")
FONT_ITALIC_MD    = ("Georgia", 16, "italic")
FONT_LOGO         = ("Segoe UI", 20, "bold")
FONT_LOGO_SM      = ("Segoe UI", 14, "bold")

SIDEBAR_W = 220


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def blend(c1, c2, t):
    """Linear interpolate between two hex colours."""
    r1, g1, b1 = hex_to_rgb(c1)
    r2, g2, b2 = hex_to_rgb(c2)
    r = int(r1 + (r2 - r1) * t)
    g = int(g1 + (g2 - g1) * t)
    b = int(b1 + (b2 - b1) * t)
    return f"#{r:02x}{g:02x}{b:02x}"


def make_gradient_canvas(parent, w, h, c1, c2, orient="h"):
    """Return a Canvas pre-drawn with a horizontal or vertical gradient."""
    cv = tk.Canvas(parent, width=w, height=h, bd=0, highlightthickness=0)
    steps = w if orient == "h" else h
    for i in range(steps):
        col = blend(c1, c2, i / max(steps - 1, 1))
        if orient == "h":
            cv.create_line(i, 0, i, h, fill=col)
        else:
            cv.create_line(0, i, w, i, fill=col)
    return cv


def rounded_rect(canvas, x1, y1, x2, y2, r=15, **kwargs):
    """Draw a rounded rectangle on a canvas."""
    canvas.create_arc(x1, y1, x1+2*r, y1+2*r, start=90,  extent=90,  style="pieslice", **kwargs)
    canvas.create_arc(x2-2*r, y1, x2, y1+2*r, start=0,   extent=90,  style="pieslice", **kwargs)
    canvas.create_arc(x1, y2-2*r, x1+2*r, y2, start=180, extent=90,  style="pieslice", **kwargs)
    canvas.create_arc(x2-2*r, y2-2*r, x2, y2, start=270, extent=90,  style="pieslice", **kwargs)
    canvas.create_rectangle(x1+r, y1, x2-r, y2, **kwargs)
    canvas.create_rectangle(x1, y1+r, x2, y2-r, **kwargs)


def load_logo(size=40):
    """Load pocki_logo.png from script directory. Returns PhotoImage or None."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(script_dir, "pocki_logo.png")
    if PIL_AVAILABLE and os.path.exists(path):
        img = Image.open(path).convert("RGBA").resize((size, size), Image.LANCZOS)
        return ImageTk.PhotoImage(img)
    return None


# ─────────────────────────────────────────────────────────────────────────────
# REUSABLE WIDGET COMPONENTS
# ─────────────────────────────────────────────────────────────────────────────

class HoverButton(tk.Label):
    """Flat label that acts as a button with hover colour change."""
    def __init__(self, parent, text, command=None,
                 bg=DARK_BROWN, fg=BG_WHITE,
                 hover_bg=BROWN, hover_fg=BG_WHITE,
                 font=FONT_POPPINS_BOLD, padx=18, pady=8,
                 cursor="hand2", **kwargs):
        super().__init__(parent, text=text, bg=bg, fg=fg,
                         font=font, padx=padx, pady=pady,
                         cursor=cursor, **kwargs)
        self._bg = bg; self._fg = fg
        self._hbg = hover_bg; self._hfg = hover_fg
        self._cmd = command
        self.bind("<Enter>",    self._on_enter)
        self.bind("<Leave>",    self._on_leave)
        self.bind("<Button-1>", self._on_click)

    def _on_enter(self, _): self.config(bg=self._hbg, fg=self._hfg)
    def _on_leave(self, _): self.config(bg=self._bg,  fg=self._fg)
    def _on_click(self, _):
        if self._cmd:
            self._cmd()


class RoundedFrame(tk.Canvas):
    """A Canvas that draws a rounded-corner white card."""
    def __init__(self, parent, width, height, radius=20,
                 bg_inner=BG_WHITE, bg_outer=BG_CREAM,
                 shadow=False, **kwargs):
        super().__init__(parent, width=width, height=height,
                         bg=bg_outer, bd=0, highlightthickness=0, **kwargs)
        self._r = radius
        self._inner = bg_inner
        self._outer = bg_outer
        self.bind("<Configure>", self._draw)
        self._draw()

    def _draw(self, event=None):
        w = self.winfo_reqwidth()
        h = self.winfo_reqheight()
        self.delete("all")
        r = self._r
        self.create_rectangle(r, 0, w-r, h, fill=self._inner, outline=self._inner)
        self.create_rectangle(0, r, w, h-r, fill=self._inner, outline=self._inner)
        for x, y, start in [(0,0,90),(w-2*r,0,0),(0,h-2*r,180),(w-2*r,h-2*r,270)]:
            self.create_arc(x, y, x+2*r, y+2*r, start=start, extent=90,
                            fill=self._inner, outline=self._inner)


class SidebarNav(tk.Frame):
    """Left navigation panel shared across interior pages."""
    def __init__(self, parent, active_page, navigate_cb, logo_img=None):
        super().__init__(parent, bg=BG_CREAM, width=SIDEBAR_W)
        self.pack_propagate(False)
        self._nav_cb = navigate_cb
        self._active = active_page
        self._btns = {}

        # ── Logo ────────────────────────────────────────────────────────────
        logo_frame = tk.Frame(self, bg=BG_CREAM)
        logo_frame.pack(padx=14, pady=(14, 0), anchor="w")
        if logo_img:
            tk.Label(logo_frame, image=logo_img, bg=BG_CREAM).pack(side="left")
            logo_img._ref = logo_img          # keep reference
        tk.Label(logo_frame, text="PockiTrack", font=FONT_LOGO_SM,
                 bg=BG_CREAM, fg=BLACK).pack(side="left", padx=(8, 0))

        # ── Nav Items ────────────────────────────────────────────────────────
        nav_items = [
            ("home",    "🏠  Home"),
            ("history", "📋  History"),
            ("wallets", "👜  Wallets"),
            ("profile", "👤  Profile"),
        ]
        nav_frame = tk.Frame(self, bg=BG_CREAM)
        nav_frame.pack(pady=(24, 0), padx=8, fill="x")

        for page, label in nav_items:
            is_active = page == active_page
            btn = tk.Label(
                nav_frame, text=label,
                font=FONT_POPPINS_MD,
                bg=DARK_BROWN if is_active else BG_CREAM,
                fg=BG_WHITE if is_active else GRAY,
                anchor="w", padx=16, pady=10,
                cursor="hand2"
            )
            btn.pack(fill="x", pady=3)
            # rounded look via relief
            if is_active:
                btn.config(relief="flat")

            p = page  # closure capture
            btn.bind("<Button-1>", lambda e, pg=p: self._nav_cb(pg))
            if not is_active:
                btn.bind("<Enter>", lambda e, b=btn: b.config(bg=LIGHT_TAN, fg=BLACK))
                btn.bind("<Leave>", lambda e, b=btn: b.config(bg=BG_CREAM, fg=GRAY))
            self._btns[page] = btn


# ─────────────────────────────────────────────────────────────────────────────
# SCROLLABLE FRAME HELPER
# ─────────────────────────────────────────────────────────────────────────────

class ScrollableFrame(tk.Frame):
    """A vertically scrollable container."""
    def __init__(self, parent, bg=BG_WHITE, **kwargs):
        super().__init__(parent, bg=bg, **kwargs)
        self._canvas = tk.Canvas(self, bg=bg, bd=0, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=self._canvas.yview)
        self.inner = tk.Frame(self._canvas, bg=bg)
        self.inner.bind("<Configure>",
            lambda e: self._canvas.configure(scrollregion=self._canvas.bbox("all")))
        self._canvas.create_window((0, 0), window=self.inner, anchor="nw")
        self._canvas.configure(yscrollcommand=scrollbar.set)
        self._canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        self._canvas.bind("<MouseWheel>", self._on_mousewheel)
        self.inner.bind("<MouseWheel>", self._on_mousewheel)

    def _on_mousewheel(self, event):
        self._canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")


# ─────────────────────────────────────────────────────────────────────────────
# IN-MEMORY DATA STORE  (replaces Flask + SQLite for desktop demo)
# ─────────────────────────────────────────────────────────────────────────────

class DataStore:
    def __init__(self):
        self.org_name  = "Sample Organization"
        self.username  = "sampleorg"
        self.password  = "password123"
        self.short_name = "SAMPLEORG"
        self.department = "College of Information Technology"
        self.school    = "Laguna State Polytechnic University"
        self.email     = "sampleorg@lspu.edu.ph"
        self.accreditation_date = "2023-08-01"
        self.officers  = [
            {"name": "Juan dela Cruz", "position": "President",
             "term_start": "2024-08", "term_end": "2025-05", "status": "active"},
            {"name": "Maria Santos", "position": "Treasurer",
             "term_start": "2024-08", "term_end": "2025-05", "status": "active"},
        ]
        self.wallets = [
            {"id": 1, "name": "SEMINAR",         "month": "2025-03",
             "budget": 5000.0,  "total_income": 5000.0,  "total_expenses": 3500.0},
            {"id": 2, "name": "OUTREACH PROGRAM","month": "2025-02",
             "budget": 3000.0,  "total_income": 3000.0,  "total_expenses": 1200.0},
            {"id": 3, "name": "SPORTSFEST",      "month": "2025-01",
             "budget": 8000.0,  "total_income": 7500.0,  "total_expenses": 6200.0},
        ]
        self.transactions = [
            {"id": 1, "wallet_id": 1, "type": "income",  "description": "Registration fees",
             "quantity": 50, "price": 100.0, "income_type": "Registration Fee",
             "particulars": None, "date": "2025-03-10",
             "total_amount": 5000.0},
            {"id": 2, "wallet_id": 1, "type": "expense", "description": "Venue rental",
             "quantity": 1,  "price": 3500.0, "income_type": None,
             "particulars": "Venue", "date": "2025-03-12",
             "total_amount": 3500.0},
            {"id": 3, "wallet_id": 2, "type": "income",  "description": "Membership fees",
             "quantity": 30, "price": 100.0, "income_type": "Membership Fee",
             "particulars": None, "date": "2025-02-05",
             "total_amount": 3000.0},
            {"id": 4, "wallet_id": 2, "type": "expense", "description": "Transportation",
             "quantity": 1,  "price": 1200.0, "income_type": None,
             "particulars": "Transport", "date": "2025-02-15",
             "total_amount": 1200.0},
        ]
        self._next_tx_id   = 10
        self._next_wal_id  = 10

    def total_balance(self):
        return sum(w["budget"] - w["total_expenses"] for w in self.wallets)

    def income_this_month(self):
        now = datetime.date.today()
        month_str = f"{now.year}-{now.month:02d}"
        return sum(
            t["total_amount"]
            for t in self.transactions
            if t["type"] == "income" and t["date"].startswith(month_str)
        )

    def expenses_this_month(self):
        now = datetime.date.today()
        month_str = f"{now.year}-{now.month:02d}"
        return sum(
            t["total_amount"]
            for t in self.transactions
            if t["type"] == "expense" and t["date"].startswith(month_str)
        )

    def get_wallet(self, wid):
        return next((w for w in self.wallets if w["id"] == wid), None)

    def get_transactions(self, wallet_id=None):
        if wallet_id is None:
            return list(self.transactions)
        return [t for t in self.transactions if t["wallet_id"] == wallet_id]

    def add_transaction(self, wallet_id, kind, date, qty, price,
                        income_type, particulars, description):
        tx = {
            "id": self._next_tx_id,
            "wallet_id": wallet_id,
            "type": kind,
            "description": description,
            "quantity": qty,
            "price": price,
            "income_type": income_type,
            "particulars": particulars,
            "date": date,
            "total_amount": qty * price,
        }
        self._next_tx_id += 1
        self.transactions.append(tx)
        w = self.get_wallet(wallet_id)
        if w:
            if kind == "income":
                w["total_income"] += tx["total_amount"]
            else:
                w["total_expenses"] += tx["total_amount"]
        return tx

    def delete_transaction(self, tx_id):
        tx = next((t for t in self.transactions if t["id"] == tx_id), None)
        if tx:
            self.transactions.remove(tx)
            w = self.get_wallet(tx["wallet_id"])
            if w:
                if tx["type"] == "income":
                    w["total_income"] -= tx["total_amount"]
                else:
                    w["total_expenses"] -= tx["total_amount"]

    def add_wallet(self, name, month, budget):
        w = {"id": self._next_wal_id, "name": name, "month": month,
             "budget": budget, "total_income": 0.0, "total_expenses": 0.0}
        self._next_wal_id += 1
        self.wallets.append(w)
        return w


DB = DataStore()


# ─────────────────────────────────────────────────────────────────────────────
# MODAL DIALOG HELPERS
# ─────────────────────────────────────────────────────────────────────────────

class BaseModal(tk.Toplevel):
    """Base class for all modal dialogs."""
    def __init__(self, parent, title, width=480, height=400):
        super().__init__(parent)
        self.title(title)
        self.configure(bg=BG_WHITE)
        self.resizable(False, False)
        # Centre relative to parent
        parent.update_idletasks()
        px = parent.winfo_rootx() + parent.winfo_width()  // 2 - width  // 2
        py = parent.winfo_rooty() + parent.winfo_height() // 2 - height // 2
        self.geometry(f"{width}x{height}+{px}+{py}")
        self.grab_set()
        self.transient(parent)

        # Header
        hdr = tk.Frame(self, bg=DARK_BROWN, height=50)
        hdr.pack(fill="x")
        tk.Label(hdr, text=title, font=FONT_POPPINS_XL,
                 bg=DARK_BROWN, fg=BG_WHITE).pack(side="left", padx=20, pady=10)
        tk.Label(hdr, text="✕", font=FONT_POPPINS_LG, bg=DARK_BROWN, fg=BG_WHITE,
                 cursor="hand2").pack(side="right", padx=15)
        hdr.winfo_children()[-1].bind("<Button-1>", lambda e: self.destroy())

        # Body frame
        self.body = tk.Frame(self, bg=BG_WHITE)
        self.body.pack(fill="both", expand=True, padx=20, pady=10)

    def _labeled_entry(self, label, row, show=""):
        tk.Label(self.body, text=label, font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").grid(
            row=row*2, column=0, sticky="ew", pady=(8, 2))
        e = tk.Entry(self.body, show=show, font=FONT_POPPINS,
                     relief="flat", bd=0,
                     highlightthickness=1, highlightbackground=LIGHT_TAN,
                     highlightcolor=GOLD_DARK)
        e.grid(row=row*2+1, column=0, sticky="ew", ipady=6, pady=(0, 2))
        self.body.columnconfigure(0, weight=1)
        return e

    def _footer_buttons(self, ok_text="Save", ok_cmd=None, cancel_cmd=None):
        foot = tk.Frame(self, bg=BG_WHITE)
        foot.pack(fill="x", padx=20, pady=10)
        HoverButton(foot, "Cancel", command=cancel_cmd or self.destroy,
                    bg=LIGHT_TAN, fg=BLACK, hover_bg=LIGHT_GRAY,
                    hover_fg=BLACK, font=FONT_POPPINS).pack(side="right", padx=(6, 0))
        HoverButton(foot, ok_text, command=ok_cmd,
                    bg=DARK_BROWN, fg=BG_WHITE, hover_bg=BROWN,
                    font=FONT_POPPINS_BOLD).pack(side="right")


class AddTransactionModal(BaseModal):
    def __init__(self, parent, wallet_id, kind, on_save):
        title = "Add Income Transaction" if kind == "income" else "Add Expense Transaction"
        super().__init__(parent, title, width=460, height=440)
        self._wallet_id = wallet_id
        self._kind = kind
        self._on_save = on_save

        self.e_date = self._labeled_entry("Date (YYYY-MM-DD)", 0)
        self.e_date.insert(0, str(datetime.date.today()))
        self.e_qty  = self._labeled_entry("Quantity", 1)
        self.e_qty.insert(0, "1")

        if kind == "income":
            tk.Label(self.body, text="Type of Income", font=FONT_POPPINS_SM,
                     bg=BG_WHITE, fg=GRAY, anchor="w").grid(
                row=4, column=0, sticky="ew", pady=(8, 2))
            self._income_var = tk.StringVar(value="Registration Fee")
            ttk.Combobox(self.body, textvariable=self._income_var,
                         values=["IGP","Registration Fee","Membership Fee"],
                         font=FONT_POPPINS, state="readonly").grid(
                row=5, column=0, sticky="ew", pady=(0, 2))
        else:
            self.e_part = self._labeled_entry("Particulars", 2)

        self.e_desc  = self._labeled_entry("Description", 3)
        self.e_price = self._labeled_entry("Price", 4)
        self._footer_buttons("Save", ok_cmd=self._save)

    def _save(self):
        try:
            date  = self.e_date.value() if hasattr(self.e_date, "value") else self.e_date.get()
            qty   = int(self.e_qty.get())
            price = float(self.e_price.get())
            desc  = self.e_desc.get()
            income_type = getattr(self, "_income_var", None)
            income_type = income_type.get() if income_type else None
            particulars = getattr(self, "e_part", None)
            particulars = particulars.get() if particulars else None
        except ValueError:
            messagebox.showerror("Error", "Invalid quantity or price.", parent=self)
            return
        tx = DB.add_transaction(self._wallet_id, self._kind, date,
                                qty, price, income_type, particulars, desc)
        self._on_save(tx)
        self.destroy()


class AddWalletModal(BaseModal):
    def __init__(self, parent, on_save):
        super().__init__(parent, "Create Wallet", width=440, height=320)
        self._on_save = on_save
        self.e_name   = self._labeled_entry("Wallet / Event Name", 0)
        self.e_month  = self._labeled_entry("Month (YYYY-MM)", 1)
        self.e_month.insert(0, datetime.date.today().strftime("%Y-%m"))
        self.e_budget = self._labeled_entry("Budget (PHP)", 2)
        self._footer_buttons("Create", ok_cmd=self._save)

    def _save(self):
        name   = self.e_name.get().strip()
        month  = self.e_month.get().strip()
        budget_str = self.e_budget.get().strip()
        if not name or not month:
            messagebox.showerror("Error", "Name and month are required.", parent=self)
            return
        try:
            budget = float(budget_str) if budget_str else 0.0
        except ValueError:
            messagebox.showerror("Error", "Invalid budget amount.", parent=self)
            return
        w = DB.add_wallet(name, month, budget)
        self._on_save(w)
        self.destroy()


class AddOfficerModal(BaseModal):
    def __init__(self, parent, on_save, existing=None):
        super().__init__(parent, "Add Officer" if not existing else "Edit Officer",
                         width=440, height=400)
        self._on_save = on_save
        self._existing = existing

        self.e_name  = self._labeled_entry("Name", 0)
        self.e_pos   = self._labeled_entry("Position", 1)
        self.e_start = self._labeled_entry("Term Start (YYYY-MM)", 2)
        self.e_end   = self._labeled_entry("Term End (YYYY-MM)", 3)

        tk.Label(self.body, text="Status", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").grid(
            row=8, column=0, sticky="ew", pady=(8, 2))
        self._status_var = tk.StringVar(value="active")
        ttk.Combobox(self.body, textvariable=self._status_var,
                     values=["active", "inactive"],
                     font=FONT_POPPINS, state="readonly").grid(
            row=9, column=0, sticky="ew")

        if existing:
            self.e_name.insert(0, existing.get("name", ""))
            self.e_pos.insert(0,  existing.get("position", ""))
            self.e_start.insert(0,existing.get("term_start", ""))
            self.e_end.insert(0,  existing.get("term_end", ""))
            self._status_var.set(existing.get("status", "active"))

        self._footer_buttons("Save", ok_cmd=self._save)

    def _save(self):
        name  = self.e_name.get().strip()
        pos   = self.e_pos.get().strip()
        start = self.e_start.get().strip()
        end   = self.e_end.get().strip()
        if not name or not pos:
            messagebox.showerror("Error", "Name and position are required.", parent=self)
            return
        officer = {"name": name, "position": pos, "term_start": start,
                   "term_end": end, "status": self._status_var.get()}
        self._on_save(officer, self._existing)
        self.destroy()


# ─────────────────────────────────────────────────────────────────────────────
# LANDING PAGE
# ─────────────────────────────────────────────────────────────────────────────

class LandingPage(tk.Frame):
    def __init__(self, parent, navigate_cb, logo_img=None):
        super().__init__(parent, bg=BG_CREAM)
        self._nav = navigate_cb
        self._logo = logo_img
        self._build()

    def _build(self):
        # ── Header ──────────────────────────────────────────────────────────
        header = tk.Frame(self, bg=BG_CREAM)
        header.pack(fill="x", padx=50, pady=15)

        logo_f = tk.Frame(header, bg=BG_CREAM)
        logo_f.pack(side="left")
        if self._logo:
            lbl = tk.Label(logo_f, image=self._logo, bg=BG_CREAM)
            lbl.pack(side="left")
        tk.Label(logo_f, text="PockiTrack", font=FONT_LOGO,
                 bg=BG_CREAM, fg=BLACK).pack(side="left", padx=(10, 0))

        HoverButton(header, "Log in", command=lambda: self._nav("login"),
                    bg=BROWN, fg=BG_WHITE, hover_bg="#602805",
                    padx=30, pady=10).pack(side="right")

        # ── Hero ─────────────────────────────────────────────────────────────
        hero = tk.Frame(self, bg="#F7F0E3")
        hero.pack(fill="x", padx=0, pady=0)

        hero_inner = tk.Frame(hero, bg="#F7F0E3")
        hero_inner.pack(padx=80, pady=60)

        # Left text
        left = tk.Frame(hero_inner, bg="#F7F0E3")
        left.pack(side="left", fill="y", padx=(0, 60))

        tk.Label(left, text="Financial Management\nMade Simple",
                 font=("Georgia", 26, "bold"), bg="#F7F0E3", fg=BLACK,
                 justify="left").pack(anchor="w")
        tk.Label(left,
                 text="PockiTrack helps university organizations\ntrack expenses, manage budgets, and\ngenerate professional financial reports.",
                 font=FONT_POPPINS_MD, bg="#F7F0E3", fg=GRAY,
                 justify="left").pack(anchor="w", pady=(12, 24))
        HoverButton(left, "Get started →", command=lambda: self._nav("login"),
                    bg=BROWN, fg=BG_WHITE, hover_bg="#602805",
                    font=("Segoe UI", 14, "bold"), padx=24, pady=10).pack(anchor="w")

        # Right card
        right = tk.Frame(hero_inner, bg=BG_WHITE, relief="flat",
                         highlightthickness=2, highlightbackground=GOLD)
        right.pack(side="left")
        self._build_hero_card(right, "SEMINAR",         70, 5000, 3500)
        self._build_hero_card(right, "OUTREACH PROGRAM",40, 3000, 1200)

        # ── Features ─────────────────────────────────────────────────────────
        feat_outer = tk.Frame(self, bg=BG_CREAM)
        feat_outer.pack(fill="x", pady=40, padx=60)

        tk.Label(feat_outer, text="Everything You Need to Manage Your Finances",
                 font=("Georgia", 20, "bold"), bg=BG_CREAM, fg=BLACK).pack()
        tk.Label(feat_outer,
                 text="Built specifically for student organizations to meet university financial reporting requirements.",
                 font=FONT_POPPINS, bg=BG_CREAM, fg=GRAY).pack(pady=(4, 30))

        grid = tk.Frame(feat_outer, bg=BG_CREAM)
        grid.pack()
        features = [
            ("🏦", "Track Finances",       "Monitor income, expenses & budget in real-time."),
            ("📊", "Generate Reports",     "Create professional Event & Monthly reports."),
            ("🔒", "Secure & Reliable",    "Safe authentication & organized record-keeping."),
            ("👥", "Multi-Officer Access", "Designed for Presidents, Treasurers & Auditors."),
        ]
        for i, (icon, title, desc) in enumerate(features):
            f = tk.Frame(grid, bg=BG_WHITE, width=240, height=200,
                         highlightthickness=1, highlightbackground=LIGHT_TAN)
            f.grid(row=0, column=i, padx=10, pady=10, sticky="nsew")
            f.pack_propagate(False)
            tk.Label(f, text=icon, font=("Segoe UI", 30), bg=BG_WHITE).pack(pady=(20, 8))
            tk.Label(f, text=title, font=FONT_POPPINS_BOLD, bg=BG_WHITE, fg=BLACK).pack()
            tk.Label(f, text=desc, font=FONT_POPPINS_SM, bg=BG_WHITE, fg=GRAY,
                     wraplength=200, justify="center").pack(padx=10, pady=8)

        # ── CTA ──────────────────────────────────────────────────────────────
        cta = tk.Frame(self, bg=GOLD, height=180)
        cta.pack(fill="x", padx=60, pady=30)
        cta.pack_propagate(False)
        tk.Label(cta, text="Ready to Simplify Your Organization's Finances?",
                 font=("Georgia", 18, "bold"), bg=GOLD, fg=BLACK).pack(pady=(36, 8))
        tk.Label(cta, text="Get started with PockiTrack today.",
                 font=FONT_POPPINS, bg=GOLD, fg=GRAY).pack()
        HoverButton(cta, "Access your account", command=lambda: self._nav("login"),
                    bg=BROWN, fg=BG_WHITE, hover_bg="#602805",
                    font=FONT_POPPINS_BOLD, padx=24, pady=10).pack(pady=16)

        # ── Footer ───────────────────────────────────────────────────────────
        tk.Label(self, text="© 2025 PockiTrack. All rights reserved.",
                 font=FONT_POPPINS_SM, bg=BG_CREAM, fg=GRAY).pack(pady=10)

    def _build_hero_card(self, parent, title, pct, income, expense):
        card = tk.Frame(parent, bg=BG_WHITE,
                        highlightthickness=1, highlightbackground=LIGHT_GRAY)
        card.pack(padx=20, pady=10, fill="x")

        tk.Label(card, text=f"👜  {title}", font=FONT_POPPINS_BOLD,
                 bg=BG_WHITE, fg=BLACK, anchor="w").pack(anchor="w", padx=16, pady=(12, 2))
        tk.Label(card, text="Budget Used", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").pack(anchor="w", padx=16)

        # Progress bar
        pb_frame = tk.Frame(card, bg=LIGHT_GRAY, height=10, width=300)
        pb_frame.pack(padx=16, pady=6, fill="x")
        pb_fill = tk.Frame(pb_frame, bg=DARK_BROWN, height=10)
        pb_fill.place(relwidth=pct/100, relheight=1)

        info = tk.Frame(card, bg=BG_WHITE)
        info.pack(padx=16, pady=(0, 12), fill="x")
        tk.Label(info, text=f"Income: Php {income:,}", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=INCOME_CLR).pack(side="left")
        tk.Label(info, text=f"Expenses: Php {expense:,}", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=EXPENSE_CLR).pack(side="right")


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN PAGE
# ─────────────────────────────────────────────────────────────────────────────

class LoginPage(tk.Frame):
    def __init__(self, parent, navigate_cb, logo_img=None):
        super().__init__(parent, bg=BG_CREAM)
        self._nav = navigate_cb
        self._logo = logo_img
        self._show_pw = False
        self._build()

    def _build(self):
        # Logo top-left
        logo_f = tk.Frame(self, bg=BG_CREAM)
        logo_f.place(x=14, y=14)
        if self._logo:
            tk.Label(logo_f, image=self._logo, bg=BG_CREAM, cursor="hand2").pack(side="left")
        tk.Label(logo_f, text="PockiTrack", font=FONT_LOGO_SM,
                 bg=BG_CREAM, fg=BLACK, cursor="hand2").pack(side="left", padx=(8, 0))
        logo_f.bind("<Button-1>", lambda e: self._nav("landing"))
        for w in logo_f.winfo_children():
            w.bind("<Button-1>", lambda e: self._nav("landing"))

        # Centre box
        box = tk.Frame(self, bg=BG_WHITE, relief="flat",
                       highlightthickness=1, highlightbackground=LIGHT_TAN,
                       width=440, height=460)
        box.place(relx=0.5, rely=0.5, anchor="center")
        box.pack_propagate(False)

        inner = tk.Frame(box, bg=BG_WHITE)
        inner.pack(padx=40, pady=30, fill="both", expand=True)

        tk.Label(inner, text="Log in", font=("Segoe UI", 26, "bold"),
                 bg=BG_WHITE, fg=BLACK).pack(pady=(0, 4))
        tk.Label(inner, text="Enter your details to sign in to your account.",
                 font=FONT_POPPINS_SM, bg=BG_WHITE, fg=GRAY).pack(pady=(0, 20))

        # Username
        tk.Label(inner, text="Username", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").pack(fill="x")
        self._e_user = tk.Entry(inner, font=FONT_POPPINS,
                                highlightthickness=1, highlightbackground=LIGHT_TAN,
                                highlightcolor=GOLD_DARK, relief="flat", bd=0)
        self._e_user.pack(fill="x", ipady=7, pady=(2, 12))

        # Password
        tk.Label(inner, text="Password", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").pack(fill="x")
        pw_frame = tk.Frame(inner, bg=BG_WHITE,
                            highlightthickness=1, highlightbackground=LIGHT_TAN)
        pw_frame.pack(fill="x", pady=(2, 4))
        self._e_pass = tk.Entry(pw_frame, font=FONT_POPPINS, show="●",
                                relief="flat", bd=0)
        self._e_pass.pack(side="left", fill="x", expand=True, ipady=7, padx=(6, 0))
        tk.Label(pw_frame, text="👁", font=FONT_POPPINS, bg=BG_WHITE,
                 cursor="hand2").pack(side="right", padx=6)
        pw_frame.winfo_children()[-1].bind("<Button-1>", self._toggle_pw)

        self._err_lbl = tk.Label(inner, text="", font=FONT_POPPINS_SM,
                                 bg=BG_WHITE, fg=RED)
        self._err_lbl.pack(fill="x")

        # Forgot password
        tk.Label(inner, text="Forgot password?", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=BROWN, cursor="hand2", anchor="e").pack(
            fill="x", pady=(4, 24))

        # Login button
        HoverButton(inner, "Log in", command=self._login,
                    bg=GOLD, fg=BLACK, hover_bg=GOLD_DARK, hover_fg=BG_WHITE,
                    font=("Segoe UI", 14, "bold"), padx=0, pady=8).pack(fill="x")

        self._e_user.bind("<Return>", lambda e: self._login())
        self._e_pass.bind("<Return>", lambda e: self._login())

    def _toggle_pw(self, _):
        self._show_pw = not self._show_pw
        self._e_pass.config(show="" if self._show_pw else "●")

    def _login(self):
        user = self._e_user.get().strip()
        pw   = self._e_pass.get().strip()
        if not user or not pw:
            self._err_lbl.config(text="Please fill in all fields.")
            return
        if user == DB.username and pw == DB.password:
            self._err_lbl.config(text="")
            self._nav("home")
        else:
            self._err_lbl.config(text="Invalid username or password.")


# ─────────────────────────────────────────────────────────────────────────────
# INTERIOR PAGE BASE  (sidebar + scrollable content box)
# ─────────────────────────────────────────────────────────────────────────────

class InteriorPage(tk.Frame):
    """Base class that renders sidebar + white scrollable content box."""
    def __init__(self, parent, navigate_cb, active_page, logo_img=None):
        super().__init__(parent, bg=BG_CREAM)
        self._nav = navigate_cb
        self._logo = logo_img

        # Sidebar
        self._sidebar = SidebarNav(self, active_page, navigate_cb, logo_img)
        self._sidebar.pack(side="left", fill="y")

        # White content box
        outer = tk.Frame(self, bg=BG_CREAM)
        outer.pack(side="left", fill="both", expand=True, padx=20, pady=20)

        self._scroll = ScrollableFrame(outer, bg=BG_WHITE)
        self._scroll.pack(fill="both", expand=True)
        self._scroll.config(highlightthickness=1, highlightbackground=LIGHT_TAN)

        self._content = self._scroll.inner

    def _section_title(self, text):
        tk.Label(self._content, text=text, font=FONT_ITALIC_LG,
                 bg=BG_WHITE, fg=BLACK, anchor="w").pack(
            fill="x", padx=30, pady=(20, 4))

    def _divider(self):
        tk.Frame(self._content, bg=LIGHT_TAN, height=1).pack(fill="x", padx=30, pady=4)


# ─────────────────────────────────────────────────────────────────────────────
# HOME PAGE
# ─────────────────────────────────────────────────────────────────────────────

class HomePage(InteriorPage):
    def __init__(self, parent, navigate_cb, logo_img=None):
        super().__init__(parent, navigate_cb, "home", logo_img)
        self._build()

    def _build(self):
        # Greeting
        today = datetime.date.today()
        day_str = today.strftime("%A, %B %d")
        tk.Label(self._content,
                 text=f"Hello, {DB.org_name}",
                 font=FONT_ITALIC_LG, bg=BG_WHITE, fg=BLACK, anchor="w").pack(
            fill="x", padx=30, pady=(20, 0))
        tk.Label(self._content, text=day_str, font=FONT_POPPINS,
                 bg=BG_WHITE, fg=GRAY, anchor="w").pack(fill="x", padx=30, pady=(0, 16))

        # ── Summary gradient band ────────────────────────────────────────────
        summary_outer = tk.Frame(self._content, bg=BG_WHITE)
        summary_outer.pack(fill="x", padx=30, pady=8)

        # Gradient background (simulate with gold frame)
        summary_bg = tk.Frame(summary_outer, bg=GOLD, relief="flat")
        summary_bg.pack(fill="x")

        cards_row = tk.Frame(summary_bg, bg=GOLD)
        cards_row.pack(padx=20, pady=16, fill="x")

        cards_data = [
            ("Total Balance",       f"Php {DB.total_balance():,.2f}"),
            ("Income this month",   f"Php {DB.income_this_month():,.2f}"),
            ("Expenses this month", f"Php {DB.expenses_this_month():,.2f}"),
            ("Reports submitted",   "2"),
        ]
        for i, (label, value) in enumerate(cards_data):
            c = tk.Frame(cards_row, bg="white", relief="flat",
                         highlightthickness=0)
            c.pack(side="left", expand=True, fill="both", padx=6)
            tk.Label(c, text=label, font=FONT_POPPINS_SM,
                     bg="white", fg=BLACK, anchor="w").pack(
                anchor="w", padx=14, pady=(12, 0))
            tk.Label(c, text=value, font=("Segoe UI", 13, "bold"),
                     bg="white", fg=BLACK, anchor="w").pack(
                anchor="w", padx=14, pady=(4, 12))

        # ── Wallets overview ──────────────────────────────────────────────────
        overview = tk.Frame(self._content, bg=BG_WHITE)
        overview.pack(fill="both", expand=True, padx=30, pady=16)

        # Wallets column
        wal_col = tk.Frame(overview, bg=BG_WHITE)
        wal_col.pack(side="left", fill="both", expand=True, padx=(0, 10))
        tk.Label(wal_col, text="Wallets Overview", font=FONT_POPPINS_LG,
                 bg=BG_WHITE, fg=BLACK, anchor="w").pack(anchor="w", pady=(0, 8))

        wal_scroll = ScrollableFrame(wal_col, bg=BG_WHITE)
        wal_scroll.pack(fill="both", expand=True)
        for w in DB.wallets:
            self._wallet_mini_card(wal_scroll.inner, w)

        # Transactions column
        tx_col = tk.Frame(overview, bg=BG_WHITE)
        tx_col.pack(side="left", fill="both", expand=True, padx=(10, 0))
        tk.Label(tx_col, text="Transaction History", font=FONT_POPPINS_LG,
                 bg=BG_WHITE, fg=BLACK, anchor="w").pack(anchor="w", pady=(0, 8))

        tx_scroll = ScrollableFrame(tx_col, bg=BG_WHITE)
        tx_scroll.pack(fill="both", expand=True)
        txs = sorted(DB.transactions, key=lambda t: t["date"], reverse=True)[:8]
        for tx in txs:
            self._tx_mini_card(tx_scroll.inner, tx)

    def _wallet_mini_card(self, parent, w):
        card = tk.Frame(parent, bg=BG_WHITE,
                        highlightthickness=1, highlightbackground=LIGHT_TAN)
        card.pack(fill="x", pady=5)
        budget = w["budget"]
        used   = w["total_expenses"]
        pct    = (used / budget * 100) if budget else 0

        tk.Label(card, text=w["name"], font=FONT_POPPINS_BOLD,
                 bg=BG_WHITE, fg=BLACK, anchor="w").pack(anchor="w", padx=12, pady=(10, 2))
        tk.Label(card, text="Budget Used", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").pack(anchor="w", padx=12)

        pb_bg = tk.Frame(card, bg=LIGHT_GRAY, height=8)
        pb_bg.pack(fill="x", padx=12, pady=4)
        pb_fill = tk.Frame(pb_bg, bg=DARK_BROWN, height=8)
        pb_fill.place(relwidth=min(pct/100, 1.0), relheight=1)

        info = tk.Frame(card, bg=BG_WHITE)
        info.pack(fill="x", padx=12, pady=(0, 10))
        tk.Label(info, text=f"Income: Php {w['total_income']:,.0f}",
                 font=FONT_POPPINS_SM, bg=BG_WHITE, fg=INCOME_CLR).pack(side="left")
        tk.Label(info, text=f"Expenses: Php {w['total_expenses']:,.0f}",
                 font=FONT_POPPINS_SM, bg=BG_WHITE, fg=EXPENSE_CLR).pack(side="right")

    def _tx_mini_card(self, parent, tx):
        w = DB.get_wallet(tx["wallet_id"])
        wname = w["name"] if w else "Unknown"
        is_income = tx["type"] == "income"
        amount_clr = GREEN if is_income else RED
        amount_str = f"{'+'if is_income else '-'}PHP {tx['total_amount']:,.0f}"

        card = tk.Frame(parent, bg=BG_WHITE,
                        highlightthickness=1, highlightbackground=LIGHT_TAN)
        card.pack(fill="x", pady=5)

        left = tk.Frame(card, bg=BG_WHITE)
        left.pack(side="left", fill="both", expand=True, padx=12, pady=10)
        tk.Label(left, text=wname, font=FONT_POPPINS_BOLD,
                 bg=BG_WHITE, fg=BLACK, anchor="w").pack(anchor="w")
        tk.Label(left, text=tx["description"], font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").pack(anchor="w")
        tk.Label(left, text=tx["date"], font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=LIGHT_GRAY, anchor="w").pack(anchor="w")

        tk.Label(card, text=amount_str, font=("Segoe UI", 12, "bold"),
                 bg=BG_WHITE, fg=amount_clr).pack(side="right", padx=12)


# ─────────────────────────────────────────────────────────────────────────────
# HISTORY PAGE
# ─────────────────────────────────────────────────────────────────────────────

class HistoryPage(InteriorPage):
    def __init__(self, parent, navigate_cb, logo_img=None):
        super().__init__(parent, navigate_cb, "history", logo_img)
        self._filter  = "all"
        self._cur_month = datetime.date.today().replace(day=1)
        self._build()

    def _build(self):
        self._section_title("Transaction History")

        # Month navigation
        nav_row = tk.Frame(self._content, bg=BG_WHITE)
        nav_row.pack(pady=8)

        HoverButton(nav_row, "‹", command=self._prev_month,
                    bg=LIGHT_TAN, fg=BLACK, hover_bg=GOLD_DARK, hover_fg=BG_WHITE,
                    font=("Segoe UI", 18), padx=14, pady=4).pack(side="left")
        self._month_lbl = tk.Label(nav_row, text="", font=("Segoe UI", 14, "bold"),
                                   bg=GOLD, fg=BLACK, padx=30, pady=6)
        self._month_lbl.pack(side="left", padx=8)
        HoverButton(nav_row, "›", command=self._next_month,
                    bg=LIGHT_TAN, fg=BLACK, hover_bg=GOLD_DARK, hover_fg=BG_WHITE,
                    font=("Segoe UI", 18), padx=14, pady=4).pack(side="left")

        # Filter tabs
        filter_row = tk.Frame(self._content, bg=BG_WHITE)
        filter_row.pack(pady=10)
        self._filter_btns = {}
        for filt, label in [("all","All"),("income","Income"),("expense","Expense")]:
            b = tk.Label(filter_row, text=label, font=FONT_POPPINS_BOLD,
                         padx=26, pady=8, cursor="hand2",
                         relief="flat")
            b.pack(side="left", padx=6)
            f = filt
            b.bind("<Button-1>", lambda e, fi=f: self._set_filter(fi))
            self._filter_btns[filt] = b

        # Transaction list
        self._tx_frame = tk.Frame(self._content, bg=BG_WHITE)
        self._tx_frame.pack(fill="both", expand=True, padx=30, pady=10)

        self._update_month_display()
        self._set_filter("all")

    def _set_filter(self, filt):
        self._filter = filt
        for k, b in self._filter_btns.items():
            if k == filt:
                b.config(bg=GOLD_DARK, fg=BG_WHITE)
            else:
                b.config(bg=BG_WHITE, fg=BLACK,
                         highlightthickness=1, highlightbackground=LIGHT_TAN)
        self._render_transactions()

    def _prev_month(self):
        y, m = self._cur_month.year, self._cur_month.month
        m -= 1
        if m == 0: m = 12; y -= 1
        self._cur_month = datetime.date(y, m, 1)
        self._update_month_display()
        self._render_transactions()

    def _next_month(self):
        y, m = self._cur_month.year, self._cur_month.month
        m += 1
        if m == 13: m = 1; y += 1
        self._cur_month = datetime.date(y, m, 1)
        self._update_month_display()
        self._render_transactions()

    def _update_month_display(self):
        self._month_lbl.config(
            text=self._cur_month.strftime("%B %Y"))

    def _render_transactions(self):
        for w in self._tx_frame.winfo_children():
            w.destroy()

        month_str = self._cur_month.strftime("%Y-%m")
        txs = [t for t in DB.transactions if t["date"].startswith(month_str)]
        if self._filter != "all":
            txs = [t for t in txs if t["type"] == self._filter]
        txs.sort(key=lambda t: t["date"], reverse=True)

        if not txs:
            tk.Label(self._tx_frame, text="No transactions found for this month.",
                     font=FONT_POPPINS_MD, bg=BG_WHITE, fg=GRAY).pack(pady=40)
            return

        for tx in txs:
            w = DB.get_wallet(tx["wallet_id"])
            wname = w["name"] if w else "Unknown"
            is_inc = tx["type"] == "income"
            amount_clr = GREEN if is_inc else RED
            amount_str = f"{'+'if is_inc else '-'}PHP {tx['total_amount']:,.2f}"

            card = tk.Frame(self._tx_frame, bg=BG_WHITE,
                            highlightthickness=1, highlightbackground=LIGHT_TAN)
            card.pack(fill="x", pady=5)

            left = tk.Frame(card, bg=BG_WHITE)
            left.pack(side="left", fill="both", expand=True, padx=14, pady=10)
            tk.Label(left, text=wname.upper(), font=FONT_POPPINS_BOLD,
                     bg=BG_WHITE, fg=BLACK, anchor="w").pack(anchor="w")

            parts = []
            if is_inc and tx.get("income_type"):
                parts.append(tx["income_type"])
            elif tx.get("particulars"):
                parts.append(tx["particulars"])
            if tx.get("description"):
                parts.append(tx["description"])
            detail = " - ".join(parts)
            tk.Label(left, text=detail, font=FONT_POPPINS_SM,
                     bg=BG_WHITE, fg=GRAY, anchor="w").pack(anchor="w")
            tk.Label(left, text=tx["date"], font=FONT_POPPINS_SM,
                     bg=BG_WHITE, fg=LIGHT_GRAY, anchor="w").pack(anchor="w")

            tk.Label(card, text=amount_str, font=("Segoe UI", 13, "bold"),
                     bg=BG_WHITE, fg=amount_clr).pack(side="right", padx=14)


# ─────────────────────────────────────────────────────────────────────────────
# WALLETS PAGE
# ─────────────────────────────────────────────────────────────────────────────

class WalletsPage(InteriorPage):
    def __init__(self, parent, navigate_cb, logo_img=None):
        super().__init__(parent, navigate_cb, "wallets", logo_img)
        self._current_wallet = None
        self._tx_filter = "all"
        self._active_tab = "transactions"
        self._build_list_view()

    # ── Wallet List ──────────────────────────────────────────────────────────
    def _build_list_view(self):
        for w in self._content.winfo_children():
            w.destroy()

        hdr = tk.Frame(self._content, bg=BG_WHITE)
        hdr.pack(fill="x", padx=30, pady=(20, 8))
        tk.Label(hdr, text="Wallets", font=FONT_ITALIC_LG,
                 bg=BG_WHITE, fg=BLACK).pack(side="left")

        HoverButton(hdr, "+ New Wallet", command=self._new_wallet,
                    bg=DARK_BROWN, fg=BG_WHITE, hover_bg=BROWN,
                    font=FONT_POPPINS_BOLD, padx=16, pady=6).pack(side="right")

        # Search
        search_frame = tk.Frame(self._content, bg=BG_WHITE)
        search_frame.pack(fill="x", padx=30, pady=(0, 12))
        self._search_var = tk.StringVar()
        self._search_var.trace("w", self._refresh_grid)
        e = tk.Entry(search_frame, textvariable=self._search_var,
                     font=FONT_POPPINS, relief="flat", bd=0,
                     highlightthickness=1, highlightbackground=LIGHT_TAN,
                     highlightcolor=GOLD_DARK)
        e.pack(fill="x", ipady=6, padx=0)
        tk.Label(search_frame, text="🔍", font=FONT_POPPINS,
                 bg=BG_WHITE, fg=GRAY).place(relx=0.97, rely=0.5, anchor="e")

        # Grid
        self._grid_frame = tk.Frame(self._content, bg=BG_WHITE)
        self._grid_frame.pack(fill="both", expand=True, padx=30, pady=8)
        self._refresh_grid()

    def _refresh_grid(self, *_):
        for w in self._grid_frame.winfo_children():
            w.destroy()
        q = self._search_var.get().lower() if hasattr(self, "_search_var") else ""
        filtered = [w for w in DB.wallets if q in w["name"].lower() or q in w["month"]]

        cols = 3
        for i, wallet in enumerate(filtered):
            row, col = divmod(i, cols)
            card = tk.Frame(self._grid_frame, bg=GOLD, width=200, height=140,
                            cursor="hand2",
                            highlightthickness=1, highlightbackground=GOLD_MID)
            card.grid(row=row, column=col, padx=10, pady=10, sticky="nsew")
            card.pack_propagate(False)
            tk.Label(card, text=wallet["name"], font=FONT_POPPINS_BOLD,
                     bg=BG_WHITE, fg=BLACK, anchor="w",
                     padx=8, pady=4).pack(side="bottom", fill="x")
            tk.Label(card, text=wallet["month"], font=FONT_POPPINS_SM,
                     bg=GOLD, fg=GRAY).pack(anchor="nw", padx=10, pady=10)

            wid = wallet["id"]
            card.bind("<Button-1>", lambda e, w=wid: self._open_wallet(w))
            for child in card.winfo_children():
                child.bind("<Button-1>", lambda e, w=wid: self._open_wallet(w))

            # hover
            def on_enter(e, c=card):
                c.config(highlightbackground=DARK_BROWN)
            def on_leave(e, c=card):
                c.config(highlightbackground=GOLD_MID)
            card.bind("<Enter>", on_enter)
            card.bind("<Leave>", on_leave)

        if not filtered:
            tk.Label(self._grid_frame, text="No wallets found.",
                     font=FONT_POPPINS_MD, bg=BG_WHITE, fg=GRAY).grid(
                row=0, column=0, pady=40)

    def _new_wallet(self):
        AddWalletModal(self, on_save=lambda w: self._refresh_grid())

    # ── Wallet Detail ────────────────────────────────────────────────────────
    def _open_wallet(self, wallet_id):
        self._current_wallet = DB.get_wallet(wallet_id)
        if not self._current_wallet:
            return
        for w in self._content.winfo_children():
            w.destroy()
        self._build_detail_view()

    def _build_detail_view(self):
        w = self._current_wallet

        # Header row
        hdr = tk.Frame(self._content, bg=BG_WHITE)
        hdr.pack(fill="x", padx=30, pady=(20, 4))

        HoverButton(hdr, "‹", command=self._build_list_view,
                    bg=LIGHT_TAN, fg=DARK_BROWN, hover_bg=GOLD_DARK,
                    hover_fg=BG_WHITE, font=("Segoe UI", 20), padx=12,
                    pady=2).pack(side="left")
        tk.Label(hdr, text=w["name"], font=FONT_ITALIC_LG,
                 bg=BG_WHITE, fg=BLACK).pack(side="left", padx=12)

        HoverButton(hdr, "+ Add", command=self._show_add_menu,
                    bg=DARK_BROWN, fg=BG_WHITE, hover_bg=BROWN,
                    font=FONT_POPPINS_BOLD, padx=14, pady=6).pack(side="right")

        budget_text = (f"Budget: Php {w['budget']:,.2f}"
                       if w["budget"] else "Add budget for this month")
        HoverButton(hdr, budget_text, command=self._set_budget,
                    bg=BG_WHITE, fg=GRAY, hover_bg=LIGHT_TAN,
                    hover_fg=BLACK, font=FONT_POPPINS,
                    padx=14, pady=6).pack(side="right", padx=8)

        # Tabs
        tab_row = tk.Frame(self._content, bg=BG_WHITE,
                           highlightthickness=0)
        tab_row.pack(fill="x", padx=30, pady=(8, 0))
        self._tab_btns = {}
        for tab, label in [("transactions","Transactions"),("reports","Reports"),
                           ("receipts","Receipts"),("archives","Archive")]:
            b = tk.Label(tab_row, text=label, font=FONT_POPPINS_BOLD,
                         padx=24, pady=10, cursor="hand2", bg=BG_WHITE, fg=GRAY)
            b.pack(side="left")
            t = tab
            b.bind("<Button-1>", lambda e, tb=t: self._switch_tab(tb))
            self._tab_btns[tab] = b
        tk.Frame(self._content, bg=LIGHT_TAN, height=2).pack(fill="x", padx=30)

        # Tab content area
        self._tab_area = tk.Frame(self._content, bg=BG_WHITE)
        self._tab_area.pack(fill="both", expand=True, padx=30, pady=10)

        self._switch_tab("transactions")

    def _switch_tab(self, tab):
        self._active_tab = tab
        for k, b in self._tab_btns.items():
            if k == tab:
                b.config(fg=BLACK, font=("Segoe UI", 10, "bold", "underline"))
            else:
                b.config(fg=GRAY, font=FONT_POPPINS_BOLD)
        for w in self._tab_area.winfo_children():
            w.destroy()
        if tab == "transactions":
            self._render_transactions_tab()
        elif tab == "reports":
            self._render_reports_tab()
        elif tab == "receipts":
            self._render_receipts_tab()
        elif tab == "archives":
            self._render_archives_tab()

    # ── Transactions tab ─────────────────────────────────────────────────────
    def _render_transactions_tab(self):
        filter_row = tk.Frame(self._tab_area, bg=BG_WHITE)
        filter_row.pack(pady=(0, 10))
        self._tx_filter_btns = {}
        for filt, label in [("all","All"),("income","Income"),("expense","Expense")]:
            b = tk.Label(filter_row, text=label, font=FONT_POPPINS_BOLD,
                         padx=22, pady=6, cursor="hand2", relief="flat")
            b.pack(side="left", padx=5)
            f = filt
            b.bind("<Button-1>", lambda e, fi=f: self._set_tx_filter(fi))
            self._tx_filter_btns[filt] = b
        self._set_tx_filter(self._tx_filter)

        self._tx_list_frame = tk.Frame(self._tab_area, bg=BG_WHITE)
        self._tx_list_frame.pack(fill="both", expand=True)
        self._render_tx_list()

    def _set_tx_filter(self, filt):
        self._tx_filter = filt
        for k, b in self._tx_filter_btns.items():
            b.config(bg=GOLD_DARK if k == filt else BG_WHITE,
                     fg=BG_WHITE if k == filt else BLACK)
        if hasattr(self, "_tx_list_frame"):
            self._render_tx_list()

    def _render_tx_list(self):
        for w in self._tx_list_frame.winfo_children():
            w.destroy()
        txs = DB.get_transactions(self._current_wallet["id"])
        if self._tx_filter != "all":
            txs = [t for t in txs if t["type"] == self._tx_filter]
        txs.sort(key=lambda t: t["date"], reverse=True)

        if not txs:
            tk.Label(self._tx_list_frame, text="No transactions found.",
                     font=FONT_POPPINS_MD, bg=BG_WHITE, fg=GRAY).pack(pady=30)
            return

        for tx in txs:
            is_inc = tx["type"] == "income"
            amount_clr = GREEN if is_inc else RED
            amount_str = f"{'+'if is_inc else '-'}PHP {tx['total_amount']:,.2f}"

            card = tk.Frame(self._tx_list_frame, bg=BG_WHITE,
                            highlightthickness=1, highlightbackground=LIGHT_TAN)
            card.pack(fill="x", pady=4)

            left = tk.Frame(card, bg=BG_WHITE)
            left.pack(side="left", fill="both", expand=True, padx=12, pady=8)
            tk.Label(left, text=tx["description"], font=FONT_POPPINS_BOLD,
                     bg=BG_WHITE, fg=BLACK, anchor="w").pack(anchor="w")
            detail = tx.get("income_type") or tx.get("particulars") or ""
            tk.Label(left, text=detail, font=FONT_POPPINS_SM,
                     bg=BG_WHITE, fg=GRAY, anchor="w").pack(anchor="w")
            tk.Label(left, text=tx["date"], font=FONT_POPPINS_SM,
                     bg=BG_WHITE, fg=LIGHT_GRAY, anchor="w").pack(anchor="w")

            right = tk.Frame(card, bg=BG_WHITE)
            right.pack(side="right", padx=12, pady=8)
            tk.Label(right, text=amount_str, font=("Segoe UI", 12, "bold"),
                     bg=BG_WHITE, fg=amount_clr).pack()

            # Delete button
            tid = tx["id"]
            HoverButton(right, "🗑", command=lambda t=tid: self._delete_tx(t),
                        bg=BG_WHITE, fg=RED, hover_bg="#FFEBEE",
                        hover_fg=RED, font=FONT_POPPINS, padx=4,
                        pady=2).pack(pady=(4, 0))

    def _delete_tx(self, tx_id):
        if messagebox.askyesno("Delete", "Delete this transaction?", parent=self):
            DB.delete_transaction(tx_id)
            self._render_tx_list()

    # ── Reports tab ──────────────────────────────────────────────────────────
    def _render_reports_tab(self):
        w = self._current_wallet

        # Header card (gradient)
        hdr = tk.Frame(self._tab_area, bg=GOLD)
        hdr.pack(fill="x", pady=(0, 16))

        info = tk.Frame(hdr, bg=GOLD)
        info.pack(side="left", padx=20, pady=16)
        tk.Label(info, text="📊  Generate Financial Report", font=FONT_POPPINS_BOLD,
                 bg=GOLD, fg=BLACK).pack(anchor="w")
        tk.Label(info, text="Create an Activity Financial Statement for this wallet",
                 font=FONT_POPPINS_SM, bg=GOLD, fg=GRAY).pack(anchor="w")

        btn_row = tk.Frame(hdr, bg=GOLD)
        btn_row.pack(side="right", padx=20, pady=16)
        HoverButton(btn_row, "Generate report", command=self._generate_report,
                    bg=BG_WHITE, fg=BLACK, hover_bg=LIGHT_TAN,
                    font=FONT_POPPINS_BOLD, padx=14, pady=8).pack(side="left", padx=4)

        # Stat cards
        stats = tk.Frame(self._tab_area, bg=BG_WHITE)
        stats.pack(fill="x", pady=8)
        ending = w["budget"] + w["total_income"] - w["total_expenses"]
        for label, value in [
            ("Budget",                    f"Php {w['budget']:,.2f}"),
            ("Total amount of income",    f"Php {w['total_income']:,.2f}"),
            ("Total amount of expenses",  f"Php {w['total_expenses']:,.2f}"),
            ("Ending Cash",               f"Php {ending:,.2f}"),
        ]:
            c = tk.Frame(stats, bg=BG_WHITE,
                         highlightthickness=2, highlightbackground=LIGHT_TAN)
            c.pack(side="left", expand=True, fill="both", padx=6, pady=4)
            tk.Label(c, text=label, font=FONT_POPPINS_SM,
                     bg=BG_WHITE, fg=GRAY).pack(pady=(14, 4))
            tk.Label(c, text=value, font=("Segoe UI", 14, "bold"),
                     bg=BG_WHITE, fg=BLACK).pack(pady=(0, 14))

    def _generate_report(self):
        messagebox.showinfo(
            "Generate Report",
            f"Report for '{self._current_wallet['name']}' generated.\n"
            "(In the full app, a formatted PDF/Word document would be created.)",
            parent=self
        )

    # ── Receipts tab ─────────────────────────────────────────────────────────
    def _render_receipts_tab(self):
        tk.Label(self._tab_area, text="No receipts uploaded yet.",
                 font=FONT_POPPINS_MD, bg=BG_WHITE, fg=GRAY).pack(pady=30)
        HoverButton(self._tab_area, "📎  Upload Receipt",
                    command=self._upload_receipt,
                    bg=DARK_BROWN, fg=BG_WHITE, hover_bg=BROWN,
                    font=FONT_POPPINS_BOLD, padx=18, pady=8).pack()

    def _upload_receipt(self):
        path = filedialog.askopenfilename(
            parent=self,
            filetypes=[("Image files","*.png *.jpg *.jpeg *.gif *.bmp")]
        )
        if path:
            messagebox.showinfo("Receipt Uploaded",
                                f"Receipt saved:\n{os.path.basename(path)}",
                                parent=self)

    # ── Archives tab ─────────────────────────────────────────────────────────
    def _render_archives_tab(self):
        tk.Label(self._tab_area, text="No archived reports found.",
                 font=FONT_POPPINS_MD, bg=BG_WHITE, fg=GRAY).pack(pady=30)

    # ── Helpers ──────────────────────────────────────────────────────────────
    def _show_add_menu(self):
        menu = tk.Menu(self, tearoff=0)
        menu.add_command(label="Add income transaction",
                         command=lambda: AddTransactionModal(
                             self, self._current_wallet["id"], "income",
                             on_save=self._after_add_tx))
        menu.add_command(label="Add expense transaction",
                         command=lambda: AddTransactionModal(
                             self, self._current_wallet["id"], "expense",
                             on_save=self._after_add_tx))
        try:
            menu.tk_popup(self.winfo_pointerx(), self.winfo_pointery())
        finally:
            menu.grab_release()

    def _after_add_tx(self, tx):
        if self._active_tab == "transactions":
            self._render_tx_list()
        # refresh stats if on reports tab
        if self._active_tab == "reports":
            self._switch_tab("reports")

    def _set_budget(self):
        w = self._current_wallet
        dlg = BaseModal(self, "Set Budget", width=380, height=220)
        tk.Label(dlg.body, text="Budget Amount (PHP)", font=FONT_POPPINS_SM,
                 bg=BG_WHITE, fg=GRAY, anchor="w").pack(fill="x", pady=(8, 2))
        e = tk.Entry(dlg.body, font=FONT_POPPINS, relief="flat", bd=0,
                     highlightthickness=1, highlightbackground=LIGHT_TAN)
        e.insert(0, str(w["budget"]))
        e.pack(fill="x", ipady=6)

        def save():
            try:
                w["budget"] = float(e.get())
                dlg.destroy()
                self._build_detail_view()
            except ValueError:
                messagebox.showerror("Error", "Invalid amount.", parent=dlg)

        dlg._footer_buttons("Save", ok_cmd=save)


# ─────────────────────────────────────────────────────────────────────────────
# PROFILE PAGE
# ─────────────────────────────────────────────────────────────────────────────

class ProfilePage(InteriorPage):
    def __init__(self, parent, navigate_cb, logo_img=None):
        super().__init__(parent, navigate_cb, "profile", logo_img)
        self._active_tab = "organization"
        self._build()

    def _build(self):
        self._section_title("Profile")

        # ── Overview banner ──────────────────────────────────────────────────
        overview = tk.Frame(self._content, bg=LIGHT_TAN)
        overview.pack(fill="x", padx=30, pady=12)

        # Avatar
        av_frame = tk.Frame(overview, bg=LIGHT_TAN)
        av_frame.pack(side="left", padx=20, pady=20)
        tk.Label(av_frame, text="🏛", font=("Segoe UI", 40), bg=LIGHT_TAN).pack()
        tk.Label(av_frame, text="Change Photo", font=FONT_POPPINS_SM,
                 bg=LIGHT_TAN, fg=DARK_BROWN, cursor="hand2").pack(pady=(4, 0))

        # Info
        info_f = tk.Frame(overview, bg=LIGHT_TAN)
        info_f.pack(side="left", padx=10, pady=20, fill="both", expand=True)
        tk.Label(info_f, text=DB.org_name, font=("Segoe UI", 20, "bold"),
                 bg=LIGHT_TAN, fg=BLACK, anchor="w").pack(anchor="w")
        tk.Label(info_f, text=DB.short_name, font=FONT_POPPINS_LG,
                 bg=LIGHT_TAN, fg=DARK_BROWN, anchor="w").pack(anchor="w")
        tk.Label(info_f, text=DB.department, font=FONT_POPPINS_SM,
                 bg=LIGHT_TAN, fg=GRAY, anchor="w").pack(anchor="w")
        tk.Label(info_f, text=DB.school, font=FONT_POPPINS_SM,
                 bg=LIGHT_TAN, fg=GRAY, anchor="w").pack(anchor="w")
        # Badge
        badge = tk.Label(info_f, text="✓  Accredited", font=FONT_POPPINS_BOLD,
                         bg=GREEN, fg=BG_WHITE, padx=12, pady=4)
        badge.pack(anchor="w", pady=(8, 0))

        # ── Tabs ─────────────────────────────────────────────────────────────
        tab_row = tk.Frame(self._content, bg=BG_WHITE)
        tab_row.pack(fill="x", padx=30, pady=(16, 0))
        self._tab_btns = {}
        for tab, label in [("organization","Organization Information"),
                           ("officers","Officers"),
                           ("accreditation","Accreditation Details")]:
            b = tk.Label(tab_row, text=label, font=FONT_POPPINS_BOLD,
                         padx=20, pady=10, cursor="hand2", bg=BG_WHITE, fg=GRAY)
            b.pack(side="left")
            t = tab
            b.bind("<Button-1>", lambda e, tb=t: self._switch_tab(tb))
            self._tab_btns[tab] = b
        tk.Frame(self._content, bg=LIGHT_TAN, height=2).pack(fill="x", padx=30)

        self._tab_area = tk.Frame(self._content, bg=BG_WHITE)
        self._tab_area.pack(fill="both", expand=True, padx=30, pady=16)

        self._switch_tab("organization")

    def _switch_tab(self, tab):
        self._active_tab = tab
        for k, b in self._tab_btns.items():
            b.config(fg=DARK_BROWN if k == tab else GRAY,
                     font=("Segoe UI", 10, "bold", "underline") if k == tab else FONT_POPPINS_BOLD)
        for w in self._tab_area.winfo_children():
            w.destroy()
        if tab == "organization":
            self._render_org_tab()
        elif tab == "officers":
            self._render_officers_tab()
        elif tab == "accreditation":
            self._render_acc_tab()

    # ── Organisation Info tab ─────────────────────────────────────────────────
    def _render_org_tab(self):
        card = tk.Frame(self._tab_area, bg=BG_WHITE,
                        highlightthickness=2, highlightbackground=LIGHT_TAN)
        card.pack(fill="x", pady=8)
        inner = tk.Frame(card, bg=BG_WHITE)
        inner.pack(padx=24, pady=20, fill="x")

        self._org_fields = {}
        fields = [
            ("Organization Name",           "org_name"),
            ("Organization Shortened Name", "short_name"),
            ("Department",                  "department"),
            ("School/University",           "school"),
            ("Email Address",               "email"),
        ]
        for label, attr in fields:
            tk.Label(inner, text=label, font=FONT_POPPINS_SM,
                     bg=BG_WHITE, fg=GRAY, anchor="w").pack(fill="x", pady=(6, 2))
            e = tk.Entry(inner, font=FONT_POPPINS, relief="flat", bd=0,
                         state="disabled",
                         highlightthickness=1, highlightbackground=LIGHT_TAN,
                         disabledbackground="#F5F5F5", disabledforeground=BLACK)
            e.pack(fill="x", ipady=7, pady=(0, 4))
            e.config(state="normal")
            e.insert(0, getattr(DB, attr, ""))
            e.config(state="disabled")
            self._org_fields[attr] = e

        btn_row = tk.Frame(inner, bg=BG_WHITE)
        btn_row.pack(anchor="e", pady=12)
        self._edit_btn = HoverButton(btn_row, "Edit", command=self._edit_org,
                                     bg=DARK_BROWN, fg=BG_WHITE, hover_bg=BROWN,
                                     font=FONT_POPPINS_BOLD, padx=24, pady=8)
        self._edit_btn.pack(side="left")

    def _edit_org(self):
        for attr, e in self._org_fields.items():
            e.config(state="normal", disabledbackground=BG_WHITE)
        self._edit_btn.config(text="Save Changes")
        self._edit_btn._cmd = self._save_org

    def _save_org(self):
        attrs = ["org_name","short_name","department","school","email"]
        for attr in attrs:
            e = self._org_fields.get(attr)
            if e:
                setattr(DB, attr, e.get())
                e.config(state="disabled", disabledbackground="#F5F5F5")
        self._edit_btn.config(text="Edit")
        self._edit_btn._cmd = self._edit_org
        messagebox.showinfo("Saved", "Profile updated successfully.", parent=self)

    # ── Officers tab ─────────────────────────────────────────────────────────
    def _render_officers_tab(self):
        hdr = tk.Frame(self._tab_area, bg=BG_WHITE)
        hdr.pack(fill="x", pady=(0, 10))
        tk.Label(hdr, text="Organization Officers", font=FONT_POPPINS_LG,
                 bg=BG_WHITE, fg=BLACK).pack(side="left")
        HoverButton(hdr, "+ Add Officer", command=self._add_officer,
                    bg=DARK_BROWN, fg=BG_WHITE, hover_bg=BROWN,
                    font=FONT_POPPINS_BOLD, padx=14, pady=6).pack(side="right")

        # Table header
        cols = ["Name", "Position", "Term Start", "Term End", "Status", "Actions"]
        widths = [160, 140, 100, 100, 80, 100]
        hdr_row = tk.Frame(self._tab_area, bg=LIGHT_TAN)
        hdr_row.pack(fill="x")
        for col, w in zip(cols, widths):
            tk.Label(hdr_row, text=col, font=FONT_POPPINS_BOLD,
                     bg=LIGHT_TAN, fg=BLACK, width=w//7, anchor="w").pack(
                side="left", padx=8, pady=8)

        self._officer_list_frame = tk.Frame(self._tab_area, bg=BG_WHITE)
        self._officer_list_frame.pack(fill="both", expand=True)
        self._render_officers()

    def _render_officers(self):
        for w in self._officer_list_frame.winfo_children():
            w.destroy()
        for i, off in enumerate(DB.officers):
            row_bg = BG_WHITE if i % 2 == 0 else "#FAFAFA"
            row = tk.Frame(self._officer_list_frame, bg=row_bg)
            row.pack(fill="x")
            for val, width in zip(
                [off["name"], off["position"],
                 off.get("term_start",""), off.get("term_end",""),
                 off["status"]], [160,140,100,100,80]
            ):
                lbl_text = val.capitalize() if val == off.get("status") else val
                lbl = tk.Label(row, text=lbl_text, font=FONT_POPPINS_SM,
                               bg=row_bg, fg=BLACK if val != off.get("status") else
                               (GREEN if val == "active" else RED),
                               width=width//7, anchor="w")
                lbl.pack(side="left", padx=8, pady=8)

            acts = tk.Frame(row, bg=row_bg)
            acts.pack(side="left", padx=8, pady=6)
            idx = i
            HoverButton(acts, "Edit", command=lambda o=off: self._edit_officer(o),
                        bg="#E3F2FD", fg="#1976D2", hover_bg="#1976D2",
                        hover_fg=BG_WHITE, font=FONT_POPPINS_SM, padx=8,
                        pady=2).pack(side="left", padx=2)
            HoverButton(acts, "Delete", command=lambda o=off: self._delete_officer(o),
                        bg="#FFEBEE", fg=RED, hover_bg=RED,
                        hover_fg=BG_WHITE, font=FONT_POPPINS_SM, padx=8,
                        pady=2).pack(side="left", padx=2)

    def _add_officer(self):
        def on_save(officer, existing):
            DB.officers.append(officer)
            self._render_officers()
        AddOfficerModal(self, on_save=on_save)

    def _edit_officer(self, existing):
        def on_save(officer, old):
            idx = DB.officers.index(old)
            DB.officers[idx] = officer
            self._render_officers()
        AddOfficerModal(self, on_save=on_save, existing=existing)

    def _delete_officer(self, officer):
        if messagebox.askyesno("Delete Officer",
                               f"Delete {officer['name']}?", parent=self):
            DB.officers.remove(officer)
            self._render_officers()

    # ── Accreditation tab ─────────────────────────────────────────────────────
    def _render_acc_tab(self):
        card = tk.Frame(self._tab_area, bg=BG_WHITE,
                        highlightthickness=2, highlightbackground=LIGHT_TAN)
        card.pack(fill="x", pady=8)
        inner = tk.Frame(card, bg=BG_WHITE)
        inner.pack(padx=24, pady=20, fill="x")
        tk.Label(inner, text="Accreditation Information",
                 font=FONT_POPPINS_LG, bg=BG_WHITE, fg=BLACK, anchor="w").pack(
            anchor="w", pady=(0, 12))

        for label, value in [
            ("Date of Accreditation:", DB.accreditation_date),
            ("Current Status:", "Accredited"),
        ]:
            row = tk.Frame(inner, bg=BG_WHITE)
            row.pack(fill="x", pady=4)
            tk.Label(row, text=label, font=FONT_POPPINS_BOLD,
                     bg=BG_WHITE, fg=GRAY, width=22, anchor="w").pack(side="left")
            clr = GREEN if value == "Accredited" else BLACK
            tk.Label(row, text=value, font=FONT_POPPINS_BOLD,
                     bg=BG_WHITE, fg=clr, anchor="w").pack(side="left")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN APPLICATION
# ─────────────────────────────────────────────────────────────────────────────

class PockiTrackApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("PockiTrack")
        self.geometry("1200x760")
        self.minsize(900, 600)
        self.configure(bg=BG_CREAM)

        # Load logo once
        self._logo_img = load_logo(size=42)

        # Icon (best-effort)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        icon_path = os.path.join(script_dir, "pocki_logo.png")
        if PIL_AVAILABLE and os.path.exists(icon_path):
            try:
                icon = ImageTk.PhotoImage(Image.open(icon_path).resize((32, 32)))
                self.iconphoto(True, icon)
                self._icon_ref = icon
            except Exception:
                pass

        self._current_frame = None
        self.navigate("landing")

    def navigate(self, page):
        if self._current_frame:
            self._current_frame.destroy()

        pages = {
            "landing": lambda: LandingPage(self, self.navigate, self._logo_img),
            "login":   lambda: LoginPage(self, self.navigate, self._logo_img),
            "home":    lambda: HomePage(self, self.navigate, self._logo_img),
            "history": lambda: HistoryPage(self, self.navigate, self._logo_img),
            "wallets": lambda: WalletsPage(self, self.navigate, self._logo_img),
            "profile": lambda: ProfilePage(self, self.navigate, self._logo_img),
        }

        builder = pages.get(page)
        if builder is None:
            return

        frame = builder()
        frame.pack(fill="both", expand=True)
        self._current_frame = frame

        # Scroll landing page
        if page == "landing":
            # Wrap in a canvas for scrollability
            pass


if __name__ == "__main__":
    app = PockiTrackApp()
    app.mainloop()