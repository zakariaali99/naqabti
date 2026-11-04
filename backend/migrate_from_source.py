#!/usr/bin/env python3
"""
Merge data from /Users/zakaria/Downloads/db.sqlite3 into the project database.
- Inserts new records using INSERT OR IGNORE to skip any that conflict on
  unique keys (id, username, email, phone_number).
- Branches from the source are inserted with new IDs if they don't exist by name.
- IDs in user_branches are remapped to new branch IDs.
- Tables that have schema differences (niqabaty_user, niqabaty_nationality,
  niqabaty_notification) are handled by selecting only the common columns.
"""

import sqlite3
import sys

SRC = "/Users/zakaria/Downloads/db.sqlite3"
DST = "/Users/zakaria/projects/niqabaty/backend/db.sqlite3"

src = sqlite3.connect(SRC)
dst = sqlite3.connect(DST)

src.row_factory = sqlite3.Row
dst.row_factory = sqlite3.Row

src_cur = src.cursor()
dst_cur = dst.cursor()


def get_columns(conn, table):
    """Return the list of column names for a table."""
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    return [row["name"] for row in cur.fetchall()]


def insert_rows_ignore(table, rows, columns):
    """INSERT OR IGNORE a list of dicts into the destination table."""
    if not rows:
        print(f"  {table}: no rows to insert")
        return 0
    placeholders = ", ".join("?" for _ in columns)
    col_str = ", ".join(f'"{c}"' for c in columns)
    sql = f'INSERT OR IGNORE INTO "{table}" ({col_str}) VALUES ({placeholders})'
    inserted = 0
    skipped = 0
    for row in rows:
        vals = [row[c] for c in columns]
        try:
            dst_cur.execute(sql, vals)
            if dst_cur.rowcount > 0:
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"  WARN row {dict(row)}: {e}")
            skipped += 1
    dst.commit()
    print(f"  {table}: inserted={inserted}, skipped={skipped}")
    return inserted


# ─────────────────────────────────────────────────────────────────────────────
# 1. Branches — insert by name to avoid duplication; build ID remap table
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Branches ===")
src_branches = src_cur.execute("SELECT * FROM niqabaty_branch").fetchall()
branch_id_map = {}  # source_id -> destination_id

dst_branches = dst_cur.execute("SELECT id, name FROM niqabaty_branch").fetchall()
dst_branch_by_name = {row["name"].lower(): row["id"] for row in dst_branches}

branch_cols = [c for c in get_columns(src, "niqabaty_branch") if c != "id"]
for row in src_branches:
    name = row["name"]
    prefix = row["prefix"]
    if name.lower() in dst_branch_by_name:
        branch_id_map[row["id"]] = dst_branch_by_name[name.lower()]
        print(f"  Branch '{name}' already exists by name (id={dst_branch_by_name[name.lower()]}), remapping")
        continue
    # Check prefix conflict
    prefix_conflict = dst_cur.execute(
        "SELECT id FROM niqabaty_branch WHERE prefix=?", (prefix,)
    ).fetchone()
    if prefix_conflict:
        branch_id_map[row["id"]] = prefix_conflict["id"]
        print(f"  Branch '{name}' prefix '{prefix}' conflicts → remapping to existing id={prefix_conflict['id']}")
        continue
    vals = [row[c] for c in branch_cols]
    col_str = ", ".join(f'"{c}"' for c in branch_cols)
    placeholders = ", ".join("?" for _ in branch_cols)
    dst_cur.execute(
        f'INSERT OR IGNORE INTO "niqabaty_branch" ({col_str}) VALUES ({placeholders})',
        vals,
    )
    new_id = dst_cur.lastrowid
    if dst_cur.rowcount == 0:
        # Still conflicted, find the conflicting row
        existing = dst_cur.execute(
            "SELECT id FROM niqabaty_branch WHERE name=?", (name,)
        ).fetchone()
        if existing:
            branch_id_map[row["id"]] = existing["id"]
            print(f"  Branch '{name}' insert skipped (conflict), remapping to id={existing['id']}")
        else:
            print(f"  WARN: Branch '{name}' insert failed, no remap found")
    else:
        branch_id_map[row["id"]] = new_id
        print(f"  Branch '{name}' inserted with new id={new_id}")


dst.commit()
print(f"  Branch ID map: {branch_id_map}")


# ─────────────────────────────────────────────────────────────────────────────
# 2. Simple reference tables — common columns only
# ─────────────────────────────────────────────────────────────────────────────
def merge_simple(table):
    src_cols = set(get_columns(src, table))
    dst_cols = set(get_columns(dst, table))
    common = [c for c in get_columns(src, table) if c in dst_cols]  # preserve order
    rows = src_cur.execute(f'SELECT {", ".join(common)} FROM "{table}"').fetchall()
    print(f"\n=== {table} ===")
    insert_rows_ignore(table, rows, common)


merge_simple("niqabaty_academicdegree")
merge_simple("niqabaty_city")
merge_simple("niqabaty_nationality")
merge_simple("niqabaty_membershiptype")
merge_simple("niqabaty_certificationtype")
merge_simple("niqabaty_professionaldevelopmentcategory")
merge_simple("niqabaty_professionaldevelopmenttype")


# ─────────────────────────────────────────────────────────────────────────────
# 3. Users — use only columns that exist in both schemas; skip conflicting users
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== niqabaty_user ===")
src_user_cols = set(get_columns(src, "niqabaty_user"))
dst_user_cols = set(get_columns(dst, "niqabaty_user"))
common_user_cols = [c for c in get_columns(src, "niqabaty_user") if c in dst_user_cols]

src_users = src_cur.execute(
    f'SELECT {", ".join(common_user_cols)} FROM niqabaty_user'
).fetchall()

# Gather existing usernames, emails, phone numbers from destination
existing_usernames = set(
    r[0] for r in dst_cur.execute("SELECT username FROM niqabaty_user").fetchall()
)
existing_emails = set(
    r[0] for r in dst_cur.execute("SELECT email FROM niqabaty_user WHERE email IS NOT NULL").fetchall()
)
existing_phones = set(
    r[0] for r in dst_cur.execute("SELECT phone_number FROM niqabaty_user WHERE phone_number IS NOT NULL").fetchall()
)
existing_ids = set(
    r[0] for r in dst_cur.execute("SELECT id FROM niqabaty_user").fetchall()
)

# Track mapping from source user id → destination user id
user_id_map = {}

placeholders = ", ".join("?" for _ in common_user_cols)
col_str = ", ".join(f'"{c}"' for c in common_user_cols)
sql = f'INSERT OR IGNORE INTO "niqabaty_user" ({col_str}) VALUES ({placeholders})'

inserted_users = 0
skipped_users = 0

for row in src_users:
    uid = row["id"]
    uname = row["username"]
    email = row["email"]
    phone = row["phone_number"] if "phone_number" in common_user_cols else None

    # Check conflicts
    if uname in existing_usernames:
        # Try to find the destination id for remapping
        dst_id = dst_cur.execute(
            "SELECT id FROM niqabaty_user WHERE username=?", (uname,)
        ).fetchone()
        if dst_id:
            user_id_map[uid] = dst_id[0]
        print(f"  SKIP user '{uname}' (username conflict) — source id {uid} → dst id {user_id_map.get(uid,'?')}")
        skipped_users += 1
        continue
    if email and email in existing_emails:
        print(f"  SKIP user '{uname}' (email conflict)")
        skipped_users += 1
        continue
    if phone and phone in existing_phones:
        print(f"  SKIP user '{uname}' (phone conflict)")
        skipped_users += 1
        continue

    # If this id already exists in destination (collision without username match), generate new id
    vals = [row[c] for c in common_user_cols]
    if uid in existing_ids:
        # Remove id from columns to let autoincrement assign new id
        no_id_cols = [c for c in common_user_cols if c != "id"]
        no_id_vals = [row[c] for c in no_id_cols]
        no_id_ph = ", ".join("?" for _ in no_id_cols)
        no_id_col_str = ", ".join(f'"{c}"' for c in no_id_cols)
        dst_cur.execute(
            f'INSERT INTO "niqabaty_user" ({no_id_col_str}) VALUES ({no_id_ph})',
            no_id_vals,
        )
        new_id = dst_cur.lastrowid
        user_id_map[uid] = new_id
        existing_ids.add(new_id)
        existing_usernames.add(uname)
        if email:
            existing_emails.add(email)
        print(f"  INSERT user '{uname}' (id conflict, reassigned to {new_id})")
    else:
        dst_cur.execute(sql, vals)
        user_id_map[uid] = uid
        existing_ids.add(uid)
        existing_usernames.add(uname)
        if email:
            existing_emails.add(email)
        print(f"  INSERT user '{uname}' id={uid}")

    inserted_users += 1

dst.commit()
print(f"\n  Users: inserted={inserted_users}, skipped={skipped_users}")
print(f"  User ID map: {user_id_map}")


# ─────────────────────────────────────────────────────────────────────────────
# 4. user_branches — remap both user_id and branch_id
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== niqabaty_user_branches ===")
src_ub = src_cur.execute("SELECT id, user_id, branch_id FROM niqabaty_user_branches").fetchall()

ins = 0
skip = 0
for row in src_ub:
    src_uid = row["user_id"]
    src_bid = row["branch_id"]
    dst_uid = user_id_map.get(src_uid, src_uid)
    dst_bid = branch_id_map.get(src_bid, src_bid)
    # Check if this pair already exists
    exists = dst_cur.execute(
        "SELECT 1 FROM niqabaty_user_branches WHERE user_id=? AND branch_id=?",
        (dst_uid, dst_bid),
    ).fetchone()
    if exists:
        skip += 1
        continue
    try:
        dst_cur.execute(
            'INSERT INTO "niqabaty_user_branches" (user_id, branch_id) VALUES (?, ?)',
            (dst_uid, dst_bid),
        )
        ins += 1
    except Exception as e:
        print(f"  WARN user_branches: {e}")
        skip += 1

dst.commit()
print(f"  inserted={ins}, skipped={skip}")


# ─────────────────────────────────────────────────────────────────────────────
# 5. Membership types are already merged — merge memberships
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== niqabaty_doctorsmembership ===")
src_m_cols = get_columns(src, "niqabaty_doctorsmembership")
dst_m_cols = set(get_columns(dst, "niqabaty_doctorsmembership"))
common_m_cols = [c for c in src_m_cols if c in dst_m_cols]

src_memberships = src_cur.execute(
    f'SELECT {", ".join(common_m_cols)} FROM niqabaty_doctorsmembership'
).fetchall()

ins = 0
skip = 0
for row in src_memberships:
    # Remap doctor_id and branch_id
    row_dict = {c: row[c] for c in common_m_cols}
    src_uid = row_dict.get("doctor_id")
    src_bid = row_dict.get("branch_id")
    if src_uid is not None:
        row_dict["doctor_id"] = user_id_map.get(src_uid, src_uid)
    if src_bid is not None and src_bid is not None:
        row_dict["branch_id"] = branch_id_map.get(src_bid, src_bid)

    cols_to_use = list(row_dict.keys())
    vals = [row_dict[c] for c in cols_to_use]
    col_str_m = ", ".join(f'"{c}"' for c in cols_to_use)
    ph = ", ".join("?" for _ in cols_to_use)
    try:
        dst_cur.execute(f'INSERT OR IGNORE INTO "niqabaty_doctorsmembership" ({col_str_m}) VALUES ({ph})', vals)
        if dst_cur.rowcount > 0:
            ins += 1
        else:
            skip += 1
    except Exception as e:
        print(f"  WARN membership: {e}")
        skip += 1

dst.commit()
print(f"  inserted={ins}, skipped={skip}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. Payments
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== niqabaty_payment ===")
src_p_cols = get_columns(src, "niqabaty_payment")
dst_p_cols = set(get_columns(dst, "niqabaty_payment"))
common_p_cols = [c for c in src_p_cols if c in dst_p_cols]

src_payments = src_cur.execute(
    f'SELECT {", ".join(common_p_cols)} FROM niqabaty_payment'
).fetchall()

ins = 0
skip = 0
for row in src_payments:
    row_dict = {c: row[c] for c in common_p_cols}
    src_uid = row_dict.get("user_id")
    if src_uid is not None:
        row_dict["user_id"] = user_id_map.get(src_uid, src_uid)

    cols_to_use = list(row_dict.keys())
    vals = [row_dict[c] for c in cols_to_use]
    col_str_p = ", ".join(f'"{c}"' for c in cols_to_use)
    ph = ", ".join("?" for _ in cols_to_use)
    try:
        dst_cur.execute(f'INSERT OR IGNORE INTO "niqabaty_payment" ({col_str_p}) VALUES ({ph})', vals)
        if dst_cur.rowcount > 0:
            ins += 1
        else:
            skip += 1
    except Exception as e:
        print(f"  WARN payment: {e}")
        skip += 1

dst.commit()
print(f"  inserted={ins}, skipped={skip}")


# ─────────────────────────────────────────────────────────────────────────────
# 7. Remaining tables: professionaldevelopment, events, posts, libraryitems,
#    notifications, complaints, medicalreports, certifications, devices
# ─────────────────────────────────────────────────────────────────────────────

def merge_with_user_remap(table, user_fk_fields=None, extra_remap=None):
    """Merge a table, remapping any user FK columns via user_id_map."""
    print(f"\n=== {table} ===")
    if user_fk_fields is None:
        user_fk_fields = ["user_id", "created_by_id", "updated_by_id"]
    src_cols = get_columns(src, table)
    dst_cols_set = set(get_columns(dst, table))
    common = [c for c in src_cols if c in dst_cols_set]
    rows = src_cur.execute(f'SELECT {", ".join(common)} FROM "{table}"').fetchall()
    ins = 0
    skip = 0
    for row in rows:
        row_dict = {c: row[c] for c in common}
        for fk in user_fk_fields:
            if fk in row_dict and row_dict[fk] is not None:
                row_dict[fk] = user_id_map.get(row_dict[fk], row_dict[fk])
        if extra_remap:
            for fk, remap in extra_remap.items():
                if fk in row_dict and row_dict[fk] is not None:
                    row_dict[fk] = remap.get(row_dict[fk], row_dict[fk])
        cols_to_use = list(row_dict.keys())
        vals = [row_dict[c] for c in cols_to_use]
        col_str_t = ", ".join(f'"{c}"' for c in cols_to_use)
        ph = ", ".join("?" for _ in cols_to_use)
        try:
            dst_cur.execute(f'INSERT OR IGNORE INTO "{table}" ({col_str_t}) VALUES ({ph})', vals)
            if dst_cur.rowcount > 0:
                ins += 1
            else:
                skip += 1
        except Exception as e:
            print(f"  WARN {table}: {e}")
            skip += 1
    dst.commit()
    print(f"  {table}: inserted={ins}, skipped={skip}")


merge_with_user_remap("niqabaty_professionaldevelopment")
merge_with_user_remap("niqabaty_professionaldevelopmentregistration",
                      user_fk_fields=["user_id", "created_by_id", "updated_by_id"])
merge_with_user_remap("niqabaty_event")
merge_with_user_remap("niqabaty_post")
merge_with_user_remap("niqabaty_libraryitem")
merge_with_user_remap("niqabaty_notification", user_fk_fields=["user_id", "created_by_id", "updated_by_id"])
merge_with_user_remap("niqabaty_complaint", user_fk_fields=["user_id", "created_by_id", "updated_by_id"])
merge_with_user_remap("niqabaty_medicalreport", user_fk_fields=["user_id", "created_by_id", "updated_by_id"])
merge_with_user_remap("niqabaty_certification", user_fk_fields=["doctor_id", "created_by_id", "updated_by_id"])
merge_with_user_remap("niqabaty_device", user_fk_fields=["user_id"])
merge_with_user_remap("niqabaty_notificationactionhistory", user_fk_fields=["user_id"])
merge_with_user_remap("niqabaty_seennotification", user_fk_fields=["user_id"])
merge_with_user_remap("niqabaty_doctorsmembershiprenewhistory",
                      user_fk_fields=["created_by_id", "updated_by_id"])

src.close()
dst.close()

print("\n\n✅ Migration complete.")
