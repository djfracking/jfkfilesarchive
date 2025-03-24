import json
import re
import logging
from collections import defaultdict
from difflib import SequenceMatcher
from firebase_admin import credentials, firestore, initialize_app

# ----------------------------
# 🔧 CONFIGURATION
# ----------------------------
CREDS_PATH = r"C:\Users\adoro\Desktop\chatjfkfiles-9364c3addedd.json"
MAIN_DOC_COLLECTION = "2025JFK"
GROUP_INDEX_COLLECTION = "groupsIndex"
SIMILARITY_THRESHOLD = 0.75
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

# ----------------------------
# 🔍 Setup logging
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# ----------------------------
# 🔐 Initialize Firebase
# ----------------------------
cred = credentials.Certificate(CREDS_PATH)
initialize_app(cred)
db = firestore.client()

# ----------------------------
# 🔁 Similarity checker
# ----------------------------
def similar(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

# ----------------------------
# 📦 Fetch all groups
# ----------------------------
def fetch_all_groups():
    docs = db.collection(GROUP_INDEX_COLLECTION).stream()
    groups = {}
    for doc in docs:
        group_name = doc.id
        data = doc.to_dict()
        doc_ids = data.get("doc_ids", [])
        groups[group_name] = doc_ids
    logging.info(f"Retrieved {len(groups)} groups from Firestore.")
    return groups

# ----------------------------
# 🔎 Group similarity clustering
# ----------------------------
def find_merge_clusters(groups):
    group_names = list(groups.keys())
    merged = {}
    used = set()

    for i in range(len(group_names)):
        name1 = group_names[i]
        if name1 in used:
            continue
        cluster = [name1]
        for j in range(i + 1, len(group_names)):
            name2 = group_names[j]
            if name2 in used:
                continue
            if similar(name1, name2) >= SIMILARITY_THRESHOLD:
                cluster.append(name2)
                used.add(name2)
        if len(cluster) > 1:
            canonical = min(cluster, key=len)  # choose shortest name
            for name in cluster:
                merged[name] = canonical
            used.update(cluster)
        else:
            merged[name1] = name1
    return merged

# ----------------------------
# 🧠 Update the document's group field
# ----------------------------
def update_group_in_documents(old_group, new_group, doc_ids):
    for doc_id in doc_ids:
        try:
            doc_ref = db.collection(MAIN_DOC_COLLECTION).document(doc_id)
            doc_data = doc_ref.get().to_dict()
            if doc_data and doc_data.get("group") == old_group:
                doc_ref.update({"group": new_group})
                logging.info(f"Updated document '{doc_id}': {old_group} → {new_group}")
        except Exception as e:
            logging.error(f"Error updating document '{doc_id}': {e}")

# ----------------------------
# 🏗️ Apply group merges and update Firestore
# ----------------------------
def apply_group_merges(groups, merge_map):
    new_group_docs = defaultdict(set)
    for group_name, doc_ids in groups.items():
        canonical = merge_map.get(group_name, group_name)
        new_group_docs[canonical].update(doc_ids)

    logging.info(f"Merging {len(groups)} groups into {len(new_group_docs)} canonical groups...")

    for canonical, doc_ids in new_group_docs.items():
        try:
            db.collection(GROUP_INDEX_COLLECTION).document(canonical).set({
                "doc_ids": list(doc_ids),
                "original_group": canonical
            }, merge=True)
            logging.info(f"✅ Updated group index for '{canonical}' with {len(doc_ids)} documents")
        except Exception as e:
            logging.error(f"Error updating group index for '{canonical}': {e}")

        # Update original docs if necessary
        for old_group, merged_to in merge_map.items():
            if merged_to == canonical and old_group != canonical:
                update_group_in_documents(old_group, canonical, groups.get(old_group, []))

    # Clean up old groups
    for old_group in groups:
        if merge_map.get(old_group) != old_group:
            try:
                db.collection(GROUP_INDEX_COLLECTION).document(old_group).delete()
                logging.info(f"🗑️ Deleted old group: {old_group}")
            except Exception as e:
                logging.error(f"Error deleting old group '{old_group}': {e}")

# ----------------------------
# 🚀 Main entry point
# ----------------------------
def main():
    groups = fetch_all_groups()
    merge_map = find_merge_clusters(groups)

    # Show summary of merge clusters
    clusters = defaultdict(list)
    for k, v in merge_map.items():
        if k != v:
            clusters[v].append(k)
    logging.info(f"Found {len(clusters)} merge clusters:")
    for canonical, variants in clusters.items():
        logging.info(f" ➤ {canonical}: {variants}")

    apply_group_merges(groups, merge_map)
    logging.info("✅ Group merging and document updates complete.")

if __name__ == "__main__":
    main()
